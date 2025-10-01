import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaTransaction } from '../types/prisma.types';
export declare class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'> implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor(configService: ConfigService);
    private setupEventListeners;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * IMPORTANT: Graceful shutdown is handled by NestJS.
     * Ensure `app.enableShutdownHooks()` is called in your `main.ts` file.
     * This service's `onModuleDestroy` will be called automatically.
     */
    /**
     * Provides a fully type-safe transactional operation with automatic retries on deadlocks.
     * @param operation A callback function that receives a transaction client (`tx`).
     * @param maxRetries The maximum number of times to retry on a deadlock error.
     * @returns The result of the operation.
     */
    performTransaction<T>(operation: (tx: PrismaTransaction) => Promise<T>, maxRetries?: number): Promise<T>;
}
/**
 * NOTE ON SOFT DELETES:
 * While powerful, Prisma extensions for soft deletes can add significant complexity
 * and have edge cases (e.g., with unique constraints, cascading deletes).
 *
 * For Shamba Sure's critical data, we will start with standard (hard) deletes.
 * If a soft-delete requirement becomes necessary (e.g., for user deactivation),
 * we will implement it explicitly in the relevant service with an `isActive` or
 * `deactivatedAt` field, rather than globally overriding the delete behavior.
 * This approach is more explicit, less "magical," and easier to debug.
 */ 
//# sourceMappingURL=prisma.service.d.ts.map