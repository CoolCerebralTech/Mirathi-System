import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export enum HealthStatus {
  UP = 'up',
  DOWN = 'down',
}

export interface HealthCheckResult {
  status: HealthStatus;
  details: string;
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs a health check on the database connection.
   * This is a safe, read-only operation used by observability tools.
   * @returns A HealthCheckResult object indicating the database status.
   */
  async getHealth(): Promise<HealthCheckResult> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - start;

      this.logger.debug(`Database health check successful (ping: ${duration}ms).`);
      return {
        status: HealthStatus.UP,
        details: `Database connection is healthy (ping: ${duration}ms).`,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error('Database health check failed.', err.stack);
      return {
        status: HealthStatus.DOWN,
        details: `Database connection failed: ${err.message}`,
      };
    }
  }
}
