import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// ============================================================================
// ARCHITECTURAL NOTE: The Role of the DatabaseService
// ============================================================================
// In our microservice architecture, this shared DatabaseService has a very
// specific and limited responsibility: providing universal, business-agnostic
// database utilities.
//
// Its primary function is to offer a standardized health check.
//
// Functionalities like `getStats`, `createBackup`, and `cleanupOldData` have
// been intentionally REMOVED from this shared library for the following reasons:
//
// 1. `getStats()`: This function had knowledge of specific models (`Will`, `Asset`),
//    which created a tight coupling between this library and the services that
//    own those models. A shared library must NEVER depend on the business
//    logic of an individual service. Stats should be gathered by an administrative
//    service that calls the respective microservices' APIs.
//
// 2. `createBackup()`: Database backups are an INFRASTRUCTURE concern, not an
//    application concern. They should be handled by automated jobs (e.g., cron,
//    Kubernetes CronJobs) or managed cloud services (e.g., AWS RDS snapshots),
//    completely outside the application's runtime.
//
// 3. `cleanupOldData()`: Data retention and cleanup policies are business rules
//    owned by the service that owns the data. For example, the `auditing-service`
//    is responsible for cleaning its own logs. This logic belongs within that
//    service, likely triggered by a scheduled task (`@nestjs/schedule`).
// ============================================================================

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

  constructor(private prisma: PrismaService) {}

  /**
   * Performs a health check on the database connection.
   * This is a safe, read-only operation used by observability tools.
   * @returns A HealthCheckResult object indicating the database status.
   */
  async getHealth(): Promise<HealthCheckResult> {
    try {
      // `$queryRaw` is the most reliable way to check raw connectivity.
      // `SELECT 1` is a standard, lightweight ping query.
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.verbose('Database health check successful.');
      return {
        status: HealthStatus.UP,
        details: 'Database connection is healthy.',
      };
    } catch (error) {
      this.logger.error('Database health check failed.', error);
      return {
        status: HealthStatus.DOWN,
        details: 'Database connection failed.',
      };
    }
  }
}