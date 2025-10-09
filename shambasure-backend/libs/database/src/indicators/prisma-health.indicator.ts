import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DatabaseService, HealthStatus } from '../services/database.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(PrismaHealthIndicator.name);
  private readonly key = 'database';

  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    const healthResult = await this.databaseService.getHealth();
    const isHealthy = healthResult.status === HealthStatus.UP;

    const result: HealthIndicatorResult = this.getStatus(this.key, isHealthy, {
      details: healthResult.details,
    });

    if (isHealthy) {
      this.logger.debug('Prisma health indicator check successful.');
      return result;
    }

    throw new HealthCheckError('Prisma health check failed', result);
  }
}
