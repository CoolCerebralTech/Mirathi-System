import { Injectable } from '@nestjs/common';
import { HealthCheckService, MemoryHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@shamba/database';
import { ConfigService } from '@shamba/config';
import { MessagingHealthIndicator } from './messaging-health.indicator';

@Injectable()
export class HealthService {
  private readonly memoryHeapThreshold: number;

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly messagingHealth: MessagingHealthIndicator,
    private readonly configService: ConfigService, // Injected to get the threshold
  ) {
    // --- THE FIX IS HERE ---
    // We get the threshold from our type-safe ConfigService. Our Joi schema
    // is responsible for providing the default value if it's not in the .env file.
    const thresholdInMb = this.configService.get('HEALTH_MEMORY_HEAP_THRESHOLD_MB');
    this.memoryHeapThreshold = thresholdInMb * 1024 * 1024;
    // -----------------------
  }

  /**
   * Performs a readiness check, verifying all critical downstream dependencies.
   * This should be used for Kubernetes readiness probes.
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.isHealthy(),
      () => this.messagingHealth.isHealthy(),
      () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),
    ]);
  }
}
