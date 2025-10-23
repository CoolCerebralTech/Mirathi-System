// apps/documents-service/src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@shamba/database';
import { Public } from '@shamba/auth';
// We would also add a StorageHealthIndicator here if we had one.

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Get the health status of the documents-service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // 1. Check if the service can connect to the database.
      () => this.prisma.pingCheck('database', this.prismaService),

      // FUTURE: 2. Check if the service can connect to the storage (e.g., S3).
      // () => this.storage.pingCheck('storage'),
    ]);
  }
}
