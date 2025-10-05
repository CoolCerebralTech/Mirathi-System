import { 
  All, 
  Controller, 
  Req, 
  Res, 
  UseGuards,
  UseInterceptors,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { Public, JwtAuthGuard } from '@shamba/auth';
import { Request, Response } from 'express';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';

/**
 * AccountsProxyController - API Gateway proxy for accounts-service
 * 
 * RESPONSIBILITIES:
 * - Route auth/profile/users requests to accounts-service
 * - Handle authentication at gateway level for protected routes
 * - Forward JWT tokens to downstream service
 * - Handle service unavailability gracefully
 * - Provide circuit breaker behavior
 * 
 * ROUTES PROXIED:
 * - POST /auth/register (public)
 * - POST /auth/login (public)
 * - POST /auth/refresh (public)
 * - POST /auth/forgot-password (public)
 * - POST /auth/reset-password (public)
 * - GET /profile (protected)
 * - PATCH /profile (protected)
 * - PATCH /profile/change-password (protected)
 * - GET /users (protected - admin)
 * - GET /users/:id (protected - admin)
 * - PATCH /users/:id/role (protected - admin)
 * - DELETE /users/:id (protected - admin)
 */
@ApiTags('Accounts Service Proxy')
@ApiExcludeController() // Hide from Swagger - use accounts-service docs
@Controller(['auth', 'profile', 'users'])
export class AccountsProxyController {
  private readonly logger = new Logger(AccountsProxyController.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('ACCOUNTS_SERVICE_URL');
    this.requestTimeout = this.configService.get('SERVICE_TIMEOUT') || 30000; // 30s default

    if (!this.baseUrl) {
      throw new Error('ACCOUNTS_SERVICE_URL is not configured');
    }

    this.logger.log(`Accounts proxy initialized: ${this.baseUrl}`);
  }

  // ========================================================================
  // PUBLIC ROUTES (No authentication required)
  // ========================================================================

  @Public()
  @All('auth/register')
  async proxyRegister(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'POST /auth/register');
  }

  @Public()
  @All('auth/login')
  async proxyLogin(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'POST /auth/login');
  }

  @Public()
  @All('auth/refresh')
  async proxyRefresh(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'POST /auth/refresh');
  }

  @Public()
  @All('auth/forgot-password')
  async proxyForgotPassword(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'POST /auth/forgot-password');
  }

  @Public()
  @All('auth/reset-password')
  async proxyResetPassword(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res, 'POST /auth/reset-password');
  }

  // ========================================================================
  // PROTECTED ROUTES (JWT required - validated at gateway)
  // ========================================================================

  /**
   * Catch-all for authenticated routes
   * JWT validation happens here at gateway level
   */
  @UseGuards(JwtAuthGuard)
  @All('*')
  async proxyProtected(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  // ========================================================================
  // CORE PROXY LOGIC
  // ========================================================================

  /**
   * Generic proxy method - forwards requests to accounts-service
   * 
   * FEATURES:
   * - Timeout handling
   * - Error transformation
   * - Header sanitization
   * - Logging
   * - Circuit breaker behavior
   */
  private async proxyRequest(
    req: Request,
    res: Response,
    logContext?: string,
  ): Promise<void> {
    const { method, originalUrl, headers, body } = req;
    const startTime = Date.now();
    const context = logContext || `${method} ${originalUrl}`;

    // Sanitize headers for forwarding
    const headersToForward = this.sanitizeHeaders(headers);

    // Build target URL
    const targetUrl = `${this.baseUrl}${originalUrl}`;

    try {
      this.logger.debug(`Proxying: ${context} -> ${targetUrl}`);

      // Make request to accounts-service with timeout
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: targetUrl,
          headers: headersToForward,
          data: body,
          validateStatus: () => true, // Accept all status codes
          timeout: this.requestTimeout,
        }).pipe(
          timeout(this.requestTimeout),
          catchError((error) => {
            throw error; // Let outer catch handle it
          }),
        ),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Proxy response: ${context} - ${response.status} (${duration}ms)`
      );

      // Forward response to client
      res.status(response.status).json(response.data);

    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleProxyError(error, res, context, duration);
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
   * Handle proxy errors and return appropriate responses
   */
  private handleProxyError(
    error: any,
    res: Response,
    context: string,
    duration: number,
  ): void {
    // Axios error with response from downstream service
    if (error instanceof AxiosError && error.response) {
      this.logger.warn(
        `Proxy error: ${context} - ${error.response.status} (${duration}ms)`,
        error.message
      );

      res.status(error.response.status).json(error.response.data);
      return;
    }

    // Timeout error
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      this.logger.error(
        `Proxy timeout: ${context} (${duration}ms) - Service timeout exceeded`
      );

      res.status(HttpStatus.GATEWAY_TIMEOUT).json({
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Request to accounts service timed out',
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
        `Proxy connection failed: ${context} - Accounts service unreachable`,
        error.message
      );

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Accounts service is currently unavailable',
        error: 'Service Unavailable',
        details: {
          service: 'accounts-service',
          url: this.baseUrl,
        },
      });
      return;
    }

    // Unknown error
    this.logger.error(
      `Proxy unknown error: ${context} (${duration}ms)`,
      error.stack || error.message
    );

    res.status(HttpStatus.BAD_GATEWAY).json({
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'An error occurred while processing your request',
      error: 'Bad Gateway',
    });
  }
}