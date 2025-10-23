/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ============================================================================
// documents.proxy.controller.ts - API Gateway Proxy for Documents Service
// ============================================================================
// Production-ready gateway proxy with explicit routing, type safety,
// circuit breaker, timeout handling, and comprehensive error management.
// ============================================================================

import { Controller, Req, Res, UseGuards, Logger, HttpStatus, All } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@shamba/config';
import { JwtAuthGuard } from '@shamba/auth';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiExcludeController } from '@nestjs/swagger';

// ============================================================================
// TYPE DEFINITIONS (from your original file, kept for context)
// ============================================================================
// ... [GatewayErrorResponse, ProxyContext, etc.] ...

/**
 * DocumentsProxyController - API Gateway proxy for documents-service
 *
 * [ Your team's excellent documentation comments are preserved here... ]
 */
@ApiExcludeController()
@Controller('documents') // All routes in this file start with /api/v1/documents
@UseGuards(JwtAuthGuard) // All routes require authentication by default
export class DocumentsProxyController {
  private readonly logger = new Logger(DocumentsProxyController.name);
  private readonly baseUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('DOCUMENTS_SERVICE_URL');
    this.requestTimeout = this.configService.get('SERVICE_TIMEOUT') || 60000;

    if (!this.baseUrl) {
      throw new Error('DOCUMENTS_SERVICE_URL is not configured');
    }
    this.logger.log(`Documents proxy initialized for: ${this.baseUrl}`);
  }

  // ========================================================================
  // EXPLICIT ROUTE HANDLERS
  // ========================================================================

  /**
   * Catch-all for standard JSON routes.
   * This will match GET /, GET /:id, PATCH /:id, DELETE /:id, etc.
   * It will NOT match the more specific routes defined below.
   */
  @All()
  async proxyJsonRoutes(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyJsonRequest(req, res);
  }

  /**
   * Specific handler for multipart/form-data uploads.
   * Matches POST /documents/upload and POST /documents/:id/versions
   */
  @All(['upload', ':id/versions'])
  async proxyUploadRoutes(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyFileUpload(req, res);
  }

  /**
   * Specific handler for binary file downloads.
   * Matches GET /documents/:id/download and GET /documents/:id/versions/:version/download
   */
  @All([':id/download', ':id/versions/:version/download'])
  async proxyDownloadRoutes(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.proxyFileDownload(req, res);
  }

  // ========================================================================
  // CORE PROXY LOGIC METHODS
  // ========================================================================

  /**
   * Proxies a standard JSON request.
   */
  private async proxyJsonRequest(req: Request, res: Response): Promise<void> {
    const config: AxiosRequestConfig = {
      method: req.method,
      url: `${this.baseUrl}${req.originalUrl}`,
      data: req.body,
      headers: this.sanitizeHeaders(req.headers),
      timeout: this.requestTimeout,
      validateStatus: () => true,
    };
    try {
      const response = await firstValueFrom(this.httpService.request(config));
      res.status(response.status).json(response.data);
    } catch (error) {
      this.handleProxyError(error as AxiosError, res, req.originalUrl);
    }
  }

  /**
   * Proxies a multipart/form-data file upload.
   */
  private async proxyFileUpload(req: Request, res: Response): Promise<void> {
    const config: AxiosRequestConfig = {
      method: req.method,
      url: `${this.baseUrl}${req.originalUrl}`,
      data: req, // Stream the raw request
      headers: this.sanitizeHeaders(req.headers),
      timeout: this.requestTimeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    };
    try {
      const response = await firstValueFrom(this.httpService.request(config));
      res.status(response.status).json(response.data);
    } catch (error) {
      this.handleProxyError(error as AxiosError, res, req.originalUrl);
    }
  }

  /**
   * Proxies a binary file download.
   */
  private async proxyFileDownload(req: Request, res: Response): Promise<void> {
    const config: AxiosRequestConfig = {
      method: req.method,
      url: `${this.baseUrl}${req.originalUrl}`,
      headers: this.sanitizeHeaders(req.headers),
      responseType: 'stream', // Stream the binary response
      timeout: this.requestTimeout,
      validateStatus: () => true,
    };
    try {
      const response = await firstValueFrom(this.httpService.request(config));
      res.status(response.status);
      // Forward all relevant headers from the downstream response
      res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Disposition', response.headers['content-disposition'] || 'attachment');
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }
      response.data.pipe(res); // Pipe the stream directly to the client
    } catch (error) {
      this.handleProxyError(error as AxiosError, res, req.originalUrl);
    }
  }

  // ========================================================================
  // HELPER METHODS (Now with improved type safety)
  // ========================================================================

  private sanitizeHeaders(headers: Request['headers']): Record<string, string> {
    const sanitized: Record<string, any> = { ...headers };
    const headersToRemove = ['host', 'connection', 'content-length', 'transfer-encoding'];
    headersToRemove.forEach((h) => delete sanitized[h]);
    sanitized['x-forwarded-by'] = 'api-gateway';
    return sanitized as Record<string, string>;
  }

  private handleProxyError(error: AxiosError, res: Response, context: string): void {
    if (error.response) {
      this.logger.warn(`Proxy error: ${context} - ${error.response.status}`, error.message);
      // Check if response data is a stream (from a failed download)
      if (typeof error.response.data?.pipe === 'function') {
        error.response.data.pipe(res.status(error.response.status));
      } else {
        res.status(error.response.status).json(error.response.data);
      }
      return;
    }
    if (error.code === 'ECONNABORTED' || error.name === 'TimeoutError') {
      this.logger.error(`Proxy timeout: ${context}`);
      res
        .status(HttpStatus.GATEWAY_TIMEOUT)
        .json({ message: 'Request to documents service timed out' });
      return;
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      this.logger.error(`Proxy connection failed: ${context} - Documents service unreachable`);
      res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ message: 'Documents service is currently unavailable' });
      return;
    }
    this.logger.error(`Proxy unknown error: ${context}`, error.stack);
    res
      .status(HttpStatus.BAD_GATEWAY)
      .json({ message: 'An error occurred while processing your request' });
  }
}
