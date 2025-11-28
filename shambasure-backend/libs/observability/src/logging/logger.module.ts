import { Module } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { ConfigService } from '@shamba/config';

@Module({
  imports: [
    // We use the official nestjs-pino module for all our logging needs.
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.isProduction;

        return {
          // The pinoHttp object configures the automatic request logger.
          pinoHttp: {
            // Use a pretty formatter in development for readability.
            transport: !isProduction
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,

            level: configService.get('LOG_LEVEL'),

            // This is the core of our structured logging.
            // It defines the shape of every log entry.
            formatters: {
              level: (label: string) => ({ level: label }),
              log: (object: Record<string, unknown>) => {
                // Here we can inject our trace context if available
                // (Requires integration with TracingService, a future step)
                return object;
              },
            },

            // Customize the automatic request logging messages.
            customLogLevel: (req, res, err) => {
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            customSuccessMessage: (req, res) => {
              const responseTime = String(res.getHeader('x-response-time') ?? '');
              return `HTTP ${req.method} ${req.url} ${res.statusCode} - ${responseTime}`;
            },
            customErrorMessage: (req, res, err: Error) => {
              return `HTTP ${req.method} ${req.url} ${res.statusCode} ERROR - ${err.message}`;
            },

            // Automatically add a unique request ID to every log entry for correlation.
            genReqId: (req: IncomingMessage & { id?: string }, res: ServerResponse): string => {
              // Safely read an existing ID from request object or headers
              const existingId = req.id ?? (req.headers['x-request-id'] as string | undefined);
              if (existingId) {
                return existingId;
              }

              // Generate a new UUID if none exists
              const id = randomUUID();
              res.setHeader('x-request-id', id);
              return id;
            },

            // Redact sensitive information from logs automatically.
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers["x-api-key"]',
                '*.password',
                '*.token',
              ],
              censor: '***REDACTED***',
            },
          },
        };
      },
    }),
  ],
  // We don't need to export anything. `nestjs-pino` automatically
  // replaces the default NestJS logger.
})
export class LoggerModule {}
