import { Injectable } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { ConfigService } from '@shamba/config';

// Custom health indicators
import {
  MessagingHealthIndicator,
  NotificationHealthIndicator,
  PrismaHealthIndicator,
} from './indicators';

@Injectable()
export class HealthService {
  private readonly memoryHeapThreshold: number;
  private readonly diskThreshold: number;

  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly messagingHealth: MessagingHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly notificationHealth: NotificationHealthIndicator,
    private readonly configService: ConfigService,
  ) {
    // --- THE FIX IS HERE ---
    // Values from ConfigService are often strings, so we parse them safely.
    const heapThresholdMbRaw = this.configService.get('HEALTH_MEMORY_HEAP_THRESHOLD_MB');
    const diskThresholdMbRaw = this.configService.get('HEALTH_DISK_THRESHOLD_MB');

    const heapThresholdMb = Number(heapThresholdMbRaw) || 512; // default 512MB if invalid or missing
    const diskThresholdMb = Number(diskThresholdMbRaw) || 512;

    this.memoryHeapThreshold = heapThresholdMb * 1024 * 1024;
    this.diskThreshold = diskThresholdMb * 1024 * 1024;
    // -----------------------
  }

  /**
   * Performs a readiness check, verifying all critical downstream dependencies.
   * This should be used for Kubernetes readiness probes.
   */
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Core messaging system
      () => this.messagingHealth.isHealthy(),

      // Database connection
      () => this.prismaHealth.pingCheck('database'),

      // Notification service
      () => this.notificationHealth.isHealthy('notification'),

      // Memory heap usage
      () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),

      // Disk usage
      () =>
        this.disk.checkStorage('disk_storage', {
          threshold: this.diskThreshold,
          path: '/',
        }),
    ]);
  }
}
