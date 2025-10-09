import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../health/health.service';
import { Public } from '@shamba/auth';
import { Response } from 'express';

@ApiTags('Health')
@Controller('health')
@Public() // This entire controller is public
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get the overall health status of the gateway and all downstream services' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  @ApiResponse({ status: 503, description: 'Gateway is degraded (one or more services are down)' })
  getGatewayHealth(@Res() res: Response) {
    const health = this.healthService.getGatewayHealth();
    
    // Return a 503 Service Unavailable status if any downstream service is down
    const status = health.gatewayStatus === 'up' ? 200 : 503;

    return res.status(status).json(health);
  }
}