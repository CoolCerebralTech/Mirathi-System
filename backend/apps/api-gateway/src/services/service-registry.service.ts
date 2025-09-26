import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ShambaConfigService } from '@shamba/config';
import { ServiceConfig, ServiceHealth } from '../interfaces/gateway.interface';

@Injectable()
export class ServiceRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ServiceRegistryService.name);
  private services: Map<string, ServiceConfig> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();

  constructor(private configService: ShambaConfigService) {}

  onModuleInit() {
    this.initializeServices();
    this.startHealthChecks();
  }

  private initializeServices() {
    const services: ServiceConfig[] = [
      {
        name: 'accounts-service',
        baseUrl: process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3001',
        healthEndpoint: '/health',
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'succession-service',
        baseUrl: process.env.SUCCESSION_SERVICE_URL || 'http://localhost:3002',
        healthEndpoint: '/health',
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'documents-service',
        baseUrl: process.env.DOCUMENTS_SERVICE_URL || 'http://localhost:3003',
        healthEndpoint: '/health',
        timeout: 30000,
        retries: 3,
      },
      {
        name: 'notifications-service',
        baseUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
        healthEndpoint: '/health',
        timeout: 30000,
        retries: 3,
      },
    ];

    services.forEach(service => {
      this.services.set(service.name, service);
      this.serviceHealth.set(service.name, {
        service: service.name,
        status: 'unknown',
        responseTime: 0,
        lastCheck: new Date(),
      });
    });

    this.logger.log(`Registered ${services.length} services`);
  }

  getService(name: string): ServiceConfig | undefined {
    return this.services.get(name);
  }

  getAllServices(): ServiceConfig[] {
    return Array.from(this.services.values());
  }

  getServiceHealth(name: string): ServiceHealth | undefined {
    return this.serviceHealth.get(name);
  }

  getAllServicesHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  updateServiceHealth(name: string, health: Partial<ServiceHealth>): void {
    const current = this.serviceHealth.get(name);
    if (current) {
      this.serviceHealth.set(name, {
        ...current,
        ...health,
        lastCheck: new Date(),
      });
    }
  }

  isServiceHealthy(name: string): boolean {
    const health = this.serviceHealth.get(name);
    return health?.status === 'healthy';
  }

  getHealthyServices(): ServiceConfig[] {
    return this.getAllServices().filter(service => 
      this.isServiceHealthy(service.name)
    );
  }

  private async startHealthChecks() {
    // Initial health check
    await this.performHealthChecks();

    // Periodic health checks every 30 seconds
    setInterval(() => {
      this.performHealthChecks().catch(error => {
        this.logger.error('Health checks failed', error);
      });
    }, 30000);
  }

  private async performHealthChecks(): Promise<void> {
    const promises = this.getAllServices().map(async (service) => {
      try {
        const startTime = Date.now();
        
        // In a real implementation, you would make an HTTP request to the health endpoint
        // For now, we'll simulate health checks
        const isHealthy = Math.random() > 0.1; // 90% chance of being healthy
        
        const responseTime = Date.now() - startTime;
        
        this.updateServiceHealth(service.name, {
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime,
          error: isHealthy ? undefined : 'Service unavailable',
        });

        if (!isHealthy) {
          this.logger.warn(`Service ${service.name} is unhealthy`);
        }
      } catch (error) {
        this.logger.error(`Health check failed for ${service.name}`, error);
        this.updateServiceHealth(service.name, {
          status: 'unhealthy',
          responseTime: 0,
          error: error.message,
        });
      }
    });

    await Promise.allSettled(promises);
  }

  getServiceByPath(path: string): ServiceConfig | undefined {
    const pathSegments = path.split('/').filter(segment => segment);
    
    if (pathSegments.length === 0) {
      return undefined;
    }

    const serviceMapping: Record<string, string> = {
      'auth': 'accounts-service',
      'users': 'accounts-service',
      'wills': 'succession-service',
      'assets': 'succession-service',
      'families': 'succession-service',
      'documents': 'documents-service',
      'notifications': 'notifications-service',
    };

    const firstSegment = pathSegments[0];
    const serviceName = serviceMapping[firstSegment];

    return serviceName ? this.getService(serviceName) : undefined;
  }

  getRouteConfig(path: string, method: string): any {
    // Define route-specific configurations
    const routeConfigs: Record<string, any> = {
      '/auth/login': { public: true, rateLimit: 5 }, // 5 requests per minute for login
      '/auth/register': { public: true, rateLimit: 2 }, // 2 requests per minute for registration
      '/auth/forgot-password': { public: true, rateLimit: 3 },
      '/auth/reset-password': { public: true, rateLimit: 3 },
      '/documents/upload': { timeout: 60000 }, // 60 seconds for file uploads
      '/documents/download': { timeout: 30000 }, // 30 seconds for file downloads
    };

    return routeConfigs[path] || {};
  }
}