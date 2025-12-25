import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { createProxyMiddleware } from 'http-proxy-middleware';

// --- Shared Libraries ---
import { AuthModule, JwtAuthGuard } from '@shamba/auth';
import { ConfigModule, ConfigService } from '@shamba/config';
import { MessagingModule } from '@shamba/messaging';
import { ObservabilityModule } from '@shamba/observability';

import { AllExceptionsFilter } from './presentation/filters/all-exceptions.filter';
import { GatewayHealthModule } from './presentation/health/gateway-health.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    ObservabilityModule.register({ serviceName: 'api-gateway', version: '1.0.0' }),
    MessagingModule.register({}),
    GatewayHealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // ✅ Define microservice proxy configs
    const services = [
      {
        path: 'accounts',
        url: this.configService.get('ACCOUNTS_SERVICE_URL'),
        configKey: 'ACCOUNTS_SERVICE_URL',
      },
      {
        path: 'documents',
        url: this.configService.get('DOCUMENTS_SERVICE_URL'),
        configKey: 'DOCUMENTS_SERVICE_URL',
      },
      {
        path: 'family',
        url: this.configService.get('FAMILY_SERVICE_URL'),
        configKey: 'FAMILY_SERVICE_URL',
      },
      {
        path: 'estate',
        url: this.configService.get('ESTATE_SERVICE_URL'),
        configKey: 'ESTATE_SERVICE_URL',
      },
      {
        path: 'succession-automation',
        url: this.configService.get('SUCCESSION_AUTOMATION_SERVICE_URL'),
        configKey: 'SUCCESSION_AUTOMATION_SERVICE_URL',
      },
      {
        path: 'notifications',
        url: this.configService.get('NOTIFICATIONS_SERVICE_URL'),
        configKey: 'NOTIFICATIONS_SERVICE_URL',
      },
      {
        path: 'auditing',
        url: this.configService.get('AUDITING_SERVICE_URL'),
        configKey: 'AUDITING_SERVICE_URL',
      },
    ];

    // ✅ Loop through services and register proxy middleware
    services.forEach(({ path, url }) => {
      if (!url) {
        console.warn(`⚠️  ${path.toUpperCase()}_SERVICE_URL not configured, skipping proxy`);
        return;
      }

      consumer
        .apply(
          createProxyMiddleware({
            target: url,
            changeOrigin: true,
            // ✅ Strip the /api/{service} prefix before forwarding
            pathRewrite: { [`^/api/${path}`]: '' },
            ws: true, // Enable WebSocket proxying
            logger: console,
          }),
        )
        .forRoutes({ path: `${path}/*path`, method: RequestMethod.ALL });
    });
  }
}
