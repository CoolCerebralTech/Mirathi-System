import { DynamicModule, Module, OnApplicationShutdown, Logger } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { TracingService } from './tracing.service';

let sdk: NodeSDK; // Keep a global reference to the SDK for shutdown

@Module({
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule implements OnApplicationShutdown {
  private static readonly logger = new Logger('TracingModule');

  /**
   * Configures and initializes the OpenTelemetry SDK for the application.
   * This should be imported once in the root module of each microservice.
   */
  static register(config: { serviceName: string; version: string }): DynamicModule {
    // --- The complex setup logic now lives here ---
    const traceExporter = new OTLPTraceExporter({
      // The OTLP endpoint is the standard for modern observability backends (Jaeger, Grafana Tempo, etc.)
      // It should be configured via environment variables.
      // url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317'
    });

    sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: config.version,
      }),
      traceExporter,
      // This is magic: it automatically instruments popular libraries like
      // NestJS (http), Prisma, RabbitMQ (amqplib), etc.
      instrumentations: [getNodeAutoInstrumentations()],
    });

    // Start the SDK.
    // We wrap this in a try/catch to prevent a tracing setup failure
    // from crashing the entire application during startup.
    try {
      sdk.start();
      this.logger.log('OpenTelemetry Tracing SDK started successfully.');
    } catch (error) {
      this.logger.error('Failed to start OpenTelemetry Tracing SDK.', error);
    }

    return {
      module: TracingModule,
      providers: [TracingService],
      exports: [TracingService],
    };
  }

  /**
   * Gracefully shuts down the SDK when the NestJS application closes.
   */
  async onApplicationShutdown(signal?: string) {
    if (sdk) {
      try {
        await sdk.shutdown();
        TracingModule.logger.log('OpenTelemetry Tracing SDK shut down successfully.');
      } catch (error) {
        TracingModule.logger.error('Failed to shut down Tracing SDK.', error);
      }
    }
  }
}