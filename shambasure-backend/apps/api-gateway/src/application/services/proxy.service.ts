// apps/api-gateway/src/application/services/proxy.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';

import { HttpClientService } from '../../infrastructure/http/http-client.service';
import { RoutingService } from '../../infrastructure/routing/routing.service';
import { getAllServiceRoutes } from '../../infrastructure/routing/service-routes.config';

/**
 * ProxyService - Application layer service for request proxying
 *
 * This service acts as the orchestrator between the presentation layer
 * and the infrastructure layer. It uses HttpClientService to get the
 * appropriate proxy middleware and delegates request handling to it.
 */
@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private serviceHealthStatus = new Map<
    string,
    { status: 'up' | 'down'; lastCheck: Date; error?: string }
  >();

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly routingService: RoutingService,
  ) {
    // Initialize health status for all services
    this.initializeServiceHealth();
  }

  /**
   * Initialize service health status
   */
  private initializeServiceHealth(): void {
    const routes = getAllServiceRoutes();
    routes.forEach((route) => {
      if (route.service !== 'api-gateway') {
        this.serviceHealthStatus.set(route.service, {
          status: 'up', // Start optimistic
          lastCheck: new Date(),
        });
      }
    });
  }

  /**
   * Proxy a request to the appropriate microservice
   */
  async proxyRequest(req: Request, res: Response): Promise<void> {
    const path = req.path;
    const method = req.method;
    const requestId =
      (req.headers['x-request-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set request ID on response
    res.setHeader('X-Request-ID', requestId);

    this.logger.debug({
      msg: 'Processing proxy request',
      requestId,
      path,
      method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Check if this path should be proxied
    if (!this.routingService.shouldProxy(path)) {
      this.logger.warn({
        msg: 'Path should not be proxied (likely handled by gateway directly)',
        requestId,
        path,
      });

      // Let the request continue to be handled by NestJS
      // We'll return a 404 here if it's not a valid gateway route
      if (path !== '/health' && path !== '/docs' && !path.startsWith('/api-json')) {
        throw new NotFoundException({
          statusCode: 404,
          message: `Route not found: ${path}`,
          error: 'Not Found',
          timestamp: new Date().toISOString(),
          path,
          requestId,
        });
      }
      return;
    }

    // Get the proxy middleware for this path
    const proxyMiddleware = this.httpClient.getProxyMiddleware(path);

    if (!proxyMiddleware) {
      this.logger.warn({
        msg: 'No proxy middleware found for path',
        requestId,
        path,
        method,
      });

      throw new NotFoundException({
        statusCode: 404,
        message: `No microservice found for path: ${path}`,
        error: 'Not Found',
        timestamp: new Date().toISOString(),
        path,
        requestId,
      });
    }

    // Execute the proxy middleware
    // Note: We don't need async/await here as the middleware handles the request
    await proxyMiddleware(req, res, (error: unknown) => {
      if (error) {
        const err = error as Error;

        this.logger.error({
          msg: 'Proxy middleware execution error',
          requestId,
          path,
          error: err.message,
          stack: err.stack,
        });

        if (!res.headersSent) {
          res.status(500).json({
            statusCode: 500,
            message: 'Internal gateway error',
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path,
            requestId,
          });
        }
      }
    });
  }

  /**
   * Get health status of all microservices
   */
  async getServicesHealth(): Promise<{
    services: Record<
      string,
      {
        status: string;
        url: string;
        lastCheck: string;
        responseTime?: number;
      }
    >;
    gateway: { status: string; timestamp: string };
    overall: string;
  }> {
    const routes = getAllServiceRoutes();
    const healthStatus: Record<string, { status: string; url: string; lastCheck: string }> = {};

    // Create unique set of services (avoid checking duplicates)
    const uniqueServices = new Map<string, string>();
    routes.forEach((route) => {
      // Skip gateway routes and internal routes
      if (route.service !== 'api-gateway' && route.healthCheck) {
        uniqueServices.set(route.service, route.serviceUrl);
      }
    });

    this.logger.debug({
      msg: 'Checking health of microservices',
      count: uniqueServices.size,
    });

    // Check health of each service
    const healthChecks = Array.from(uniqueServices.entries()).map(async ([service, serviceUrl]) => {
      try {
        const healthResult = await this.httpClient.healthCheck(serviceUrl);

        // Update cached status
        this.serviceHealthStatus.set(service, {
          status: healthResult.status === 'UP' ? 'up' : 'down',
          lastCheck: new Date(),
          error: healthResult.error,
        });

        return {
          service,
          serviceUrl,
          status: healthResult.status === 'UP' ? 'up' : 'down',
          responseTime: healthResult.responseTime,
          error: healthResult.error,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn({
          msg: 'Health check failed',
          service,
          error: errorMessage,
        });

        // Update cached status
        this.serviceHealthStatus.set(service, {
          status: 'down',
          lastCheck: new Date(),
          error: errorMessage,
        });

        return {
          service,
          serviceUrl,
          status: 'down',
          responseTime: undefined,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.allSettled(healthChecks);

    // Build health status object
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { service, serviceUrl, status, responseTime, timestamp } = result.value;

        healthStatus[service] = {
          status,
          url: serviceUrl,
          lastCheck: timestamp,
          ...(responseTime ? { responseTime } : {}),
        };
      }
    });

    // Calculate overall status
    const serviceStatuses = Object.values(healthStatus).map((s) => s.status);
    const anyDown = serviceStatuses.some((status) => status === 'down');

    let overallStatus = 'healthy';
    if (anyDown) overallStatus = 'degraded';
    if (serviceStatuses.length === 0 || serviceStatuses.every((status) => status === 'down')) {
      overallStatus = 'unhealthy';
    }

    return {
      services: healthStatus,
      gateway: {
        status: 'up',
        timestamp: new Date().toISOString(),
      },
      overall: overallStatus,
    };
  }

  /**
   * Get all registered proxy routes
   */
  getRegisteredRoutes(): Array<{
    prefix: string;
    serviceUrl: string;
    middleware: boolean;
  }> {
    return this.httpClient.getRegisteredRoutes();
  }

  /**
   * Get cached health status (for quick checks)
   */
  getCachedHealthStatus(): Record<string, { status: string; lastCheck: string; error?: string }> {
    const cachedStatus: Record<string, { status: string; lastCheck: string; error?: string }> = {};

    for (const [service, status] of this.serviceHealthStatus.entries()) {
      cachedStatus[service] = {
        status: status.status,
        lastCheck: status.lastCheck.toISOString(),
        error: status.error,
      };
    }

    return cachedStatus;
  }

  /**
   * Get all available routes
   */
  getAllRoutes(): Array<{
    path: string;
    service: string;
    serviceUrl: string;
    requiresAuth: boolean;
  }> {
    return this.routingService.getAllRoutes();
  }

  /**
   * Get service URL for a path
   */
  getServiceUrl(path: string): string | null {
    return this.routingService.getServiceUrl(path);
  }

  /**
   * Check if a service is available
   */
  async isServiceAvailable(serviceName: string): Promise<boolean> {
    const route = getAllServiceRoutes().find((r) => r.service === serviceName);
    if (!route) return false;

    return this.httpClient.isServiceAvailable(route.serviceUrl);
  }

  /**
   * Get service statistics
   */
  getServiceStatistics(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
  } {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const status of this.serviceHealthStatus.values()) {
      if (status.status === 'up') healthy++;
      else if (status.status === 'down') unhealthy++;
      else degraded++;
    }

    const total = this.serviceHealthStatus.size;

    return {
      totalServices: total,
      healthyServices: healthy,
      degradedServices: degraded,
      unhealthyServices: unhealthy,
    };
  }
}
