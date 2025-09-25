import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ShambaConfigService } from '@shamba/config';
import { TraceContext } from '../interfaces/observability.interface';

@Injectable()
export class TracingService implements OnModuleInit, OnModuleDestroy {
  private sdk: NodeSDK | null = null;
  private isInitialized = false;

  constructor(private configService: ShambaConfigService) {}

  async onModuleInit() {
    if (!this.configService.tracing.enabled) {
      return;
    }

    try {
      await this.initializeTracing();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize tracing', error);
    }
  }

  async onModuleDestroy() {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  private async initializeTracing() {
    const { tracing, app } = this.configService;

    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: tracing.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: app.version,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: app.environment,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter: this.createExporter(tracing.exporter),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    await sdk.start();
    this.sdk = sdk;
  }

  private createExporter(exporterType: string) {
    switch (exporterType) {
      case 'jaeger':
        return new JaegerExporter({
          endpoint: this.configService.tracing.endpoint || 'http://localhost:14268/api/traces',
        });
      
      case 'prometheus':
        return new PrometheusExporter({
          port: 9464,
        });
      
      default:
        // Console exporter for development
        return undefined;
    }
  }

  getTraceContext(): TraceContext | null {
    // This would integrate with OpenTelemetry context propagation
    // For now, return a mock context
    if (!this.isInitialized) {
      return null;
    }

    return {
      traceId: 'mock-trace-id',
      spanId: 'mock-span-id',
      traceFlags: 1,
      isRemote: false,
    };
  }

  isEnabled(): boolean {
    return this.isInitialized;
  }

  // Custom tracing methods
  startSpan(name: string, attributes?: Record<string, any>) {
    // This would create a custom span
    // Implementation depends on OpenTelemetry API usage
    console.log(`Starting span: ${name}`, attributes);
  }

  endSpan(name: string) {
    console.log(`Ending span: ${name}`);
  }

  recordException(error: Error, attributes?: Record<string, any>) {
    console.error('Exception recorded:', error, attributes);
  }
}