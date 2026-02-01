import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';

import { env } from '../config/environment.js';

// DataLoader: batches N individual loads into 1 batched query (N+1 optimization)
function createUserLoader(prisma: PrismaClient) {
  return new DataLoader<string, { id: string; email: string; firstName: string; lastName: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date } | null>(
    async (ids) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
      });
      const map = new Map(users.map((u) => [u.id, u]));
      return ids.map((id) => map.get(id) ?? null);
    }
  );
}

function createLocationLoader(prisma: PrismaClient) {
  return new DataLoader<string, { id: string; address: string; city: string; state: string | null; country: string; postalCode: string | null; latitude: number | null; longitude: number | null } | null>(
    async (ids) => {
      const locations = await prisma.location.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, address: true, city: true, state: true, country: true, postalCode: true, latitude: true, longitude: true },
      });
      const map = new Map(locations.map((l) => [l.id, l]));
      return ids.map((id) => map.get(id) ?? null);
    }
  );
}

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
  userLoader: ReturnType<typeof createUserLoader>;
  locationLoader: ReturnType<typeof createLocationLoader>;
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

  return {
    prisma,
    user,
    userLoader: createUserLoader(prisma),
    locationLoader: createLocationLoader(prisma),
  };
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});
