export * from './database.module';
export * from './services/prisma.service';
export * from './services/database.service';
export * from './services/health.service';
export * from './types/prisma.types';
export * from './indicators/prisma-health.indicator';

// Re-export Prisma client for advanced usage
export { PrismaClient } from '@prisma/client';

export { Decimal } from '@prisma/client/runtime/library';
