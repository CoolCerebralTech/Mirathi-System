/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
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
 * DocumentsProxyController - API Gateway proxy for documents-service
 *
 * RESPONSIBILITIES:
 * - Route /documents requests to documents-service
 * - Handle JWT authentication at gateway level
 * - Forward multipart/form-data for file uploads
 * - Handle service unavailability gracefully
 * - Provide circuit breaker behavior
 *
 * ROUTES PROXIED:
 * - POST /documents/upload (file upload)
 * - POST /documents/:id/versions (version upload)
 * - GET /documents (list documents)
 * - GET /documents/:id (get document)
 * - GET /documents/:id/download (download file)
 * - GET /documents/:id/versions/:versionNumber/download
 * - GET /documents/stats/me (user stats)
 * - PATCH /documents/:id/verify (admin)
 * - PATCH /documents/:id/reject (admin)
 * - DELETE /documents/:id (delete)
 *
 * SPECIAL HANDLING:
 * - File uploads (multipart/form-data)
 * - Binary downloads (streaming)
 * - Large payload support
 */
@ApiTags('Documents Service Proxy')
@ApiExcludeController() // Hide from Swagger - use documents-service docs
@Controller('documents')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class DocumentsProxyController {
  private readonly logger = new Logger(DocumentsProxyController.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('DOCUMENTS_SERVICE_URL');
    this.requestTimeout = this.configService.get('SERVICE_TIMEOUT') || 60000; // 60s for file uploads

    if (!this.baseUrl) {
      throw new Error('DOCUMENTS_SERVICE_URL is not configured');
    }

    this.logger.log(`Documents proxy initialized: ${this.baseUrl}`);
  }

  // ========================================================================
  // PROXY ALL ROUTES
  // ========================================================================

  /**
   * Catch-all proxy for documents endpoints
   * Handles all HTTP methods including file uploads and downloads
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

    // Determine if this is a file upload (multipart) or binary download
    const isFileUpload = headers['content-type']?.includes('multipart/form-data');
    const isDownload = originalUrl.includes('/download');

    try {
      this.logger.debug(`Proxying: ${context} -> ${targetUrl}`);

      // Handle file uploads differently (stream the multipart data)
      if (isFileUpload) {
        return await this.proxyFileUpload(req, res, targetUrl, headersToForward, context);
      }

      // Handle file downloads differently (stream the response)
      if (isDownload) {
        return await this.proxyFileDownload(req, res, targetUrl, headersToForward, context);
      }

      // Standard JSON request/response
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
      this.handleProxyError(error, res, context, duration);
    }
  }

  // ========================================================================
  // SPECIALIZED PROXY METHODS
  // ========================================================================

  /**
   * Proxy file upload requests (multipart/form-data)
   * Streams the request body directly to downstream service
   */
  private async proxyFileUpload(
    req: express.Request,
    res: express.Response,
    targetUrl: string,
    headers: Record<string, string>,
    context: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Stream the raw request to downstream service
      const response = await firstValueFrom(
        this.httpService
          .request({
            method: req.method,
            url: targetUrl,
            headers: headers,
            data: req, // Stream the request directly
            validateStatus: () => true,
            timeout: this.requestTimeout,
            maxBodyLength: Infinity, // Allow large files
            maxContentLength: Infinity,
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              throw error;
            }),
          ),
      );

      const duration = Date.now() - startTime;
      this.logger.log(`File upload proxied: ${context} - ${response.status} (${duration}ms)`);

      res.status(response.status).json(response.data);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.handleProxyError(error, res, context, duration);
    }
  }

  /**
   * Proxy file download requests
   * Streams the binary response directly to client
   */
  private async proxyFileDownload(
    req: express.Request,
    res: express.Response,
    targetUrl: string,
    headers: Record<string, string>,
    context: string,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService
          .request({
            method: req.method,
            url: targetUrl,
            headers: headers,
            responseType: 'arraybuffer', // Get binary data
            validateStatus: () => true,
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

      // If error response, convert buffer to JSON
      if (response.status >= 400) {
        const errorData = JSON.parse(response.data.toString());
        this.logger.warn(`Download error: ${context} - ${response.status} (${duration}ms)`);
        res.status(response.status).json(errorData);
      }

      // Forward headers for file download
      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      }
      if (response.headers['content-disposition']) {
        res.setHeader('Content-Disposition', response.headers['content-disposition']);
      }
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }

      this.logger.log(`File download proxied: ${context} - ${response.status} (${duration}ms)`);

      // Send binary data
      res.status(response.status).send(response.data);
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
      'content-length', // Let axios/downstream calculate this
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
    res: express.Response,
    context: string,
    duration: number,
  ): void {
    // Axios error with response from downstream service
    if (error instanceof AxiosError && error.response) {
      this.logger.warn(
        `Proxy error: ${context} - ${error.response.status} (${duration}ms)`,
        error.message,
      );

      // Handle binary error responses (from download endpoints)
      if (error.response.data instanceof Buffer) {
        try {
          const errorData = JSON.parse(error.response.data.toString());
          res.status(error.response.status).json(errorData);
        } catch {
          res.status(error.response.status).json({
            statusCode: error.response.status,
            message: 'An error occurred',
          });
        }
      }

      res.status(error.response.status).json(error.response.data);
      return;
    }

    // Timeout error
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      this.logger.error(`Proxy timeout: ${context} (${duration}ms) - Service timeout exceeded`);

      res.status(HttpStatus.GATEWAY_TIMEOUT).json({
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        message: 'Request to documents service timed out',
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
        `Proxy connection failed: ${context} - Documents service unreachable`,
        error.message,
      );

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Documents service is currently unavailable',
        error: 'Service Unavailable',
        details: {
          service: 'documents-service',
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
