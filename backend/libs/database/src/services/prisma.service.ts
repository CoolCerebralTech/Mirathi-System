import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaTransaction } from '../types/prisma.types';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    // Dynamically configure PrismaClient based on environment variables
    const logConfig = [];
    if (configService.get<boolean>('DATABASE_LOG_QUERY')) {
      logConfig.push({ emit: 'event', level: 'query' } as const);
    }
    if (configService.get<boolean>('DATABASE_LOG_INFO')) {
      logConfig.push({ emit: 'event', level: 'info' } as const);
    }
    logConfig.push({ emit: 'event', level: 'warn' } as const);
    logConfig.push({ emit: 'event', level: 'error' } as const);

    super({
      log: logConfig,
      errorFormat: 'pretty',
    });

    this.setupEventListeners();
  }

  // --- Type-Safe Event Listeners ---
  private setupEventListeners() {
    // Use proper Prisma event types instead of 'any'
    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });

    this.$on('info', (e: Prisma.LogEvent) => {
      this.logger.log(`Info: ${e.message} (${e.target})`);
    });

    this.$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(`Warning: ${e.message} (${e.target})`);
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Error: ${e.message} (${e.target})`);
    });
  }

  // --- NestJS Lifecycle Hooks ---
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection has been established successfully.');
    } catch (error) {
      this.logger.error('Failed to establish database connection.', error);
      // Exit gracefully if the database is not available on startup
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection has been closed.');
  }

  /**
   * IMPORTANT: Graceful shutdown is handled by NestJS.
   * Ensure `app.enableShutdownHooks()` is called in your `main.ts` file.
   * This service's `onModuleDestroy` will be called automatically.
   */

  // --- High-Level Business Logic Methods ---

  /**
   * Provides a fully type-safe transactional operation with automatic retries on deadlocks.
   * @param operation A callback function that receives a transaction client (`tx`).
   * @param maxRetries The maximum number of times to retry on a deadlock error.
   * @returns The result of the operation.
   */
  async performTransaction<T>(
    operation: (tx: PrismaTransaction) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the correct PrismaTransaction type for the transaction client
        return await this.$transaction(
          (tx) => operation(tx),
          {
            maxWait: 5000, // 5 seconds
            timeout: 15000, // 15 seconds
          }
        );
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // Retry on deadlock (P2034) or other transient transaction errors
          if (error.code === 'P2034') {
            lastError = error;
            this.logger.warn(
              `Transaction attempt ${attempt} failed with deadlock (P2034), retrying...`
            );
            // Exponential backoff
            await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 100));
            continue;
          }
        }
        // Non-retryable error
        throw error;
      }
    }

    throw new Error(`Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
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