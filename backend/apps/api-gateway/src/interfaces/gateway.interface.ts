export interface ServiceConfig {
  name: string;
  baseUrl: string;
  healthEndpoint: string;
  timeout: number;
  retries: number;
}

export interface RouteConfig {
  path: string;
  service: string;
  methods: string[];
  public?: boolean;
  rateLimit?: number;
  timeout?: number;
}

export interface ProxyRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  timestamp: Date;
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  statusCode: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  resetTimeoutMs: number;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  servicesHealth: ServiceHealth[];
}