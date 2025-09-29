import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DatabaseService, HealthStatus } from '../services/database.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);
  private readonly key = 'database'; // The key for our health check result
    getStatus: any;

  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  /**
   * Checks the health of the database using our custom DatabaseService.
   * This is the standard pattern for creating a custom health indicator.
   */
  async isHealthy(): Promise<HealthIndicatorResult> {
    const healthResult = await this.databaseService.getHealth();

    const isHealthy = healthResult.status === HealthStatus.UP;

    // `getStatus` is a utility from HealthIndicator that formats the result.
    const result = this.getStatus(this.key, isHealthy, {
      details: healthResult.details,
    });

    if (isHealthy) {
      this.logger.verbose('Prisma health indicator check successful.');
      return result;
    }

    // If not healthy, throw an error that Terminus will catch and handle.
    throw new HealthCheckError('Prisma health check failed', result);
  }
}