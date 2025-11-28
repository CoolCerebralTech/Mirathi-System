import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

// Your actual service that handles routing and can check downstream health
import { ProxyService } from '../../application/services/proxy.service';

// This decorator should come from your shared @shamba/auth library
import { Public } from '@shamba/auth';

/**
 * Gateway-Specific Health Indicator for Downstream Services.
 * NOTE: For final production, this class would ideally be in its own file
 * (e.g., 'downstream-services.health.ts'), but is kept here for development simplicity.
 */

// Define the shape of a downstream service health entry
interface ServiceHealth {
  status: string; // keep it simple, no redundant union
  [key: string]: unknown;
}

// Define the full map we *expect* after normalizing
type ServicesHealthMap = Record<string, ServiceHealth>;

@Injectable()
export class DownstreamServicesHealthIndicator extends HealthIndicator {
  constructor(private readonly gatewayService: ProxyService) {
    super();
  }

  /**
   * Checks if critical downstream services are healthy.
   * A service is considered healthy if it returns a 'up' status.
   * If any CRITICAL service is down, this check will fail.
   * @param key - The key for the health check result object.
   */
  async check(key: string): Promise<HealthIndicatorResult> {
    // GatewayService may return mixed shapes (boolean, object, etc.)
    const rawServicesHealth = await this.gatewayService.getServicesHealth();

    // Normalize into a consistent map
    const servicesHealth: ServicesHealthMap = Object.fromEntries(
      Object.entries(rawServicesHealth).map(([name, value]) => {
        if (typeof value === 'object' && value !== null && 'status' in value) {
          return [name, value as ServiceHealth];
        }
        // fallback: wrap boolean/unknown into { status: string }
        return [name, { status: String(value) }];
      }),
    );

    // Define which services are absolutely essential for the gateway to be "ready"
    const criticalServices: string[] = ['accounts_service', 'succession_service'];

    const unhealthyCriticalServices: Array<Record<string, string>> = [];

    for (const serviceName of criticalServices) {
      const serviceStatus = servicesHealth[serviceName]?.status;
      if (serviceStatus !== 'up') {
        unhealthyCriticalServices.push({
          [serviceName]: serviceStatus ?? 'offline',
        });
      }
    }

    const isHealthy = unhealthyCriticalServices.length === 0;

    const result = this.getStatus(key, isHealthy, {
      details: servicesHealth,
    });

    if (isHealthy) {
      return result;
    }

    // This throw is crucial. It tells Terminus the check has failed,
    // which results in a 503 HTTP status code.
    throw new HealthCheckError('Critical downstream services are unhealthy', result);
  }
}

@ApiTags('Health Checks')
@Controller('health')
@Public() // Mark all health endpoints as publicly accessible
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly downstreamHealthIndicator: DownstreamServicesHealthIndicator,
  ) {}

  /**
   * Liveness Probe: Is the application process running?
   * Used by orchestrators (like Kubernetes) to decide if the container needs a restart.
   * This MUST be fast and have NO external dependencies.
   */
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness Probe (Is the app running?)' })
  @ApiResponse({ status: 200, description: 'Service is alive.' })
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  /**
   * Readiness Probe: Is the application ready to accept new traffic?
   * Used by orchestrators to decide if the container should be added to the load balancer.
   * This SHOULD check critical external dependencies.
   */
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness Probe (Is the app ready for traffic?)' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic.' })
  @ApiResponse({ status: 503, description: 'Service is not ready (critical dependencies failed).' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // 1. System resources are okay
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      // 2. Critical downstream services are reachable
      () => this.downstreamHealthIndicator.check('downstream_services'),
    ]);
  }
}
