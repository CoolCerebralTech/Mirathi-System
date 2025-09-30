import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@shamba/config';
import { AuthModule } from '@shamba/auth';
import { ObservabilityModule } from '@shamba/observability';

import { GlobalExceptionFilter } from '@shamba/common';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './health/health.service';
import { AccountsProxyController } from './proxy/accounts.proxy.controller';
import { DocumentsProxyController } from './proxy/documents.proxy.controller';
import { SuccessionProxyController } from './proxy/succession.proxy.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    HttpModule.register({ timeout: 30000 }), // Configure the HTTP client
    ObservabilityModule.register({
      serviceName: 'api-gateway',
      version: '1.0.0',
    }),
  ],
  controllers: [
    HealthController,
    AccountsProxyController,
    DocumentsProxyController,
    SuccessionProxyController,
  ],
  providers: [
    HealthService,
    // Provide the GlobalExceptionFilter so it can be used in main.ts
    {
      provide: 'APP_FILTER',
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class GatewayModule {}