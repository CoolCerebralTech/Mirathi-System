import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * High-level database service
 *
 * Purpose:
 * - Acts as a façade over PrismaService
 * - Provides stable, intention-revealing database signals
 * - Shields upper layers from Prisma-specific details
 *
 * NOTE:
 * - This service does NOT manage connections or transactions
 * - All low-level mechanics live in PrismaService
 */
export enum HealthStatus {
  UP = 'up',
  DOWN = 'down',
}

export interface HealthCheckResult {
  status: HealthStatus;
  details: string;
  latency?: number;
}

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs a high-level database health check.
   *
   * This method:
   * - Delegates probing to PrismaService
   * - Translates results into application-friendly semantics
   * - Is safe for observability and future reuse
   *
   * Intended usage:
   * - Monitoring adapters
   * - Future system-wide health aggregators
   * - Non-Prisma-aware consumers
   */
  async getHealth(): Promise<HealthCheckResult> {
    const health = await this.prisma.healthCheck();

    if (!health.healthy) {
      this.logger.warn('Database reported unhealthy state.');
      return {
        status: HealthStatus.DOWN,
        details: 'Database connection is unhealthy.',
      };
    }

    this.logger.debug(
      `Database health check OK (latency: ${health.latency}ms).`,
    );

    return {
      status: HealthStatus.UP,
      details: 'Database connection is healthy.',
      latency: health.latency,
    };
  }
}
