import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ServiceRegistryService } from './service-registry.service';
import { LoggerService } from '@shamba/observability';
import { ProxyRequest, ProxyResponse } from '../interfaces/gateway.interface';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    private serviceRegistry: ServiceRegistryService,
    private observabilityLogger: LoggerService,
  ) {
    this.axiosInstance = axios.create({
      timeout: 30000,
      maxRedirects: 0,
      validateStatus: () => true, // Don't throw on HTTP error status
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const requestId = uuidv4();
        config.headers['x-request-id'] = requestId;
        config.headers['x-gateway'] = 'shamba-api-gateway';
        
        this.observabilityLogger.debug(`Proxying request: ${config.method?.toUpperCase()} ${config.url}`, 'ProxyService', {
          requestId,
          service: config.baseURL,
          path: config.url,
        });

        return config;
      },
      (error) => {
        this.observabilityLogger.error('Request interceptor error', 'ProxyService', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.observabilityLogger.error('Proxy request failed', 'ProxyService', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
        });

        // Don't expose internal errors to clients
        if (!error.response) {
          throw new HttpException(
            'Service temporarily unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        return Promise.resolve(error.response as AxiosResponse);
      },
    );
  }

  async proxyRequest(proxyRequest: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();
    const { method, url, headers, body, user } = proxyRequest;

    try {
      // Determine which service to route to
      const serviceConfig = this.serviceRegistry.getServiceByPath(url);
      if (!serviceConfig) {
        throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
      }

      // Check if service is healthy
      if (!this.serviceRegistry.isServiceHealthy(serviceConfig.name)) {
        throw new HttpException(
          `Service ${serviceConfig.name} is unavailable`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Prepare headers for forwarding
      const forwardHeaders = this.prepareForwardHeaders(headers, user);

      // Make the request to the target service
      const response = await this.axiosInstance({
        method: method as any,
        url: this.buildServiceUrl(serviceConfig.baseUrl, url),
        headers: forwardHeaders,
        data: body,
        timeout: serviceConfig.timeout,
      });

      const duration = Date.now() - startTime;

      // Log the successful proxy request
      this.observabilityLogger.httpRequest({
        method,
        url,
        statusCode: response.status,
        responseTime: duration,
        userAgent: headers['user-agent'],
        ip: headers['x-forwarded-for'] || headers['x-real-ip'],
        userId: user?.userId,
      });

      return {
        status: response.status,
        headers: this.filterResponseHeaders(response.headers),
        body: response.data,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof HttpException) {
        throw error;
      }

      this.observabilityLogger.error('Proxy request failed', 'ProxyService', {
        url,
        method,
        duration,
        error: error.message,
      });

      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private prepareForwardHeaders(headers: Record<string, string>, user?: any): Record<string, string> {
    const forwardHeaders: Record<string, string> = {};

    // Forward specific headers only
    const allowedHeaders = [
      'authorization',
      'content-type',
      'accept',
      'user-agent',
      'x-request-id',
      'x-correlation-id',
      'x-real-ip',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-forwarded-host',
    ];

    // Copy allowed headers
    allowedHeaders.forEach(header => {
      if (headers[header]) {
        forwardHeaders[header] = headers[header];
      }
    });

    // Add user context if available
    if (user) {
      forwardHeaders['x-user-id'] = user.userId;
      forwardHeaders['x-user-email'] = user.email;
      forwardHeaders['x-user-role'] = user.role;
    }

    // Add gateway identification
    forwardHeaders['x-gateway-version'] = '1.0.0';
    forwardHeaders['x-gateway-timestamp'] = new Date().toISOString();

    return forwardHeaders;
  }

  private filterResponseHeaders(headers: any): Record<string, string> {
    const filteredHeaders: Record<string, string> = {};
    
    // Remove sensitive headers and only allow specific ones
    const allowedHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'last-modified',
      'location',
    ];

    Object.keys(headers).forEach(header => {
      const lowerHeader = header.toLowerCase();
      if (allowedHeaders.includes(lowerHeader) && headers[header]) {
        filteredHeaders[header] = headers[header];
      }
    });

    return filteredHeaders;
  }

  private buildServiceUrl(baseUrl: string, originalUrl: string): string {
    // Remove the service prefix from the URL
    const segments = originalUrl.split('/').filter(segment => segment);
    if (segments.length > 0) {
      // Remove the first segment (service name)
      segments.shift();
    }

    const path = segments.length > 0 ? `/${segments.join('/')}` : '';
    return `${baseUrl}${path}`;
  }

  async healthCheck(): Promise<{ status: string; services: any[] }> {
    const servicesHealth = this.serviceRegistry.getAllServicesHealth();
    
    const allHealthy = servicesHealth.every(health => health.status === 'healthy');
    const status = allHealthy ? 'healthy' : 'degraded';

    return {
      status,
      services: servicesHealth.map(health => ({
        service: health.service,
        status: health.status,
        responseTime: health.responseTime,
        lastCheck: health.lastCheck,
      })),
    };
  }

  getMetrics(): any {
    // This would return gateway metrics
    // In a real implementation, you'd track these metrics
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      servicesHealth: this.serviceRegistry.getAllServicesHealth(),
    };
  }
}