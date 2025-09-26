import { Controller, Get } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
} from '@nestjs/swagger';
import { ProxyService } from '../services/proxy.service';
import { ServiceRegistryService } from '../services/service-registry.service';
import { Public } from '../decorators/public.decorator';
import { createSuccessResponse } from '@shamba/common';

@ApiTags('Health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    private proxyService: ProxyService,
    private serviceRegistry: ServiceRegistryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get gateway and services health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getHealth() {
    const gatewayHealth = await this.proxyService.healthCheck();
    const services = this.serviceRegistry.getAllServicesHealth();

    return createSuccessResponse({
      gateway: {
        status: 'healthy', // Gateway is always healthy if it's responding
        timestamp: new Date().toISOString(),
      },
      services: gatewayHealth.services,
      overall: gatewayHealth.status,
    }, 'Health status retrieved');
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Gateway is alive' })
  livenessProbe() {
    return createSuccessResponse(
      { status: 'alive' },
      'Gateway is alive',
    );
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Gateway is ready' })
  readinessProbe() {
    const healthyServices = this.serviceRegistry.getHealthyServices();
    const totalServices = this.serviceRegistry.getAllServices().length;
    
    const isReady = healthyServices.length >= Math.ceil(totalServices * 0.8); // 80% healthy

    return createSuccessResponse(
      { 
        status: isReady ? 'ready' : 'not_ready',
        healthyServices: healthyServices.length,
        totalServices,
      },
      isReady ? 'Gateway is ready' : 'Gateway is not ready',
    );
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get gateway metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  getMetrics() {
    const metrics = this.proxyService.getMetrics();
    return createSuccessResponse(metrics, 'Metrics retrieved');
  }
}