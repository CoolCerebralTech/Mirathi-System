import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@shamba/auth';
import { HealthService } from '@shamba/observability';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  // 👇 SIMPLIFIED CONSTRUCTOR: Only inject the HealthService
  constructor(private readonly healthService: HealthService) {}

  /**
   * Comprehensive readiness check endpoint.
   * Verifies all critical downstream dependencies are ready.
   */
  @Get('readiness') // Changed endpoint to /readiness for clarity
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if service and all its dependencies are ready to accept traffic.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready.' })
  @ApiResponse({ status: 503, description: 'Service is not ready.' })
  async readiness(): Promise<HealthCheckResult> {
    // 👇 DELEGATE ENTIRELY TO THE SERVICE
    // The service already has all the logic and thresholds defined.
    return this.healthService.checkReadiness();
  }

  /**
   * Lightweight liveness probe.
   * Used by Kubernetes to verify that the service is responsive.
   */
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'A simple check to verify the service process is running and responsive.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive.' })
  async liveness(): Promise<HealthCheckResult> {
    // A liveness check should be very simple and not check dependencies.
    // The HealthCheckService is available on our HealthService instance.
    return this.healthService['health'].check([]);
  }
}
