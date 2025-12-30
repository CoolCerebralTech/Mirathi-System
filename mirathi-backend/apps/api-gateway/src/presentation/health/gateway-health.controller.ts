import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

import { Public } from '@shamba/auth';
import { ConfigService } from '@shamba/config';

@ApiTags('Health Checks')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness Probe (Is the app running?)' })
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Minimal check: Is the process running and not out of memory?
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness Probe (Are upstream services reachable?)' })
  @ApiResponse({ status: 200, description: 'Gateway is fully ready' })
  @ApiResponse({ status: 503, description: 'One or more microservices are down' })
  async readiness(): Promise<HealthCheckResult> {
    // Get URLs from config
    const accountsUrl = this.config.get('ACCOUNTS_SERVICE_URL');
    const successionUrl = this.config.get('SUCCESSION_SERVICE_URL');
    const documentsUrl = this.config.get('DOCUMENTS_SERVICE_URL');

    return this.health.check([
      // 1. Check Memory
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // 2. Ping Microservices (Standard Terminus Check)
      // We check the /health/liveness endpoint of each service
      () => this.http.pingCheck('accounts_service', `${accountsUrl}/health/liveness`),
      () => this.http.pingCheck('succession_service', `${successionUrl}/health/liveness`),
      () => this.http.pingCheck('documents_service', `${documentsUrl}/health/liveness`),
    ]);
  }
}
