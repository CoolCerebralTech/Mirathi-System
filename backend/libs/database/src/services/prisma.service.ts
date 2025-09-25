import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService 
  extends PrismaClient 
  implements OnModuleInit, OnModuleDestroy 
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
      errorFormat: 'colorless',
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.$on('query' as never, (e: any) => {
      this.logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
    });

    this.$on('info' as never, (e: any) => {
      this.logger.log(`Info: ${e.message}`);
    });

    this.$on('warn' as never, (e: any) => {
      this.logger.warn(`Warning: ${e.message}`);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Error: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  async enableShutdownHooks() {
    process.on('beforeExit', async () => {
      await this.$disconnect();
    });
  }

  /**
   * Transaction with retry logic for deadlocks
   */
  async transactional<T>(
    operation: (tx: PrismaService) => Promise<T>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.$transaction(async (tx) => {
          return await operation(tx as PrismaService);
        });
      } catch (error: any) {
        lastError = error;
        
        // Retry on deadlock or serialization failure
        if (error.code === 'P2034' || error.code === 'P2035') {
          this.logger.warn(`Transaction attempt ${attempt} failed with ${error.code}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100)); // Exponential backoff
          continue;
        }
        
        // Non-retryable error
        throw error;
      }
    }
    
    throw lastError!;
  }

  /**
   * Soft delete extension (optional - if you want soft deletes)
   */
  get softDelete() {
    return this.$extends({
      query: {
        async $allOperations({ operation, model, args, query }) {
          if (operation === 'delete' || operation === 'deleteMany') {
            // Convert delete to update for soft delete
            if (operation === 'delete') {
              return (this as any).update({
                ...args,
                data: { deletedAt: new Date() }
              });
            }
            if (operation === 'deleteMany') {
              return (this as any).updateMany({
                ...args,
                data: { deletedAt: new Date() }
              });
            }
          }
          return query(args);
        },
      },
    });
  }
}