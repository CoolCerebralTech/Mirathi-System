import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';
import { ShambaConfigService } from '@shamba/config';
import { BusinessMetric, PerformanceMetrics } from '../interfaces/observability.interface';

@Injectable()
export class MetricsService implements OnModuleInit {
  private registry: client.Registry;
  private defaultLabels: Record<string, string> = {};

  // HTTP metrics
  private httpRequestDuration: client.Histogram;
  private httpRequestTotal: client.Counter;
  private httpErrorTotal: client.Counter;

  // Business metrics
  private userRegistrations: client.Counter;
  private willsCreated: client.Counter;
  private documentsUploaded: client.Counter;
  private notificationsSent: client.Counter;

  // System metrics
  private memoryUsage: client.Gauge;
  private cpuUsage: client.Gauge;
  private eventLoopDelay: client.Gauge;
  private activeConnections: client.Gauge;

  constructor(private configService: ShambaConfigService) {
    this.registry = new client.Registry();
    this.initializeMetrics();
  }

  async onModuleInit() {
    if (this.configService.logging.level === 'debug') {
      this.startSystemMetricsCollection();
    }
  }

  private initializeMetrics() {
    const { app } = this.configService;
    
    this.defaultLabels = {
      service: app.name,
      version: app.version,
      environment: app.environment,
    };

    this.registry.setDefaultLabels(this.defaultLabels);

    // HTTP Metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpErrorTotal = new client.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code', 'error_type'],
    });

    // Business Metrics
    this.userRegistrations = new client.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['role'],
    });

    this.willsCreated = new client.Counter({
      name: 'wills_created_total',
      help: 'Total number of wills created',
      labelNames: ['status'],
    });

    this.documentsUploaded = new client.Counter({
      name: 'documents_uploaded_total',
      help: 'Total number of documents uploaded',
      labelNames: ['status', 'type'],
    });

    this.notificationsSent = new client.Counter({
      name: 'notifications_sent_total',
      help: 'Total number of notifications sent',
      labelNames: ['channel', 'status'],
    });

    // System Metrics
    this.memoryUsage = new client.Gauge({
      name: 'process_memory_usage_bytes',
      help: 'Memory usage of the process',
      labelNames: ['type'],
    });

    this.cpuUsage = new client.Gauge({
      name: 'process_cpu_usage_percent',
      help: 'CPU usage of the process',
    });

    this.eventLoopDelay = new client.Gauge({
      name: 'event_loop_delay_seconds',
      help: 'Event loop delay in seconds',
    });

    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
    });

    // Register metrics
    [
      this.httpRequestDuration,
      this.httpRequestTotal,
      this.httpErrorTotal,
      this.userRegistrations,
      this.willsCreated,
      this.documentsUploaded,
      this.notificationsSent,
      this.memoryUsage,
      this.cpuUsage,
      this.eventLoopDelay,
      this.activeConnections,
    ].forEach(metric => this.registry.registerMetric(metric));

    // Collect default metrics
    if (this.configService.metrics.collectDefaultMetrics) {
      client.collectDefaultMetrics({
        register: this.registry,
        timeout: this.configService.metrics.timeout,
      });
    }
  }

  // HTTP Metrics
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    const labels = { method, route, status_code: statusCode.toString() };

    this.httpRequestDuration.observe(labels, duration / 1000);
    this.httpRequestTotal.inc(labels);

    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error';
      this.httpErrorTotal.inc({ ...labels, error_type: errorType });
    }
  }

  recordHttpError(method: string, route: string, statusCode: number, errorType: string) {
    this.httpErrorTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      error_type: errorType,
    });
  }

  // Business Metrics
  recordUserRegistration(role: string) {
    this.userRegistrations.inc({ role });
  }

  recordWillCreated(status: string) {
    this.willsCreated.inc({ status });
  }

  recordDocumentUploaded(status: string, type: string) {
    this.documentsUploaded.inc({ status, type });
  }

  recordNotificationSent(channel: string, status: string) {
    this.notificationsSent.inc({ channel, status });
  }

  // Custom metrics
  recordBusinessMetric(name: string, value: number, labels: Record<string, string> = {}) {
    // Dynamically create metric if it doesn't exist
    let metric = this.registry.getSingleMetric(name) as client.Gauge;
    
    if (!metric) {
      metric = new client.Gauge({
        name,
        help: `Business metric: ${name}`,
        labelNames: Object.keys(labels),
      });
      this.registry.registerMetric(metric);
    }

    metric.set(labels, value);
  }

  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1) {
    let counter = this.registry.getSingleMetric(name) as client.Counter;
    
    if (!counter) {
      counter = new client.Counter({
        name,
        help: `Counter: ${name}`,
        labelNames: Object.keys(labels),
      });
      this.registry.registerMetric(counter);
    }

    counter.inc(labels, value);
  }

  // System metrics collection
  private startSystemMetricsCollection() {
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      this.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
      this.memoryUsage.set({ type: 'heap_total' }, memoryUsage.heapTotal);
      this.memoryUsage.set({ type: 'heap_used' }, memoryUsage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, memoryUsage.external);

      const cpuUsage = process.cpuUsage();
      this.cpuUsage.set((cpuUsage.user + cpuUsage.system) / 1000000); // Convert to milliseconds
    }, 10000); // Every 10 seconds
  }

  // Performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
      memoryUsage: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      eventLoopDelay: 0, // Would need measurement
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length,
      uptime: process.uptime(),
    };
  }

  // Metrics endpoint data
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Health check metrics
  getMetricsHealth(): { status: string; details: any } {
    const metrics = this.registry.getMetricsAsJSON();
    return {
      status: 'healthy',
      details: {
        metricsCount: metrics.length,
        lastScrape: new Date().toISOString(),
      },
    };
  }
}