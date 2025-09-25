import { Request, Response } from 'express';

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  message: string;
  context?: string;
  stack?: string;
  correlationId?: string;
  userId?: string;
  service?: string;
  duration?: number;
  [key: string]: any;
}

export interface MetricsConfig {
  enabled: boolean;
  path: string;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
  timeout?: number;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
  format: 'json' | 'pretty';
  redact?: string[];
  transport?: {
    target: string;
    options?: any;
  };
}

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  exporter: 'jaeger' | 'zipkin' | 'console' | 'prometheus';
  endpoint?: string;
  sampler?: {
    type: 'always_on' | 'always_off' | 'trace_id_ratio';
    ratio?: number;
  };
}

export interface HealthCheckConfig {
  path: string;
  timeout: number;
  details: boolean;
}

export interface ObservabilityConfig {
  serviceName: string;
  version: string;
  environment: string;
  logging: LoggingConfig;
  metrics: MetricsConfig;
  tracing: TracingConfig;
  health: HealthCheckConfig;
}

export interface HttpRequestLog {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  correlationId?: string;
  requestBody?: any;
  responseBody?: any;
  error?: string;
}

export interface BusinessMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface HealthCheckResult {
  status: 'up' | 'down';
  details?: Record<string, any>;
  error?: string;
  timestamp: Date;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  isRemote: boolean;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  heapTotal: number;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
  uptime: number;
}