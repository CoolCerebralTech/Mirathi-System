/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { All, Controller, Req, Res, UseGuards, Logger, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { JwtAuthGuard } from '@shamba/auth';
import express from 'express';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';

/**
 * SuccessionProxyController - API Gateway proxy for succession-service
 *
 * RESPONSIBILITIES:
 * - Route wills/assets/families requests to succession-service
 * - Handle JWT authentication at gateway level
 * - Forward all HTTP methods and request bodies
 * - Handle service unavailability gracefully
 * - Provide circuit breaker behavior
 *
 * ROUTES PROXIED:
 * - POST /wills - Create will
 * - GET /wills - List wills
 * - GET /wills/active - Get active will
 * - PATCH /wills/:id - Update will
 * - POST /wills/:id/activate - Activate will
 * - POST /wills/:id/revoke - Revoke will
 * - POST /wills/:id/assignments - Add beneficiary
 * - DELETE /wills/:id - Delete will
 *
 * - POST /assets - Create asset
 * - GET /assets - List assets
 * - GET /assets/stats - Get statistics
 * - PATCH /assets/:id - Update asset
 * - DELETE /assets/:id - Delete asset
 *
 * - POST /families - Create family
 * - GET /families - List families
 * - POST /families/:id/members - Add member
 * - PATCH /families/:id/members/:userId - Update member
 * - DELETE /families/:id/members/:userId - Remove member
 * - DELETE /families/:id - Delete family
 */
@ApiTags('Succession Service Proxy')
@ApiExcludeController() // Hide from Swagger - use succession-service docs
@Controller(['wills', 'assets', 'families'])
@UseGuards(JwtAuthGuard) // All routes require authentication
export class SuccessionProxyController {
  private readonly logger = new Logger(SuccessionProxyController.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('SUCCESSION_SERVICE_URL');
    this.requestTimeout = this.configService.get('SERVICE_TIMEOUT') || 30000; // 30s default

    if (!this.baseUrl) {
      throw new Error('SUCCESSION_SERVICE_URL is not configured');
    }

    this.logger.log(`Succession proxy initialized: ${this.baseUrl}`);
  }

  // ========================================================================
  // PROXY ALL ROUTES
  // ========================================================================

  /**
   * Catch-all proxy for succession endpoints
   * Handles all HTTP methods for wills, assets, and families
   */
  @All('*')
  async proxy(@Req() req: express.Request, @Res() res: express.Response): Promise<void> {
    const { method, originalUrl, headers, body } = req;
    const startTime = Date.now();
    const context = `${method} ${originalUrl}`;

    // Sanitize headers for forwarding
    const headersToForward = this.sanitizeHeaders(headers);

    // Build target URL
    const targetUrl = `${this.baseUrl}${originalUrl}`;

    try {
      this.logger.debug(`Proxying: ${context} -> ${targetUrl}`);

      // Make request to succession-service with timeout
      const response = await firstValueFrom(
        this.httpService
          .request({
            method,
            url: targetUrl,
            headers: headersToForward,
            data: body,
            validateStatus: () => true, // Accept all status codes
            timeout: this.requestTimeout,
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              throw error;
            }),
          ),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(`Proxy response: ${context} - ${response.status} (${duration}ms)`);

      // Forward response to client
      res.status(response.status).json(response.data);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleProxyError(error, res, context, duration, originalUrl);
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Sanitize headers before forwarding to downstream service
   * Removes problematic headers and adds tracing headers
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };

    // Remove headers that should not be forwarded
    const headersToRemove = [
      'host',
      'connection',
      'content-length', // Let axios calculate this
      'transfer-encoding',
      'upgrade',
      'proxy-connection',
      'keep-alive',
    ];

    headersToRemove.forEach((header) => {
      delete sanitized[header];
    });

    // Add tracing headers (optional - for distributed tracing)
    sanitized['x-forwarded-by'] = 'api-gateway';
    sanitized['x-gateway-timestamp'] = new Date().toISOString();

    return sanitized;
  }

  /**
   * Get friendly service name from URL path
   */
  private getServiceName(url: string): string {
    if (url.includes('/wills')) return 'succession-service (wills)';
    if (url.includes('/assets')) return 'succession-service (assets)';
    if (url.includes('/families')) return 'succession-service (families)';
    return 'succession-service';
  }

  /**
   * Handle proxy errors and return appropriate responses
   */
  private handleProxyError(
    error: any,
    res: express.Response,
    context: string,
    duration: number,
    originalUrl: string,
  ): void {
    // Axios error with response from downstream service
    if (error instanceof AxiosError && error.response) {
      this.logger.warn(
        `Proxy error: ${context} - ${error.response.status} (${duration}ms)`,
        error.message,
      );

      res.status(error.response.status).json(error.response.data);
      return;
    }

    // Timeout error
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      this.logger.error(`Proxy timeout: ${context} (${duration}ms) - Service timeout exceeded`);

      res.status(HttpStatus.GATEWAY_TIMEOUT).json({
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: `Request to ${this.getServiceName(originalUrl)} timed out`,
        error: 'Gateway Timeout',
      });
      return;
    }

    // Connection error (service unavailable)
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EHOSTUNREACH'
    ) {
      this.logger.error(
        `Proxy connection failed: ${context} - Succession service unreachable`,
        error.message,
      );

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `${this.getServiceName(originalUrl)} is currently unavailable`,
        error: 'Service Unavailable',
        details: {
          service: 'succession-service',
          url: this.baseUrl,
        },
      });
      return;
    }

    // Unknown error
    this.logger.error(
      `Proxy unknown error: ${context} (${duration}ms)`,
      error.stack || error.message,
    );

    res.status(HttpStatus.BAD_GATEWAY).json({
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'An error occurred while processing your request',
      error: 'Bad Gateway',
    });
  }
}
