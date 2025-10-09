import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { ConfigService } from '@shamba/config';
import { PrismaTransaction } from '../types/prisma.types';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const logConfig: Prisma.LogDefinition[] = [];

    if (configService.get('DATABASE_LOG_QUERY')) {
      logConfig.push({ emit: 'event', level: 'query' });
    }
    if (configService.get('DATABASE_LOG_INFO')) {
      logConfig.push({ emit: 'event', level: 'info' });
    }
    logConfig.push({ emit: 'event', level: 'warn' });
    logConfig.push({ emit: 'event', level: 'error' });

    super({
      log: logConfig,
      errorFormat: configService.isProduction ? 'minimal' : 'pretty', // ✅ cleaner logs in prod
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
      this.logger.log('✅ Database connection established.');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database.', error);
      // Configurable: exit or throw
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🛑 Database connection closed.');
  }

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
