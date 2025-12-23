import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables explicitly for the database package
dotenv.config({ path: resolve(__dirname, '../../.env') });

/**
 * PrismaService
 * ------------------------------------------------------------------
 * Low-level database access layer.
 *
 * Responsibilities:
 * - Initialize PrismaClient with PostgreSQL adapter
 * - Manage connection pool lifecycle
 * - Centralized logging & monitoring
 * - Graceful shutdown handling
 * - Health checks
 *
 * Non-responsibilities:
 * - Business logic
 * - Domain rules
 * - Aggregates
 * - Transactions orchestration (delegated)
 */
@Injectable()
export class PrismaService
  extends PrismaClient<
    Prisma.PrismaClientOptions,
    'query' | 'info' | 'warn' | 'error'
  >
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;
  private shutdownInProgress = false;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const poolConfig: PoolConfig = {
      connectionString: databaseUrl,
      max: Number(process.env.DATABASE_POOL_MAX ?? 20),
      min: Number(process.env.DATABASE_POOL_MIN ?? 2),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: Number(process.env.DATABASE_STATEMENT_TIMEOUT ?? 30_000),
      allowExitOnIdle: false,
    };

    const pool = new Pool(poolConfig);

    pool.on('error', (err) =>
      this.logger.error('PostgreSQL pool error', err),
    );

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      errorFormat:
        process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    this.pool = pool;
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    this.$on('query', (e: Prisma.QueryEvent) => {
      if (e.duration > 1000) {
        this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
      }
    });

    this.$on('warn', (e) => this.logger.warn(e.message));
    this.$on('error', (e) => this.logger.error(e.message));
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Database connection established');

    await this.healthCheck();
  }

  async onModuleDestroy(): Promise<void> {
    this.shutdownInProgress = true;
    this.logger.log('Shutting down database connections');

    await this.$disconnect();
    await this.pool.end();

    this.logger.log('Database shutdown complete');
  }

  /**
   * Health check used by readiness / liveness probes
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    latency: number;
    pool: {
      total: number;
      idle: number;
      waiting: number;
    };
  }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        latency: Date.now() - start,
        pool: {
          total: this.pool.totalCount,
          idle: this.pool.idleCount,
          waiting: this.pool.waitingCount,
        },
      };
    } catch {
      return {
        healthy: false,
        latency: -1,
        pool: {
          total: 0,
          idle: 0,
          waiting: 0,
        },
      };
    }
  }

  isShuttingDown(): boolean {
    return this.shutdownInProgress;
  }
}
