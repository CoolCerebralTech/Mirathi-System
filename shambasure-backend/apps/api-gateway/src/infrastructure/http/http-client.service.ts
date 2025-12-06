// apps/api-gateway/src/infrastructure/http/http-client.service.ts
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Options, RequestHandler, createProxyMiddleware } from 'http-proxy-middleware';
import { firstValueFrom } from 'rxjs';

import { ServiceRoute } from '../routing/service-routes.config';
import { getAllServiceRoutes } from '../routing/service-routes.config';

// Extend the Options interface to include our custom handlers
interface CustomProxyOptions extends Options {
  onProxyReq?: (proxyReq: any, req: any, res: any) => void;
  onProxyRes?: (proxyRes: any, req: any, res: any) => void;
  onError?: (err: Error, req: any, res: any) => void;
}
interface RegisteredRoute {
  prefix: string;
  serviceUrl: string;
  middleware: boolean;
}

/**
 * HttpClientService - Manages HTTP proxying using http-proxy-middleware
 *
 * This service creates proxy middleware for each microservice and
 * provides health check functionality.
 */
@Injectable()
export class HttpClientService implements OnModuleInit {
  private readonly logger = new Logger(HttpClientService.name);
  private proxyMap: Map<string, RequestHandler> = new Map();

  constructor(private readonly httpService: HttpService) {}

  /**
   * Initialize proxy middleware for all configured services
   */
  onModuleInit() {
    const routes = getAllServiceRoutes();

    this.logger.log('🔄 Initializing proxy middleware for microservices...');

    for (const route of routes) {
      this.createProxyForRoute(route);
    }

    this.logger.log({
      msg: '✅ Proxy middleware initialization complete',
      servicesCount: this.proxyMap.size,
      routes: routes.map((r) => `${r.pathPrefix} -> ${r.serviceUrl}`),
    });
  }

  /**
   * Create proxy middleware for a specific route
   */
  private createProxyForRoute(route: ServiceRoute): void {
    const proxyOptions: CustomProxyOptions = {
      target: route.serviceUrl,
      changeOrigin: true,

      // Handle both API version prefixes
      pathRewrite: this.createPathRewrite(route.pathPrefix),

      // Request interceptor
      onProxyReq: this.createProxyReqHandler(route.service),

      // Response interceptor
      onProxyRes: this.createProxyResHandler(route.service),

      // Error handler
      onError: this.createErrorHandler(route.service),

      // Timeout configuration
      timeout: route.timeout || 30000,
      proxyTimeout: route.timeout || 30000,

      // SSL/TLS configuration for production
      secure: process.env.NODE_ENV === 'production',

      // Auto-handle redirects
      autoRewrite: true,

      // Preserve host header
      preserveHeaderKeyCase: true,

      // Handle WebSockets if needed
      ws: false,

      // Follow redirects
      followRedirects: true,

      // Self-handle response
      selfHandleResponse: false,
    };

    // Create the proxy middleware
    const proxyMiddleware = createProxyMiddleware(proxyOptions);
    this.proxyMap.set(route.pathPrefix, proxyMiddleware);

    this.logger.log({
      msg: '✅ Proxy middleware created',
      service: route.service,
      pathPrefix: route.pathPrefix,
      target: route.serviceUrl,
    });
  }

  /**
   * Create path rewrite function for proxy
   */
  private createPathRewrite(pathPrefix: string) {
    return (path: string) => {
      let rewritten = path;

      // Remove /api prefix if present
      rewritten = rewritten.replace(/^\/api/, '');

      // Remove version prefix if present (e.g., /v1)
      rewritten = rewritten.replace(/^\/v\d+\/?/, '');

      // Remove service path prefix (e.g., /accounts)
      if (pathPrefix && rewritten.startsWith(pathPrefix)) {
        rewritten = rewritten.substring(pathPrefix.length);
      }

      // Ensure path starts with /
      if (!rewritten.startsWith('/')) {
        rewritten = '/' + rewritten;
      }

      // If path is empty, use root
      if (rewritten === '') {
        rewritten = '/';
      }

      this.logger.debug({
        msg: 'Path rewrite',
        original: path,
        rewritten,
        target: pathPrefix,
      });

      return rewritten;
    };
  }

  /**
   * Create proxy request handler
   */
  private createProxyReqHandler(serviceName: string) {
    return (proxyReq: any, req: any) => {
      // Add tracing headers
      proxyReq.setHeader('X-Forwarded-By', 'api-gateway');
      proxyReq.setHeader('X-Gateway-Time', new Date().toISOString());
      proxyReq.setHeader('X-Gateway-Service', 'api-gateway');
      proxyReq.setHeader('X-Gateway-Version', '1.0.0');

      if (req.headers.host) {
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
      }

      // Forward IP for rate limiting
      if (req.ip) {
        proxyReq.setHeader('X-Forwarded-For', req.ip);
      }

      // Forward original URL
      proxyReq.setHeader('X-Original-URL', req.originalUrl);

      // Handle body for methods that may have body
      const methodsWithBody = ['POST', 'PUT', 'PATCH'];
      if (methodsWithBody.includes(req.method) && req.body) {
        try {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        } catch (error) {
          this.logger.error('Failed to stringify request body', error);
        }
      }

      this.logger.debug({
        msg: 'Proxying request',
        service: serviceName,
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        clientIp: req.ip,
      });
    };
  }

  /**
   * Create proxy response handler
   */
  private createProxyResHandler(serviceName: string) {
    return (proxyRes: any, req: any) => {
      // Add response time header
      const startTime = req._startTime || Date.now();
      const responseTime = Date.now() - startTime;

      proxyRes.headers['X-Response-Time'] = `${responseTime}ms`;
      proxyRes.headers['X-Gateway-Processed'] = 'true';

      this.logger.debug({
        msg: 'Response from microservice',
        service: serviceName,
        statusCode: proxyRes.statusCode,
        responseTime: `${responseTime}ms`,
        path: req.path,
      });

      // Log slow responses
      if (responseTime > 5000) {
        this.logger.warn({
          msg: 'Slow response from microservice',
          service: serviceName,
          responseTime: `${responseTime}ms`,
          path: req.path,
          threshold: '5000ms',
        });
      }
    };
  }

  /**
   * Create error handler
   */
  private createErrorHandler(serviceName: string) {
    return (err: Error, req: any, res: any) => {
      this.logger.error({
        msg: 'Proxy error',
        service: serviceName,
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });

      if (!res.headersSent) {
        // Determine error type
        const isTimeout =
          err.message.includes('timeout') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('ESOCKETTIMEDOUT');

        const isConnectionError =
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('ENOTFOUND');

        if (isTimeout) {
          res.status(504).json({
            statusCode: 504,
            message: `Request to ${serviceName} timed out`,
            error: 'Gateway Timeout',
            timestamp: new Date().toISOString(),
            path: req.path,
            service: serviceName,
            requestId: req.id || req.headers['x-request-id'],
          });
        } else if (isConnectionError) {
          res.status(502).json({
            statusCode: 502,
            message: `Unable to connect to ${serviceName}. Service may be down.`,
            error: 'Bad Gateway',
            timestamp: new Date().toISOString(),
            path: req.path,
            service: serviceName,
            requestId: req.id || req.headers['x-request-id'],
          });
        } else {
          res.status(500).json({
            statusCode: 500,
            message: `Internal gateway error while proxying to ${serviceName}`,
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path: req.path,
            service: serviceName,
            requestId: req.id || req.headers['x-request-id'],
          });
        }
      }
    };
  }

  /**
   * Get proxy middleware for a given path
   */
  getProxyMiddleware(path: string): RequestHandler | null {
    // Find matching proxy middleware based on path prefix
    const cleanPath = this.normalizePath(path);

    for (const [pathPrefix, middleware] of this.proxyMap.entries()) {
      if (cleanPath.startsWith(pathPrefix) || pathPrefix === '/') {
        return middleware;
      }
    }

    return null;
  }

  /**
   * Normalize path by removing API and version prefixes
   */
  private normalizePath(path: string): string {
    let normalized = path;

    // Remove /api prefix
    normalized = normalized.replace(/^\/api/, '');

    // Remove version prefix
    normalized = normalized.replace(/^\/v\d+\/?/, '');

    return normalized;
  }

  /**
   * Health check for a downstream service
   */
  async healthCheck(
    serviceUrl: string,
    endpoint = '/health',
  ): Promise<{
    status: 'UP' | 'DOWN';
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${serviceUrl}${endpoint}`, {
          timeout: 5000,
          validateStatus: (status) => status < 500, // Treat 4xx as UP (service is responding)
        }),
      );

      const responseTime = Date.now() - startTime;

      return {
        status: response.status < 500 ? 'UP' : 'DOWN',
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      this.logger.warn(`Health check failed for ${serviceUrl}: ${errorMessage}`);

      return {
        status: 'DOWN',
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Get all registered proxy routes (for debugging and monitoring)
   */
  getRegisteredRoutes(): RegisteredRoute[] {
    const routes: RegisteredRoute[] = [];

    for (const [prefix, middleware] of this.proxyMap.entries()) {
      routes.push({
        prefix,
        serviceUrl: 'dynamic',
        middleware: !!middleware,
      });
    }

    return routes;
  }

  /**
   * Check if service is available
   */
  async isServiceAvailable(serviceUrl: string): Promise<boolean> {
    try {
      const health = await this.healthCheck(serviceUrl);
      return health.status === 'UP';
    } catch {
      return false;
    }
  }
}
