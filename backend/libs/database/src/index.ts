export * from './modules/database.module';
export * from './services/prisma.service';
export * from './services/database.service';
export * from './services/health.service';
export * from './types/prisma.types';

// Re-export Prisma client for advanced usage
export { PrismaClient } from '@prisma/client';