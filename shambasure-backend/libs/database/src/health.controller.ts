import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { PrismaService } from './services/prisma.service';

/**
 * Production-ready health check controller
 *
 * Endpoints for:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Monitoring systems (Datadog, Prometheus, etc.)
 * - Database connection verification
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Basic health check - always returns 200 if service is running
   * GET /health
   *
   * Use for: Basic monitoring, uptime checks
   */
  @Get()
  async check() {
    return {
      status: 'ok',
      service: 'database',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Comprehensive database health check with performance metrics
   * GET /health/database
   *
   * Use for: Detailed monitoring, alerting on slow queries
   * Returns: Database latency, connection pool stats, readiness
   */
  @Get('database')
  async checkDatabase() {
    try {
      const health = await this.prisma.healthCheck();
      const poolStats = this.prisma.getPoolStats();
      const isReady = this.prisma.isReady();

      const status = health.healthy && isReady ? 'healthy' : 'unhealthy';
      const httpStatus = health.healthy && isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

      return {
        status,
        ready: isReady,
        database: {
          connected: health.healthy,
          latency: health.latency,
          latencyStatus: this.getLatencyStatus(health.latency),
        },
        pool: {
          ...poolStats,
          utilization: this.calculatePoolUtilization(poolStats),
        },
        timestamp: new Date().toISOString(),
        _statusCode: httpStatus,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          ready: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Kubernetes readiness probe
   * GET /health/ready
   *
   * Use for: K8s readiness checks - tells if service can handle traffic
   * Returns 200: Service ready to accept requests
   * Returns 503: Service not ready (starting up, shutting down, or unhealthy)
   */
  @Get('ready')
  async ready() {
    try {
      const health = await this.prisma.healthCheck();
      const isReady = this.prisma.isReady();

      if (!health.healthy || !isReady) {
        throw new HttpException(
          {
            status: 'not ready',
            reason: !health.healthy ? 'Database unhealthy' : 'Service shutting down',
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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: 'not ready',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Kubernetes liveness probe
   * GET /health/live
   *
   * Use for: K8s liveness checks - tells if service should be restarted
   * Returns 200: Process is alive and functioning
   * Should only fail if process is deadlocked or in unrecoverable state
   */
  @Get('live')
  async live() {
    // Simple check - if we can respond, we're alive
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        utilization: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deep health check with full system diagnostics
   * GET /health/deep
   *
   * Use for: Troubleshooting, detailed monitoring
   * Returns: Comprehensive system status including environment info
   */
  @Get('deep')
  async deepCheck() {
    const health = await this.prisma.healthCheck();
    const poolStats = this.prisma.getPoolStats();
    const isReady = this.prisma.isReady();
    const memoryUsage = process.memoryUsage();

    return {
      status: health.healthy && isReady ? 'healthy' : 'unhealthy',
      service: {
        name: 'database',
        version: process.env.npm_package_version || 'unknown',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
      },
      database: {
        connected: health.healthy,
        latency: health.latency,
        latencyStatus: this.getLatencyStatus(health.latency),
        ready: isReady,
      },
      connectionPool: {
        ...poolStats,
        utilization: this.calculatePoolUtilization(poolStats),
        status: this.getPoolStatus(poolStats),
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper: Calculate pool utilization percentage
   */
  private calculatePoolUtilization(poolStats: any): string {
    if (!poolStats.max || poolStats.max === 0) return '0%';
    const activeConnections = poolStats.total - poolStats.idle;
    const utilization = (activeConnections / poolStats.max) * 100;
    return `${Math.round(utilization)}%`;
  }

  /**
   * Helper: Get pool health status
   */
  private getPoolStatus(poolStats: any): string {
    const utilization = parseInt(this.calculatePoolUtilization(poolStats));

    if (poolStats.waiting > 0) return 'saturated';
    if (utilization > 80) return 'high';
    if (utilization > 50) return 'normal';
    return 'low';
  }

  /**
   * Helper: Get latency status
   */
  private getLatencyStatus(latency: number): string {
    if (latency < 0) return 'error';
    if (latency < 10) return 'excellent';
    if (latency < 50) return 'good';
    if (latency < 100) return 'acceptable';
    if (latency < 500) return 'slow';
    return 'critical';
  }
}
