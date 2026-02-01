import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/environment.js';
import { typeDefs } from './graphql/schemas/index.js';
import { resolvers } from './graphql/resolvers/index.js';
import { createContext, GraphQLContext } from './types/context.js';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // CORS - allow frontend to connect
  app.use(cors<cors.CorsRequest>({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Security middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));
  
  // Compression
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: env.nodeEnv !== 'production',
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        code: (error.extensions?.code as string) || 'INTERNAL_SERVER_ERROR',
        path: error.path,
      };
    },
  });

  await server.start();

  // Apply GraphQL middleware
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    }),
  );

  // Health check endpoint (per TMS docs: status 'healthy')
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Start server
  await new Promise<void>((resolve) => httpServer.listen({ port: env.port }, resolve));
  
  console.log(`🚀 Server ready at http://localhost:${env.port}/graphql`);
  console.log(`📊 Health check at http://localhost:${env.port}/health`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
