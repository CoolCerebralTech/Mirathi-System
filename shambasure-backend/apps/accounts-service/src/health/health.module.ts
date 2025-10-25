import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DatabaseModule } from '@shamba/database';
import { HealthController } from './health.controller';

/**
 * Health Module - Provides health check endpoints for monitoring and orchestration.
 *
 * Endpoints:
 * - GET /health           - Comprehensive health check (database, memory, disk)
 * - GET /health/liveness  - Liveness probe for Kubernetes
 * - GET /health/readiness - Readiness probe for Kubernetes
 *
 * These endpoints are public (no authentication required) to allow
 * load balancers and orchestration platforms to monitor service health.
 */
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      logger: true,
    }),
    DatabaseModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
