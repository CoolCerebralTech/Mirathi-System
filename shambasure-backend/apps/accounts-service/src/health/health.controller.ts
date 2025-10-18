// apps/accounts-service/src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@shamba/database';
import { Public } from '@shamba/auth';

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
  @ApiOperation({ summary: 'Get the health status of the accounts-service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    // This is the specific logic for this service: can it ping the database?
    return this.health.check([() => this.prisma.pingCheck('database', this.prismaService)]);
  }
}
