import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult } from '@nestjs/terminus';
import { Public } from '@shamba/auth';

// 👇 Use shared observability abstractions
import { HealthService } from '@shamba/observability';
import { PrismaHealthIndicator } from '@shamba/observability';
import { MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * Comprehensive health check endpoint.
   * Used for manual or automated health diagnostics.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Comprehensive health check',
    description: 'Checks database, memory, and disk health status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          example: {
            database: { status: 'up' },
            memory_heap: { status: 'up' },
            memory_rss: { status: 'up' },
            storage: { status: 'up' },
          },
        },
      },
    },
  })
  async check(): Promise<HealthCheckResult> {
    return this.healthService['health'].check([
      // Database connectivity
      () => this.prisma.pingCheck('database'),

      // Memory checks
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Disk storage availability
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Lightweight liveness probe.
   * Used by Kubernetes or orchestrators to verify that the service is responsive.
   */
  @Get('liveness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description: 'Simple check to verify service is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is alive.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  async liveness(): Promise<HealthCheckResult> {
    return this.healthService['health'].check([]);
  }

  /**
   * Readiness probe.
   * Ensures critical dependencies (like DB) are ready to serve traffic.
   */
  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description: 'Checks if service is ready to accept traffic (database connectivity).',
  })
  @ApiResponse({ status: 200, description: 'Service is ready.' })
  @ApiResponse({ status: 503, description: 'Service is not ready.' })
  async readiness(): Promise<HealthCheckResult> {
    return this.healthService['health'].check([() => this.prisma.pingCheck('database')]);
  }
}
