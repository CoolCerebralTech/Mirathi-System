// apps/api-gateway/src/presentation/controller/proxy.controller.ts
import { All, Controller, Get, Logger, Req, Res } from '@nestjs/common';
import { ApiExcludeController, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { Public } from '@shamba/auth';

import { ProxyService } from '../../application/services/proxy.service';

/**
 * ProxyController - Catch-all controller for proxying requests to microservices
 */
@Controller()
@ApiExcludeController()
@ApiTags('Gateway')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Catch-all route handler for all API requests
   */
  @All('*')
  @Public()
  @ApiOperation({
    summary: 'Proxy request to microservice',
    description: 'Forwards request to appropriate microservice based on route pattern',
  })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 404, description: 'No microservice found for route' })
  @ApiResponse({ status: 502, description: 'Bad gateway - microservice unavailable' })
  @ApiResponse({ status: 504, description: 'Gateway timeout' })
  async proxyRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId =
      (req.headers['x-request-id'] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const path = req.path;
    const method = req.method;

    // Add request ID to response
    res.setHeader('X-Request-ID', requestId);

    // Log incoming request
    this.logger.log({
      msg: 'Incoming request',
      requestId,
      path,
      method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      bodySize: req.body ? Buffer.byteLength(JSON.stringify(req.body)) : 0,
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Bearer ***' : undefined,
    });

    try {
      // Delegate to ProxyService
      await this.proxyService.proxyRequest(req, res);

      // Log successful proxy
      const logResponse = () => {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        const logData = {
          msg: 'Request completed',
          requestId,
          method,
          path,
          statusCode,
          responseTime: `${responseTime}ms`,
          contentLength: res.get('Content-Length') || 0,
        };

        // Categorize log level
        if (statusCode >= 500) {
          this.logger.error(logData);
        } else if (statusCode >= 400) {
          this.logger.warn(logData);
        } else if (responseTime > 1000) {
          this.logger.warn({ ...logData, note: 'Slow response' });
        } else {
          this.logger.log(logData);
        }
      };

      // Hook into response finish
      res.on('finish', logResponse);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      this.logger.error({
        msg: 'Proxy controller error',
        requestId,
        path,
        method,
        error: error.message,
        stack: error.stack,
        responseTime: `${responseTime}ms`,
      });

      // Only send error if response hasn't been sent
      if (!res.headersSent) {
        const statusCode = error?.status || error?.statusCode || 500;
        const message = error?.message || 'Internal server error';
        const errorType = error?.name || 'InternalServerError';

        res.status(statusCode).json({
          statusCode,
          message,
          error: errorType,
          timestamp: new Date().toISOString(),
          path,
          requestId,
          gateway: 'api-gateway',
        });
      }
    }
  }

  /**
   * Gateway status endpoint
   */
  @Get('gateway/status')
  @Public()
  @ApiOperation({ summary: 'Get gateway status and metrics' })
  @ApiResponse({ status: 200, description: 'Gateway status information' })
  async getGatewayStatus() {
    try {
      const status = await this.proxyService.getServicesHealth();
      const stats = this.proxyService.getServiceStatistics();
      const routes = this.proxyService.getAllRoutes();

      return {
        status: 'success',
        data: {
          gateway: {
            name: 'api-gateway',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          },
          services: status,
          statistics: stats,
          routing: {
            totalRoutes: routes.length,
            routes: routes.map((route) => ({
              path: route.path,
              service: route.service,
              requiresAuth: route.requiresAuth,
            })),
          },
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to get gateway status', error.stack);
      throw error;
    }
  }

  /**
   * Quick health check
   */
  @Get('gateway/health')
  @Public()
  @ApiOperation({ summary: 'Quick gateway health check' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  getHealth() {
    const cachedHealth = this.proxyService.getCachedHealthStatus();
    const stats = this.proxyService.getServiceStatistics();

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      gateway: 'api-gateway',
      services: {
        total: stats.totalServices,
        healthy: stats.healthyServices,
        unhealthy: stats.unhealthyServices,
        degraded: stats.degradedServices,
      },
      checks: cachedHealth,
    };
  }

  /**
   * List all available routes
   */
  @Get('gateway/routes')
  @Public()
  @ApiOperation({ summary: 'List all registered routes' })
  @ApiResponse({ status: 200, description: 'List of registered routes' })
  getRoutes() {
    const routes = this.proxyService.getAllRoutes();
    const registeredRoutes = this.proxyService.getRegisteredRoutes();

    return {
      status: 'success',
      data: {
        total: routes.length,
        routes: routes,
        middleware: registeredRoutes,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
