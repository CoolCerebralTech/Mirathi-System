import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@shamba/config';
import { PrismaTransaction } from '../types/prisma.types';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    // 2. Define Log Configuration (Preserved your existing logic)
    const logConfig: Prisma.LogDefinition[] = [];

    if (configService.get('DATABASE_LOG_QUERY')) {
      logConfig.push({ emit: 'event', level: 'query' });
    }
    if (configService.get('DATABASE_LOG_INFO')) {
      logConfig.push({ emit: 'event', level: 'info' });
    }
    logConfig.push({ emit: 'event', level: 'warn' });
    logConfig.push({ emit: 'event', level: 'error' });

    // 3. Create the PostgreSQL Connection Pool
    // This replaces the 'url' in schema.prisma.
    // You can now configure pool settings (max connections, timeouts) here directly.
    const connectionString = configService.get('DATABASE_URL');
    const pool = new Pool({ 
      connectionString,
      // max: 20, // Example: Set max pool size if needed
      // idleTimeoutMillis: 30000
    });

    // 4. Create the Prisma Adapter
    const adapter = new PrismaPg(pool);

    // 5. Pass 'adapter' to the parent constructor
    super({
      adapter, // <--- This acts as the connection source
      log: logConfig,
      errorFormat: configService.isProduction ? 'minimal' : 'pretty',
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
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

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established (Driver Adapter: pg).');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database.', error);
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🛑 Database connection closed.');
  }

  // Preserved your transaction retry logic exactly as it was
  async performTransaction<T>(
    operation: (tx: PrismaTransaction) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction((tx) => operation(tx), {
          maxWait: 5000,
          timeout: 15000,
        });
      } catch (error: unknown) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2034') {
            lastError = error;
            this.logger.warn(
              `Transaction attempt ${attempt} failed with deadlock (P2034), retrying...`,
            );
            await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 100));
            continue;
          }
        }
        throw error;
      }
    }

    throw new Error(
      `Transaction failed after ${maxRetries} attempts. Last error: ${lastError?.message}`,
    );
  }
}