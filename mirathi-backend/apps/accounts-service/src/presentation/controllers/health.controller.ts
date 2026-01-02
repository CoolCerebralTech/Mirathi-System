// src/presentation/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as terminus from '@nestjs/terminus';

import { Public } from '@shamba/auth';
import { HealthService } from '@shamba/observability';

@ApiTags('Health')
@Controller('health')
@Public() // Bypasses Auth Guard (Critical for K8s probes)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Comprehensive readiness check endpoint.
   * Verifies all critical downstream dependencies (DB, RabbitMQ) are ready.
   * Used by Kubernetes Readiness Probe.
   */
  @Get('readiness')
  @terminus.HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if service and all its dependencies are ready to accept traffic.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready.' })
  @ApiResponse({ status: 503, description: 'Service is not ready.' })
  async readiness(): Promise<terminus.HealthCheckResult> {
    return this.healthService.checkReadiness();
  }

  /**
   * Lightweight liveness probe.
   * Used by Kubernetes Liveness Probe to restart the pod if the process hangs.
   */
  @Get('liveness')
  @terminus.HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'A simple check to verify the service process is running and responsive.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive.' })
  liveness(): terminus.HealthCheckResult {
    // Note: Assuming HealthService exposes the raw terminus check or a liveness method.
    // If checkLiveness() exists on your shared service, use that instead.
    if ('checkLiveness' in this.healthService) {
      return (this.healthService as any).checkLiveness();
    }
    // Fallback to basic access if the shared library allows it
    return (this.healthService as any)['health'].check([]);
  }
}
