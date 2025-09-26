import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@shamba/config';
import { AuthModule } from '@shamba/auth';
import { ObservabilityModule } from '@shamba/observability';
import { GatewayController } from './controllers/gateway.controller';
import { HealthController } from './controllers/health.controller';
import { ProxyService } from './services/proxy.service';
import { ServiceRegistryService } from './services/service-registry.service';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { SecurityMiddleware } from './middleware/security.middleware';
import { GatewayExceptionFilter } from './filters/gateway-exception.filter';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { GatewayAuthGuard } from './guards/gateway-auth.guard';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ObservabilityModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 1000, // 1 second
          limit: 10,
        },
        {
          name: 'medium',
          ttl: 10000, // 10 seconds
          limit: 50,
        },
        {
          name: 'long',
          ttl: 60000, // 1 minute
          limit: 1000,
        },
      ],
    }),
  ],
  controllers: [GatewayController, HealthController],
  providers: [
    ProxyService,
    ServiceRegistryService,
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GatewayExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class ApiGatewayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*')
      .apply(RequestLoggerMiddleware)
      .forRoutes('*');
  }
}