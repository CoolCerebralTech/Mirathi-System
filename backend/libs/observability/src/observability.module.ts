import { Module, Global, DynamicModule } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';
import { LoggerService } from './logging/logger.service';
import { MetricsService } from './metrics/metrics.service';
import { HealthService } from './health/health.service';
import { TracingService } from './tracing/tracing.service';
import { RequestLoggerMiddleware } from './logging/request-logger.middleware';
import { ResponseTimeMiddleware } from './middleware/response-time.middleware';

@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(): DynamicModule {
    return {
      module: ObservabilityModule,
      imports: [
        TerminusModule,
        PrometheusModule.register({
          path: '/metrics',
          defaultMetrics: {
            enabled: true,
          },
        }),
        ConfigModule,
        DatabaseModule,
        MessagingModule,
      ],
      providers: [
        LoggerService,
        MetricsService,
        HealthService,
        TracingService,
        RequestLoggerMiddleware,
        ResponseTimeMiddleware,
      ],
      exports: [
        LoggerService,
        MetricsService,
        HealthService,
        TracingService,
      ],
    };
  }
}