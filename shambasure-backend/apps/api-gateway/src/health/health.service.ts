/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import {
  ServiceName,
  ServiceConfig,
  ServiceHealth,
  GatewayHealth,
} from '../interfaces/gateway.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly services: ServiceConfig[];
  private serviceHealth: Map<ServiceName, ServiceHealth> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Load service configurations from our central config
    this.services = [
      { name: ServiceName.ACCOUNTS, url: this.configService.get('ACCOUNTS_SERVICE_URL') },
      { name: ServiceName.DOCUMENTS, url: this.configService.get('DOCUMENTS_SERVICE_URL') },
      { name: ServiceName.SUCCESSION, url: this.configService.get('SUCCESSION_SERVICE_URL') },
    ];
    this.services.forEach((s) =>
      this.serviceHealth.set(s.name, {
        name: s.name,
        status: 'down',
        lastChecked: new Date().toISOString(),
      }),
    );
  }

  async onModuleInit() {
    this.logger.log('Starting initial health checks...');
    await this.checkAllServices();
    // Schedule periodic health checks
    setInterval(() => this.checkAllServices(), 30 * 1000); // Every 30 seconds
  }

  async checkAllServices(): Promise<void> {
    for (const service of this.services) {
      const startTime = Date.now();
      try {
        // Use the HttpService to ping the health endpoint of the downstream service
        await firstValueFrom(this.httpService.get(`${service.url}/health/readiness`));
        const latency = Date.now() - startTime;
        this.serviceHealth.set(service.name, {
          name: service.name,
          status: 'up',
          latency,
          lastChecked: new Date().toISOString(),
        });
      } catch (error: unknown) {
        // Add type
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.serviceHealth.set(service.name, {
          name: service.name,
          status: 'down',
          error: message, // Use safe message
          lastChecked: new Date().toISOString(),
        });
        this.logger.warn(`Health check failed for ${service.name}: ${message}`); // Use safe message
      }
    }
  }

  getGatewayHealth(): GatewayHealth {
    const services = Array.from(this.serviceHealth.values());
    const isDegraded = services.some((s) => s.status === 'down');
    return {
      gatewayStatus: isDegraded ? 'down' : 'up',
      timestamp: new Date().toISOString(),
      services,
    };
  }
}
