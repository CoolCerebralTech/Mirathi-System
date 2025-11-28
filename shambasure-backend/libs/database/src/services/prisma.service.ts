import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaTransaction } from '../types/prisma.types';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { Pool, PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load .env from database package root
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * Production-Ready PrismaService for Prisma 7
 * 
 * Features:
 * - Connection pooling with optimal settings
 * - Graceful shutdown handling
 * - Transaction retry logic with exponential backoff
 * - Health check support
 * - Performance monitoring
 * - Error tracking and recovery
 */
@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private shutdownInProgress = false;
  private activeTransactions = 0;

  constructor() {
    // 1. Get environment variables with proper type conversion
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const poolMax = parseInt(process.env.DATABASE_POOL_MAX || '20', 10);
    const poolMin = parseInt(process.env.DATABASE_POOL_MIN || '2', 10);
    const statementTimeout = parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '30000', 10);
    const isProduction = process.env.NODE_ENV === 'production';
    const logQuery = process.env.DATABASE_LOG_QUERY === 'true';
    const logInfo = process.env.DATABASE_LOG_INFO === 'true';

    // 2. Configure connection pool with production-ready settings
    const poolConfig: PoolConfig = {
      connectionString: databaseUrl,
      
      // Connection Pool Settings (properly typed as numbers)
      max: poolMax,                     // Max connections
      min: poolMin,                     // Min idle connections
      idleTimeoutMillis: 30000,         // Close idle connections after 30s
      connectionTimeoutMillis: 5000,    // Timeout for acquiring connection
      
      // Health & Recovery
      allowExitOnIdle: false,           // Keep pool alive
      
      // Statement timeout (properly typed)
      statement_timeout: statementTimeout,
    };

    // 3. Create connection pool
    const pool = new Pool(poolConfig);

    // 4. Setup pool event handlers for monitoring
    pool.on('error', (err) => {
      this.logger.error('Unexpected database pool error', err);
    });

    pool.on('connect', () => {
      this.logger.debug('New database connection established in pool');
    });

    pool.on('remove', () => {
      this.logger.debug('Connection removed from pool');
    });

    // 5. Create Prisma adapter
    const adapter = new PrismaPg(pool);

    // 6. Configure Prisma logging
    const logConfig: Prisma.LogDefinition[] = [];

    if (logQuery) {
      logConfig.push({ emit: 'event', level: 'query' });
    }
    if (logInfo) {
      logConfig.push({ emit: 'event', level: 'info' });
    }
    logConfig.push({ emit: 'event', level: 'warn' });
    logConfig.push({ emit: 'event', level: 'error' });

    // 7. Initialize PrismaClient with adapter (MUST call super() before accessing 'this')
    super({
      adapter,
      log: logConfig,
      errorFormat: isProduction ? 'minimal' : 'pretty',
    });

    // 8. Store pool reference AFTER super() call
    this.pool = pool;

    // 9. Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Setup Prisma event listeners for logging and monitoring
   */
  private setupEventListeners() {
    this.$on('query', (e: Prisma.QueryEvent) => {
      // Log slow queries (> 1000ms)
      if (e.duration > 1000) {
        this.logger.warn(`SLOW QUERY (${e.duration}ms): ${e.query}`);
      } else {
        this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
      }
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

  /**
   * Initialize database connection on module startup
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established (Prisma 7 + PostgreSQL adapter).');
      
      // Log connection pool stats
      this.logger.log(`Connection pool: max=${this.pool.options.max}, min=${this.pool.options.min || 0}`);
      
      // Test the connection
      await this.healthCheck();
    } catch (error) {
      this.logger.error('❌ Failed to connect to database.', error);
      throw error; // Let NestJS handle the startup failure
    }
  }

  /**
   * Graceful shutdown with connection draining
   */
  async onModuleDestroy() {
    this.shutdownInProgress = true;
    this.logger.log('🛑 Initiating graceful database shutdown...');

    // Wait for active transactions to complete (max 10 seconds)
    const maxWaitTime = 10000;
    const startTime = Date.now();
    
    while (this.activeTransactions > 0 && Date.now() - startTime < maxWaitTime) {
      this.logger.log(`Waiting for ${this.activeTransactions} active transactions to complete...`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (this.activeTransactions > 0) {
      this.logger.warn(`Forcing shutdown with ${this.activeTransactions} transactions still active`);
    }

    // Disconnect Prisma Client
    await this.$disconnect();
    
    // Close the connection pool
    await this.pool.end();
    
    this.logger.log('✅ Database connection closed gracefully.');
  }

  /**
   * Health check endpoint for monitoring
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number; poolStats: any }> {
    try {
      const startTime = Date.now();
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        healthy: true,
        latency,
        poolStats: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        healthy: false,
        latency: -1,
        poolStats: null,
      };
    }
  }

  /**
   * Enhanced transaction handler with retry logic and deadlock handling
   */
  async performTransaction<T>(
    operation: (tx: PrismaTransaction) => Promise<T>,
    options?: {
      maxRetries?: number;
      timeout?: number;
      maxWait?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const timeout = options?.timeout ?? 15000;
    const maxWait = options?.maxWait ?? 5000;
    const isolationLevel = options?.isolationLevel;

    let lastError: Error | undefined;

    // Check if shutdown is in progress
    if (this.shutdownInProgress) {
      throw new Error('Cannot start transaction: service is shutting down');
    }

    // Track active transactions
    this.activeTransactions++;

    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await this.$transaction(
            (tx) => operation(tx),
            {
              maxWait,
              timeout,
              isolationLevel,
            },
          );
          
          return result;
        } catch (error: unknown) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle deadlock (P2034) - retry with exponential backoff
            if (error.code === 'P2034') {
              lastError = error;
              this.logger.warn(
                `Transaction attempt ${attempt}/${maxRetries} failed with deadlock (P2034), retrying...`,
              );
              
              if (attempt < maxRetries) {
                const backoffMs = Math.min(Math.pow(2, attempt) * 100, 5000);
                await new Promise((res) => setTimeout(res, backoffMs));
                continue;
              }
            }
            
            // Handle serialization failure (P2028) - also retry
            if (error.code === 'P2028') {
              lastError = error;
              this.logger.warn(
                `Transaction attempt ${attempt}/${maxRetries} failed with serialization error (P2028), retrying...`,
              );
              
              if (attempt < maxRetries) {
                const backoffMs = Math.min(Math.pow(2, attempt) * 100, 5000);
                await new Promise((res) => setTimeout(res, backoffMs));
                continue;
              }
            }
          }
          
          // For non-retryable errors, throw immediately
          throw error;
        }
      }

      // If we exhausted all retries
      throw new Error(
        `Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`,
      );
    } finally {
      this.activeTransactions--;
    }
  }

  /**
   * Batch operations helper for bulk inserts/updates
   */
  async batchOperation<T>(
    items: T[],
    operation: (batch: T[]) => Promise<void>,
    batchSize = 100,
  ): Promise<void> {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    this.logger.log(`Processing ${items.length} items in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      try {
        await operation(batches[i]);
        this.logger.debug(`Batch ${i + 1}/${batches.length} completed`);
      } catch (error) {
        this.logger.error(`Batch ${i + 1}/${batches.length} failed`, error);
        throw error;
      }
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
      max: this.pool.options.max,
      min: this.pool.options.min || 0,
    };
  }

  /**
   * Check if service is ready to accept requests
   */
  isReady(): boolean {
    return !this.shutdownInProgress;
  }
}
