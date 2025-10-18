// apps/api-gateway/src/health/health.service.ts

/* eslint-disable @typescript-eslint/no-misused-promises */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import {
  ServiceName,
  ServiceConfig,
  ServiceHealth,
  GatewayHealth,
} from '../interfaces/gateway.interface';
import { firstValueFrom, timeout } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private readonly services: ServiceConfig[];
  private readonly serviceHealth: Map<ServiceName, ServiceHealth> = new Map();

  // Define constants for configuration
  private readonly HEALTH_CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
  private readonly HEALTH_CHECK_TIMEOUT_MS = 5 * 1000; // 5 seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.services = [
      { name: ServiceName.ACCOUNTS, url: this.configService.get('ACCOUNTS_SERVICE_URL') },
      { name: ServiceName.DOCUMENTS, url: this.configService.get('DOCUMENTS_SERVICE_URL') },
      { name: ServiceName.SUCCESSION, url: this.configService.get('SUCCESSION_SERVICE_URL') },
    ];

    // Initialize all services as 'down' until the first successful check
    this.services.forEach((s) =>
      this.serviceHealth.set(s.name, {
        name: s.name,
        status: 'down',
        lastChecked: new Date().toISOString(),
        error: 'Pending initial health check',
      }),
    );
  }

  async onModuleInit() {
    this.logger.log('Starting initial health checks...');
    await this.checkAllServices();
    setInterval(() => this.checkAllServices(), this.HEALTH_CHECK_INTERVAL_MS);
  }

  async checkAllServices(): Promise<void> {
    const healthCheckPromises = this.services.map((service) => this.checkService(service));
    await Promise.all(healthCheckPromises);
  }

  private async checkService(service: ServiceConfig): Promise<void> {
    const startTime = Date.now();
    try {
      // THE FIX: Use the correct, full path to the health endpoint.
      const healthEndpoint = `${service.url}/api/v1/health`;

      // PRODUCTION ENHANCEMENT 1: Add a timeout to prevent long waits
      const request = this.httpService
        .get(healthEndpoint)
        .pipe(timeout(this.HEALTH_CHECK_TIMEOUT_MS));

      await firstValueFrom(request);

      const latency = Date.now() - startTime;
      this.serviceHealth.set(service.name, {
        name: service.name,
        status: 'up',
        latency,
        lastChecked: new Date().toISOString(),
      });
    } catch (error) {
      // PRODUCTION ENHANCEMENT 2: Provide more detailed error messages
      const latency = Date.now() - startTime;
      let errorMessage = 'An unknown error occurred';

      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = `Request timed out after ${this.HEALTH_CHECK_TIMEOUT_MS}ms`;
        } else if (error.response) {
          errorMessage = `Received status code ${error.response.status}`;
        } else {
          errorMessage = `Network error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.serviceHealth.set(service.name, {
        name: service.name,
        status: 'down',
        error: errorMessage,
        latency,
        lastChecked: new Date().toISOString(),
      });
      this.logger.warn(`Health check failed for ${service.name}: ${errorMessage}`);
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
