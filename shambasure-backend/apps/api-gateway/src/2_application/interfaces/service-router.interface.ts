import { Request } from 'express';

/**
 * Service route configuration
 */
export interface ServiceRoute {
  path: string;
  service: string;
  serviceUrl: string;
  methods: string[];
  timeout?: number;
  requiresAuth?: boolean;
}

/**
 * Structured response from proxy requests
 */
export interface ProxyResponse {
  status: number;
  data: unknown;
  headers: Record<string, unknown>;
}

/**
 * Service router interface for dynamic routing
 */
export interface IServiceRouter {
  /**
   * Find target service for a given request
   */
  findService(request: Request): ServiceRoute | null;

  /**
   * Get all registered service routes
   */
  getRoutes(): ServiceRoute[];

  /**
   * Check if route requires authentication
   */
  requiresAuth(path: string): boolean;
}

/**
 * HTTP Client interface for service communication
 */
export interface IHttpClient {
  proxyRequest(serviceRoute: ServiceRoute, req: Request): Promise<ProxyResponse>;
  healthCheck(serviceUrl: string): Promise<boolean>;
}
