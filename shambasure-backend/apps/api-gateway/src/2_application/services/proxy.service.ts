import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import type { IHttpClient, IServiceRouter } from '../interfaces/service-router.interface';
import { ProxyResponse } from '../../4_infrastructure/http/http-client.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    @Inject('IServiceRouter')
    private readonly serviceRouter: IServiceRouter,

    @Inject('IHttpClient')
    private readonly httpClient: IHttpClient,
  ) {}

  /**
   * The core use case of the API Gateway.
   * It finds the appropriate downstream service and forwards the client's request to it.
   *
   * @param req The incoming request from the client.
   * @returns A promise that resolves to the response from the downstream service.
   * @throws NotFoundException if no route configuration matches the request path.
   */
  async proxyRequest(req: Request): Promise<ProxyResponse> {
    // 1. Use the IServiceRouter to find the destination (the "what" and "where")
    const serviceRoute = this.serviceRouter.findService(req);

    // 2. Handle the case where no route is found
    if (!serviceRoute) {
      this.logger.warn(`No route found for request: ${req.method} ${req.originalUrl}`);
      throw new NotFoundException({
        message: `Cannot ${req.method} ${req.originalUrl}`,
        error: 'Not Found',
        statusCode: 404,
      });
    }

    // 3. Use the IHttpClient to execute the request (the "how")
    // The ProxyService doesn't know about axios, timeouts, or retries.
    // It just trusts the IHttpClient to handle it.
    this.logger.log(`Forwarding request to service: ${serviceRoute.service}`);

    return this.httpClient.proxyRequest(serviceRoute, req);
  }

  /**
   * Retrieves health status from all downstream services.
   * This delegates the health checking logic to the IHttpClient.
   */
  async getServicesHealth(): Promise<Record<string, { status: string }>> {
    const routes = this.serviceRouter.getRoutes();
    const healthChecks: Promise<{ service: string; healthy: boolean }>[] = [];

    // Create a unique set of services to check
    const uniqueServices = new Map<string, string>();
    routes.forEach((route) => uniqueServices.set(route.service, route.serviceUrl));

    for (const [service, serviceUrl] of uniqueServices.entries()) {
      healthChecks.push(
        this.httpClient.healthCheck(serviceUrl).then((healthy) => ({ service, healthy })),
      );
    }

    const results = await Promise.all(healthChecks);
    const healthStatus: Record<string, { status: string }> = {};

    for (const result of results) {
      healthStatus[result.service] = { status: result.healthy ? 'up' : 'down' };
    }

    return healthStatus;
  }
}
