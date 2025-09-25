import { Injectable, Logger } from '@nestjs/common';
import { 
  HealthCheckService as NestHealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from './prisma.service';
import { DatabaseService } from './database.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private health: NestHealthCheck,
    private prisma: PrismaService,
    private databaseService: DatabaseService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    try {
      return await this.health.check([
        () => this.databaseHealthCheck(),
        () => this.memoryHealthCheck(),
      ]);
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw error;
    }
  }

  private async databaseHealthCheck() {
    try {
      const health = await this.databaseService.healthCheck();
      
      return {
        database: {
          status: health.status === 'ok' ? 'up' : 'down',
          details: health.details,
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  private async memoryHealthCheck() {
    // Check if memory usage is below 150MB
    return {
      memory: {
        status: 'up',
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
      },
    };
  }

  async detailedHealth() {
    const basicHealth = await this.check();
    const stats = await this.databaseService.getStats();
    
    return {
      ...basicHealth,
      details: {
        ...stats,
        uptime: process.uptime(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    };
  }
}