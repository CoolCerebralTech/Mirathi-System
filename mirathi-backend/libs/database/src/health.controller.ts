import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

/**
 * Production-ready health check controller
 *
 * Supports:
 * - Kubernetes liveness/readiness probes
 * - Load balancer checks
 * - Observability systems
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basic health check
   * GET /health
   */
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'database',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Database health check
   * GET /health/database
   */
  @Get('database')
  async checkDatabase() {
    const health = await this.prisma.healthCheck();
    const isReady = !this.prisma.isShuttingDown();

    const status =
      health.healthy && isReady ? 'healthy' : 'unhealthy';

    return {
      status,
      ready: isReady,
      database: {
        connected: health.healthy,
        latency: health.latency,
        latencyStatus: this.getLatencyStatus(health.latency),
      },
      pool: {
        ...health.pool,
        utilization: this.calculatePoolUtilization(health.pool),
        status: this.getPoolStatus(health.pool),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Kubernetes readiness probe
   * GET /health/ready
   */
  @Get('ready')
  async readiness() {
    const health = await this.prisma.healthCheck();
    const isReady = !this.prisma.isShuttingDown();

    if (!health.healthy || !isReady) {
      throw new HttpException(
        {
          status: 'not ready',
          reason: !health.healthy
            ? 'Database unhealthy'
            : 'Service shutting down',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return {
      status: 'ready',
      latency: health.latency,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Kubernetes liveness probe
   * GET /health/live
   */
  @Get('live')
  live() {
    const memory = process.memoryUsage();

    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: {
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep diagnostic health check
   * GET /health/deep
   */
  @Get('deep')
  async deepCheck() {
    const health = await this.prisma.healthCheck();
    const isReady = !this.prisma.isShuttingDown();
    const memory = process.memoryUsage();

    return {
      status: health.healthy && isReady ? 'healthy' : 'unhealthy',
      service: {
        name: 'database',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV ?? 'development',
        uptime: process.uptime(),
      },
      database: {
        connected: health.healthy,
        latency: health.latency,
        latencyStatus: this.getLatencyStatus(health.latency),
        ready: isReady,
      },
      connectionPool: {
        ...health.pool,
        utilization: this.calculatePoolUtilization(health.pool),
        status: this.getPoolStatus(health.pool),
      },
      memory: {
        rssMB: Math.round(memory.rss / 1024 / 1024),
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memory.heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private calculatePoolUtilization(pool: {
    total: number;
    idle: number;
    waiting: number;
  }): string {
    if (pool.total === 0) return '0%';
    const active = pool.total - pool.idle;
    return `${Math.round((active / pool.total) * 100)}%`;
  }

  private getPoolStatus(pool: {
    total: number;
    idle: number;
    waiting: number;
  }): string {
    if (pool.waiting > 0) return 'saturated';
    const utilization = parseInt(this.calculatePoolUtilization(pool), 10);
    if (utilization > 80) return 'high';
    if (utilization > 50) return 'normal';
    return 'low';
  }

  private getLatencyStatus(latency: number): string {
    if (latency < 0) return 'error';
    if (latency < 10) return 'excellent';
    if (latency < 50) return 'good';
    if (latency < 100) return 'acceptable';
    if (latency < 500) return 'slow';
    return 'critical';
  }
}
