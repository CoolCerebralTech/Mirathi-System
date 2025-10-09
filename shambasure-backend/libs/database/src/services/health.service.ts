import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, MemoryHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { ConfigService } from '@shamba/config';
import { PrismaHealthIndicator } from '../indicators/prisma-health.indicator';

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
    this.memoryHeapThreshold =
      this.configService.get('HEALTH_MEMORY_HEAP_THRESHOLD_MB') * 1024 * 1024;
  }

  async check(): Promise<HealthCheckResult> {
    this.logger.debug('Performing health check...');
    return this.health.check([
      () => this.prismaHealth.isHealthy(),
      () => this.memory.checkHeap('memory_heap', this.memoryHeapThreshold),
    ]);
  }
}
