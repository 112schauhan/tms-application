import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';

import { env } from '../config/environment.js';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Create connection pool
const pool = globalForPrisma.pool ?? new pg.Pool({ 
  connectionString: env.databaseUrl 
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: env.nodeEnv === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  });

// In development, save to global to prevent multiple instances
if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

// User interface for context
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  firstName: string;
  lastName: string;
}

// GraphQL Context type
export interface GraphQLContext {
  prisma: PrismaClient;
  user: User | null;
}

// Create context for each request
export async function createContext({ req }: { req: Request }): Promise<GraphQLContext> {
  let user: User | null = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(
        token,
        env.jwtSecret
      ) as { userId: string; email: string; role: 'ADMIN' | 'EMPLOYEE' };

      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
      });

      if (dbUser && dbUser.isActive) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role as 'ADMIN' | 'EMPLOYEE',
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
        };
      }
    } catch (error) {
      console.warn('Invalid token:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return { prisma, user };
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});
