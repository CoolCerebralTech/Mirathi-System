import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { PrismaHealthIndicator } from '../indicators/prisma-health.indicator';

// ============================================================================
// ARCHITECTURAL NOTE:
// This generic HealthService provides universal, business-agnostic health checks.
// The `detailedHealth` method has been REMOVED because it contained business-
// specific logic (database stats) that violates the principles of a shared library.
// Each microservice can expose its own separate `/stats` endpoint if needed.
// ============================================================================

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly memoryHeapThreshold: number;

  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly configService: ConfigService,
  ) {
    // Get memory threshold from config, defaulting to 256MB.
    this.memoryHeapThreshold =
      this.configService.get<number>('HEALTH_MEMORY_HEAP_THRESHOLD_MB', 256) * 1024 * 1024;
  }

  /**
   * Performs a standard health check for the service.
   * This should be used for Kubernetes liveness/readiness probes.
   */
  async check(): Promise<HealthCheckResult> {
    this.logger.verbose('Performing health check...');
    return this.health.check([
      () => this.prismaHealth.isHealthy(),
      // The service is considered unhealthy if heap memory usage exceeds the configured threshold.
      () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),
    ]);
  }
}