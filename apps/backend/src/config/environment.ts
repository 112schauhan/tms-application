import { config } from 'dotenv';

config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
} as const;
