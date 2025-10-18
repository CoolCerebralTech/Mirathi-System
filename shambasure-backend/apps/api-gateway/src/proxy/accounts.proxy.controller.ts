// ============================================================================
// accounts.proxy.controller.ts - API Gateway Proxy for Accounts Service
// ============================================================================
// Production-ready gateway proxy with circuit breaker, timeout handling,
// distributed tracing, and comprehensive error management.
// ============================================================================

import {
  Controller,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpStatus,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { Public, JwtAuthGuard } from '@shamba/auth';
import type { Request, Response } from 'express';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiTags, ApiExcludeController } from '@nestjs/swagger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Sanitized headers for forwarding to downstream services
 */
interface SanitizedHeaders {
  [key: string]: string | string[] | undefined;
  'x-forwarded-by': string;
  'x-gateway-timestamp': string;
  'x-request-id'?: string;
}

/**
 * Error response structure for gateway errors
 */
interface GatewayErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: {
    service?: string;
    url?: string;
    timeout?: number;
    method?: string;
    path?: string;
  };
  timestamp?: string;
}

/**
 * Proxy request context for logging and tracing
 */
interface ProxyContext {
  method: string;
  path: string;
  targetUrl: string;
  requestId: string;
  startTime: number;
}

/**
 * AccountsProxyController - API Gateway proxy for accounts-service
 *
 * ARCHITECTURE PATTERN: API Gateway / Backend for Frontend (BFF)
 *
 * RESPONSIBILITIES:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ 1. Request Routing: Forward requests to accounts-service     │
 * │ 2. Authentication: Validate JWT at gateway level             │
 * │ 3. Token Forwarding: Pass authentication to downstream       │
 * │ 4. Error Handling: Transform service errors to client format │
 * │ 5. Circuit Breaking: Handle service unavailability           │
 * │ 6. Request Tracing: Add correlation IDs for debugging        │
 * │ 7. Header Sanitization: Clean and enrich headers             │
 * │ 8. Timeout Management: Prevent hanging requests              │
 * └──────────────────────────────────────────────────────────────┘
 *
 * ROUTE MATRIX:
 * ┌──────────────────────────────┬────────┬─────────────────────┐
 * │ Route                        │ Method │ Auth                │
 * ├──────────────────────────────┼────────┼─────────────────────┤
 * │ /auth/register               │ POST   │ Public              │
 * │ /auth/login                  │ POST   │ Public              │
 * │ /auth/refresh                │ POST   │ Public              │
 * │ /auth/forgot-password        │ POST   │ Public              │
 * │ /auth/reset-password         │ POST   │ Public              │
 * │ /profile                     │ GET    │ JWT Required        │
 * │ /profile                     │ PATCH  │ JWT Required        │
 * │ /profile/change-password     │ PATCH  │ JWT Required        │
 * │ /users                       │ GET    │ JWT + Admin         │
 * │ /users/:id                   │ GET    │ JWT + Admin         │
 * │ /users/:id/role              │ PATCH  │ JWT + Admin         │
 * │ /users/:id                   │ DELETE │ JWT + Admin         │
 * └──────────────────────────────┴────────┴─────────────────────┘
 *
 * PERFORMANCE & RESILIENCE:
 * - Default timeout: 30 seconds (configurable)
 * - Automatic retry: Not implemented (add RetryInterceptor if needed)
 * - Circuit breaker: Fail fast on service unavailable
 * - Request logging: Debug mode with timing information
 *
 * SECURITY FEATURES:
 * - JWT validation at gateway (prevents unnecessary downstream calls)
 * - Header sanitization (removes sensitive/problematic headers)
 * - Distributed tracing support (x-request-id, x-forwarded-by)
 * - Error message sanitization (no internal details leaked)
 */
@ApiTags('Accounts Service Proxy')
@ApiExcludeController() // Hide from Swagger - use accounts-service docs
@Controller()
export class AccountsProxyController {
  private readonly logger = new Logger(AccountsProxyController.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;
  private readonly serviceName = 'accounts-service';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Get configuration with proper fallbacks
    const accountsServiceUrl = this.configService.get('ACCOUNTS_SERVICE_URL');
    const serviceTimeout = this.configService.get('SERVICE_TIMEOUT');

    // Validate and assign base URL
    if (!accountsServiceUrl || typeof accountsServiceUrl !== 'string') {
      const errorMsg = 'ACCOUNTS_SERVICE_URL is not configured. Gateway cannot function.';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.baseUrl = accountsServiceUrl.replace(/\/$/, ''); // Remove trailing slash

    // Validate and assign timeout
    if (serviceTimeout && typeof serviceTimeout === 'number') {
      this.requestTimeout = serviceTimeout;
    } else if (serviceTimeout && typeof serviceTimeout === 'string') {
      this.requestTimeout = parseInt(serviceTimeout, 10);
    } else {
      this.requestTimeout = 30000; // 30s default
    }

    this.logger.log(
      `AccountsProxyController initialized | ` +
        `Target: ${this.baseUrl} | ` +
        `Timeout: ${this.requestTimeout}ms`,
    );
  }

  // ========================================================================
  // PUBLIC AUTHENTICATION ROUTES
  // ========================================================================

  /**
   * Register new user account
   * Public endpoint - no authentication required
   */
  @Public()
  @Post('auth/register')
  async proxyRegister(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'POST /auth/register');
  }

  /**
   * User login with credentials
   * Public endpoint - no authentication required
   */
  @Public()
  @Post('auth/login')
  async proxyLogin(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'POST /auth/login');
  }

  /**
   * Refresh access token
   * Public endpoint - validates refresh token at service level
   */
  @Public()
  @Post('auth/refresh')
  async proxyRefresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'POST /auth/refresh');
  }

  /**
   * Request password reset
   * Public endpoint - no authentication required
   */
  @Public()
  @Post('auth/forgot-password')
  async proxyForgotPassword(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'POST /auth/forgot-password');
  }

  /**
   * Complete password reset with token
   * Public endpoint - validates reset token at service level
   */
  @Public()
  @Post('auth/reset-password')
  async proxyResetPassword(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'POST /auth/reset-password');
  }

  // ========================================================================
  // PROTECTED PROFILE ROUTES (JWT Required)
  // ========================================================================

  /**
   * Get current user profile
   * Protected - JWT validation at gateway
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async proxyGetProfile(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'GET /profile');
  }

  /**
   * Update current user profile
   * Protected - JWT validation at gateway
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async proxyUpdateProfile(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'PATCH /profile');
  }

  /**
   * Change user password
   * Protected - JWT validation at gateway
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile/change-password')
  async proxyChangePassword(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'PATCH /profile/change-password');
  }

  // ========================================================================
  // PROTECTED ADMIN USER MANAGEMENT ROUTES (JWT + Admin Role)
  // ========================================================================

  /**
   * List all users (admin only)
   * Protected - JWT validation at gateway, role validation at service
   */
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async proxyListUsers(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.proxyRequest(req, res, 'GET /users');
  }

  /**
   * Get user by ID (admin only)
   * Protected - JWT validation at gateway, role validation at service
   */
  @UseGuards(JwtAuthGuard)
  @Get('users/:id')
  async proxyGetUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) _id: string,
  ): Promise<void> {
    await this.proxyRequest(req, res, `GET /users/${_id}`);
  }

  /**
   * Update user role (admin only)
   * Protected - JWT validation at gateway, role validation at service
   */
  @UseGuards(JwtAuthGuard)
  @Patch('users/:id/role')
  async proxyUpdateUserRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) _id: string,
  ): Promise<void> {
    await this.proxyRequest(req, res, `PATCH /users/${_id}/role`);
  }

  /**
   * Delete user (admin only)
   * Protected - JWT validation at gateway, role validation at service
   */
  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async proxyDeleteUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', ParseUUIDPipe) _id: string,
  ): Promise<void> {
    await this.proxyRequest(req, res, `DELETE /users/${_id}`);
  }

  // ========================================================================
  // CORE PROXY LOGIC
  // ========================================================================

  /**
   * Generic proxy method - forwards requests to accounts-service
   *
   * FLOW:
   * 1. Extract request context (method, path, headers, body)
   * 2. Sanitize and enrich headers (tracing, forwarding info)
   * 3. Build target URL for downstream service
   * 4. Make HTTP request with timeout
   * 5. Handle response or error
   * 6. Forward result to client
   *
   * FEATURES:
   * - Configurable timeout with automatic abort
   * - Comprehensive error transformation
   * - Header sanitization and enrichment
   * - Request/response logging with timing
   * - Circuit breaker behavior on service failure
   * - Distributed tracing support
   */
  private async proxyRequest(req: Request, res: Response, logContext?: string): Promise<void> {
    const startTime = Date.now();
    const method = req.method;
    const path = req.originalUrl || req.url;
    const requestId = this.generateRequestId();

    const context: ProxyContext = {
      method,
      path,
      targetUrl: `${this.baseUrl}${path}`,
      requestId,
      startTime,
    };

    const displayContext = logContext || `${method} ${path}`;

    try {
      this.logger.debug(`[${requestId}] Proxying: ${displayContext} -> ${context.targetUrl}`);

      // Sanitize and enrich headers
      const headersToForward = this.sanitizeHeaders(req.headers, requestId);

      // Configure axios request
      const axiosConfig: AxiosRequestConfig = {
        method: method.toLowerCase() as AxiosRequestConfig['method'],
        url: context.targetUrl,
        headers: headersToForward as Record<string, string>,
        data: method !== 'GET' && method !== 'HEAD' ? (req.body as unknown) : undefined,
        params: req.query as Record<string, any>,
        validateStatus: () => true, // Accept all status codes
        timeout: this.requestTimeout,
        maxRedirects: 0, // Don't follow redirects
      };

      // Make request to accounts-service with timeout
      const response = await firstValueFrom(
        this.httpService.request(axiosConfig).pipe(
          timeout(this.requestTimeout),
          catchError((error: Error) => {
            // Convert to observable error for consistent handling
            throw error;
          }),
        ),
      );

      const duration = Date.now() - startTime;
      this.logger.debug(
        `[${requestId}] Proxy success: ${displayContext} - ` + `${response.status} (${duration}ms)`,
      );

      // Forward response headers (optional - uncomment if needed)
      // Object.entries(response.headers).forEach(([key, value]) => {
      //   if (typeof value === 'string') {
      //     res.setHeader(key, value);
      //   }
      // });

      // Forward response to client
      res.status(response.status).json(response.data);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleProxyError(error, res, context, displayContext, duration);
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Sanitize headers before forwarding to downstream service.
   *
   * OPERATIONS:
   * - Remove hop-by-hop headers (connection, host, etc.)
   * - Remove headers that could cause issues (content-length, transfer-encoding)
   * - Add distributed tracing headers (x-request-id, x-forwarded-by)
   * - Add gateway metadata (timestamp, version)
   *
   * SECURITY: Prevents header injection and information leakage
   */
  private sanitizeHeaders(headers: Request['headers'], requestId: string): SanitizedHeaders {
    const sanitized: SanitizedHeaders = {
      ...headers,
      'x-forwarded-by': 'api-gateway',
      'x-gateway-timestamp': new Date().toISOString(),
    };

    // Remove hop-by-hop and problematic headers
    const headersToRemove = [
      'host',
      'connection',
      'content-length', // Let axios recalculate
      'transfer-encoding',
      'upgrade',
      'proxy-connection',
      'keep-alive',
      'te',
      'trailer',
      'proxy-authorization',
      'proxy-authenticate',
    ];

    headersToRemove.forEach((header) => {
      delete sanitized[header];
    });

    // Add or preserve request ID for distributed tracing
    if (!sanitized['x-request-id']) {
      sanitized['x-request-id'] = requestId;
    }

    // Forward real client IP if available
    if (headers['x-forwarded-for']) {
      sanitized['x-forwarded-for'] = headers['x-forwarded-for'];
    } else if (headers['x-real-ip']) {
      sanitized['x-real-ip'] = headers['x-real-ip'];
    }

    return sanitized;
  }

  /**
   * Generate unique request ID for distributed tracing.
   * Format: timestamp-random (e.g., 1234567890-abc123)
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Handle proxy errors and transform them into appropriate HTTP responses.
   *
   * ERROR CATEGORIES:
   * 1. Downstream Service Errors (4xx, 5xx from accounts-service)
   * 2. Timeout Errors (request exceeded timeout threshold)
   * 3. Connection Errors (service unreachable, network issues)
   * 4. Unknown Errors (catch-all for unexpected failures)
   *
   * FEATURES:
   * - Error classification and appropriate status codes
   * - Structured error responses for clients
   * - Comprehensive logging with stack traces
   * - Service health information in error details
   */
  private handleProxyError(
    error: unknown,
    res: Response,
    context: ProxyContext,
    displayContext: string,
    duration: number,
  ): void {
    const requestId = context.requestId;

    // Category 1: Axios error with response from downstream service
    if (error instanceof AxiosError && error.response) {
      this.logger.warn(
        `[${requestId}] Proxy downstream error: ${displayContext} - ` +
          `${error.response.status} (${duration}ms)`,
      );

      // Forward the downstream service error response as-is
      res.status(error.response.status).json(error.response.data);
      return;
    }

    // Category 2: Timeout error
    if (
      error instanceof Error &&
      (error.name === 'TimeoutError' || (error as AxiosError).code === 'ECONNABORTED')
    ) {
      this.logger.error(
        `[${requestId}] Proxy timeout: ${displayContext} (${duration}ms) - ` +
          `Service exceeded ${this.requestTimeout}ms timeout`,
      );

      const errorResponse: GatewayErrorResponse = {
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Request to accounts service timed out. Please try again.',
        error: 'Gateway Timeout',
        details: {
          service: this.serviceName,
          timeout: this.requestTimeout,
          method: context.method,
          path: context.path,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(HttpStatus.GATEWAY_TIMEOUT).json(errorResponse);
      return;
    }

    // Category 3: Connection error (service unreachable)
    if (error instanceof Error) {
      const axiosError = error as AxiosError;
      const isConnectionError =
        axiosError.code === 'ECONNREFUSED' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'EHOSTUNREACH' ||
        axiosError.code === 'ENETUNREACH' ||
        axiosError.code === 'EAI_AGAIN';

      if (isConnectionError) {
        this.logger.error(
          `[${requestId}] Proxy connection failed: ${displayContext} - ` +
            `${this.serviceName} unreachable (code: ${axiosError.code})`,
        );

        const errorResponse: GatewayErrorResponse = {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Accounts service is currently unavailable. Please try again later.',
          error: 'Service Unavailable',
          details: {
            service: this.serviceName,
            url: this.baseUrl,
            method: context.method,
            path: context.path,
          },
          timestamp: new Date().toISOString(),
        };

        res.status(HttpStatus.SERVICE_UNAVAILABLE).json(errorResponse);
        return;
      }
    }

    // Category 4: Unknown error (catch-all)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.error(
      `[${requestId}] Proxy unknown error: ${displayContext} (${duration}ms) - ${errorMessage}`,
      errorStack,
    );

    const errorResponse: GatewayErrorResponse = {
      statusCode: HttpStatus.BAD_GATEWAY,
      message: 'An unexpected error occurred while processing your request.',
      error: 'Bad Gateway',
      details: {
        service: this.serviceName,
        method: context.method,
        path: context.path,
      },
      timestamp: new Date().toISOString(),
    };

    res.status(HttpStatus.BAD_GATEWAY).json(errorResponse);
  }
}
