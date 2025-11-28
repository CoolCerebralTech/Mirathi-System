import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import axios, { Method, RawAxiosRequestHeaders } from 'axios';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';

import { IHttpClient, ServiceRoute } from '../../application/interfaces/service-router.interface';

// Define a type for the structured response we'll return
export interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, unknown>;
}

@Injectable()
export class HttpClientService implements IHttpClient {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(
    private readonly httpService: HttpService, // Although unused here, it's good to keep for future config needs
  ) {}

  /**
   * Health check for a downstream service.
   * Pings the /health endpoint of the given service URL.
   */
  async healthCheck(serviceUrl: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${serviceUrl}/health/readiness`, {
          // Best to check readiness
          timeout: 5000, // Fail fast on health checks
        }),
      );
      // Ensure we get a successful status code
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Health check failed for ${serviceUrl}. Error: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Forwards a client request to a downstream service.
   * This method handles building the target URL, forwarding relevant headers,
   * and intelligently handling both network errors and application errors.
   */
  async proxyRequest(serviceRoute: ServiceRoute, req: Request): Promise<ProxyResponse> {
    const targetUrl = `${serviceRoute.serviceUrl}${req.originalUrl}`;
    const headers = this.buildForwardedHeaders(req);

    this.logger.debug(`[Proxying] -> ${req.method} ${targetUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: req.method as Method,
          url: targetUrl,
          data: req.body as unknown,
          headers: headers,
          timeout: serviceRoute.timeout || 30000,
          // CRITICAL: We handle status codes ourselves, so we tell axios not to throw on 4xx/5xx responses.
          validateStatus: () => true,
        }),
      );

      this.logger.debug(`[Proxy Response] <- ${response.status} from ${targetUrl}`);
      return {
        status: response.status,
        data: response.data as unknown,
        headers: response.headers as Record<string, unknown>,
      };
    } catch (error) {
      // This catch block now only handles NETWORK-LEVEL errors (timeouts, DNS failures, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`[Proxy Error] Unreachable service at ${targetUrl}: ${errorMessage}`);

      // Differentiate between timeout and other connection errors
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return {
          status: 504, // Gateway Timeout
          data: {
            message: 'The downstream service timed out.',
            error: 'Gateway Timeout',
            statusCode: 504,
          },
          headers: {},
        };
      }

      // For all other network errors, return Bad Gateway
      return {
        status: 502, // Bad Gateway
        data: {
          message: 'The downstream service is unreachable.',
          error: 'Bad Gateway',
          statusCode: 502,
        },
        headers: {},
      };
    }
  }

  /**
   * Prepares a clean set of headers to forward to the downstream service.
   * This includes crucial tracing and authentication headers.
   */
  private buildForwardedHeaders(req: Request): RawAxiosRequestHeaders {
    const headers: RawAxiosRequestHeaders = {};

    // Forward the request ID set by a middleware
    const requestId = req.headers['x-request-id'];
    if (typeof requestId === 'string') {
      headers['x-request-id'] = requestId;
    } else if (Array.isArray(requestId)) {
      const firstValue = requestId[0];
      if (typeof firstValue === 'string') {
        headers['x-request-id'] = firstValue;
      }
    }

    // Forward the authorization header for authenticated requests
    const authorization = req.headers['authorization'];
    if (typeof authorization === 'string') {
      headers['authorization'] = authorization;
    } else if (Array.isArray(authorization)) {
      const firstValue = authorization[0];
      if (typeof firstValue === 'string') {
        headers['authorization'] = firstValue;
      }
    }

    // Let the downstream service know the request came from the gateway
    headers['x-gateway-service'] = 'api-gateway';

    // Forward the original host and IP for logging/rate-limiting purposes
    headers['x-forwarded-for'] = req.ip || 'unknown';
    headers['x-forwarded-host'] = req.hostname;

    return headers;
  }
}
