import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@shamba/database';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async pingCheck(key = 'database'): Promise<HealthIndicatorResult> {
    try {
      // Simple connectivity check
      await this.prisma.$queryRawUnsafe('SELECT 1'); // safer type-wise for eslint

      return this.getStatus(key, true, { message: 'Database connection OK' });
    } catch (err: unknown) {
      // Strictly type `err` as unknown for safety
      const error = err instanceof Error ? err : new Error('Unknown error');

      this.logger.error('Database health check failed', error.message);

      const isDev = (process.env.NODE_ENV ?? 'production') === 'development';

      const result = this.getStatus(key, false, {
        message: 'Database connection failed',
        error: isDev ? error.message : undefined,
      });

      throw new HealthCheckError('Prisma check failed', result);
    }
  }
}
