import { Injectable } from '@nestjs/common';
import { 
  HealthCheckService as TerminusHealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ShambaConfigService } from '@shamba/config';
import { PrismaService } from '@shamba/database';
import { MessagingService } from '@shamba/messaging';
import { HealthCheckResult as CustomHealthCheckResult } from '../interfaces/observability.interface';

@Injectable()
export class HealthService {
  constructor(
    private health: TerminusHealthCheck,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
    private configService: ShambaConfigService,
    private messagingService: MessagingService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.databaseHealthCheck(),
      () => this.memoryHealthCheck(),
      () => this.diskHealthCheck(),
      () => this.messagingHealthCheck(),
      () => this.customHealthChecks(),
    ]);
  }

  async detailedHealthCheck(): Promise<CustomHealthCheckResult> {
    const basicHealth = await this.check();
    const details = await this.getDetailedHealthInfo();

    return {
      status: basicHealth.status === 'ok' ? 'up' : 'down',
      details,
      timestamp: new Date(),
    };
  }

  private async databaseHealthCheck() {
    return this.db.pingCheck('database', {
      timeout: 3000,
    });
  }

  private async memoryHealthCheck() {
    // Check if memory usage is below 1.5GB
    return this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024);
  }

  private async diskHealthCheck() {
    // Check if disk storage has more than 10% free space
    return this.disk.checkStorage('disk_storage', {
      thresholdPercent: 0.9,
      path: '/',
    });
  }

  private async messagingHealthCheck() {
    try {
      const status = await this.messagingService.healthCheck();
      return {
        status: status.status === 'ok' ? 'up' : 'down',
        messaging: {
          status: status.status,
          details: status.details,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        messaging: {
          status: 'error',
          error: error.message,
        },
      };
    }
  }

  private async customHealthChecks() {
    const checks: any = {};

    // Database connectivity check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database_connectivity = { status: 'up' };
    } catch (error) {
      checks.database_connectivity = { 
        status: 'down', 
        error: error.message 
      };
    }

    // Database statistics
    try {
      const userCount = await this.prisma.user.count();
      const willCount = await this.prisma.will.count();
      
      checks.database_stats = {
        status: 'up',
        users: userCount,
        wills: willCount,
      };
    } catch (error) {
      checks.database_stats = { 
        status: 'down', 
        error: error.message 
      };
    }

    // External services health (example)
    checks.external_services = {
      status: 'up',
      land_registry: 'unknown', // Would implement actual check
      email_service: 'unknown',
      sms_service: 'unknown',
    };

    return checks;
  }

  private async getDetailedHealthInfo() {
    const performance = this.getPerformanceInfo();
    const resources = this.getResourceUsage();
    const business = await this.getBusinessMetrics();

    return {
      performance,
      resources,
      business,
      system: {
        node_version: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  private getPerformanceInfo() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      active_handles: process._getActiveHandles().length,
      active_requests: process._getActiveRequests().length,
    };
  }

  private getResourceUsage() {
    return {
      database: {
        connections: 'unknown', // Would need database-specific metrics
      },
      messaging: {
        connected: this.messagingService.getConnectionStatus().isConnected,
      },
    };
  }

  private async getBusinessMetrics() {
    try {
      const [
        userCount,
        willCount,
        documentCount,
        familyCount,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.will.count(),
        this.prisma.document.count(),
        this.prisma.family.count(),
      ]);

      return {
        users: userCount,
        wills: willCount,
        documents: documentCount,
        families: familyCount,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Liveness probe (simple check)
  async livenessCheck(): Promise<{ status: string }> {
    try {
      // Basic check - can we respond?
      return { status: 'alive' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  // Readiness probe (ready to handle traffic)
  async readinessCheck(): Promise<{ status: string; details?: any }> {
    try {
      const checks = await this.customHealthChecks();
      const allUp = Object.values(checks).every(check => check.status === 'up');
      
      return {
        status: allUp ? 'ready' : 'not_ready',
        details: allUp ? undefined : checks,
      };
    } catch (error) {
      return { 
        status: 'not_ready',
        details: { error: error.message },
      };
    }
  }
}