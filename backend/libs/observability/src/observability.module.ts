import { DynamicModule, Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';

import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracingModule } from './tracing/tracing.module';
import { HealthService } from './health/health.service';

// ============================================================================
// Shamba Sure - Shared Observability Module
// ============================================================================
// This is the single, centralized module for all observability features.
// It uses a dynamic `register()` method to configure all sub-modules
// (Logging, Tracing, Metrics, Health) for a specific microservice.
//
// By importing this one module into the root of each service, we guarantee
// that observability is handled consistently and robustly everywhere.
// ============================================================================

@Global()
@Module({})
export class ObservabilityModule {
  /**
   * Configures and registers all observability features for a service.
   * @param config An object containing the service's name and version.
   */
  static register(config: { serviceName: string; version: string }): DynamicModule {
    return {
      module: ObservabilityModule,
      imports: [
        // --- 1. HEALTH MODULE ---
        // Provides the /health endpoints via the HealthService.
        HealthModule,

        // --- 2. METRICS MODULE ---
        // Configures Prometheus metrics with the correct service name.
        MetricsModule.register(config),

        // --- 3. TRACING MODULE ---
        // Initializes and starts the OpenTelemetry SDK.
        TracingModule.register(config),

        // --- 4. LOGGER MODULE ---
        // Configures the nestjs-pino logger as the application's default.
        PinoLoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const isProduction = configService.isProduction;
            return {
              pinoHttp: {
                transport: !isProduction
                  ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
                  : undefined,
                level: configService.get('LOG_LEVEL'),
                // Define the base shape of all logs
                base: {
                  service: config.serviceName,
                  version: config.version,
                },
                // Redact sensitive info
                redact: {
                  paths: [
                    'req.headers.authorization',
                    '*.password',
                    '*.token',
                  ],
                  censor: '***REDACTED***',
                },
                // Generate a request ID for correlation
                genReqId: (req, res) => {
                  const id = require('crypto').randomUUID();
                  res.setHeader('x-request-id', id);
                  return id;
                },
              },
            };
          },
        }),
      ],
      // We only need to export the HealthService, as it's the only one
      // that needs to be explicitly injected into a controller to create an endpoint.
      // The other services/modules work automatically in the background.
      exports: [HealthService],
    };
  }
}