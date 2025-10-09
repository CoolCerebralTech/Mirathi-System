import { DynamicModule, Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigService } from '@shamba/config';
import { randomUUID } from 'crypto';

import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthService } from './health/health.service';

// ============================================================================
// Shared Observability Module
// ============================================================================
// This is the single, centralized module for essential observability features.
// It configures Logging, Metrics, and Health Checks for a microservice.
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

        // --- 3. LOGGER MODULE ---
        // Configures nestjs-pino as the application's default logger.
        PinoLoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const isProduction = configService.isProduction;
            return {
              pinoHttp: {
                transport: isProduction
                  ? undefined // In production, log to stdout and let a log collector handle it.
                  : { target: 'pino-pretty', options: { colorize: true, singleLine: true } },
                level: configService.get('LOG_LEVEL') || 'info',

                // Redact sensitive information from logs.
                redact: {
                  paths: ['req.headers.authorization', '*.password', '*.token', 'body.password'],
                  censor: '***REDACTED***',
                },

                // Generate a request ID for correlation if one doesn't exist.
                genReqId: (req, res) => {
                  const existingId = req.id ?? req.headers['x-request-id'];
                  if (existingId) return existingId;
                  const id = randomUUID();
                  res.setHeader('x-request-id', id);
                  return id;
                },

                // Define the base shape of all logs, including service context.
                base: {
                  service: config.serviceName,
                  version: config.version,
                },
              },
            };
          },
        }),
      ],
      // Export HealthService so it can be injected into the root controller
      // to create the /health endpoint.
      exports: [HealthService],
    };
  }
}
