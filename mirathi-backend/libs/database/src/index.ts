import { Prisma } from '@prisma/client';

export * from './database.module';
export * from './services/prisma.service';
export * from './services/database.service';

// Re-export Prisma client for advanced usage
export { PrismaClient } from '@prisma/client';

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;
