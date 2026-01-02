// src/account.module.ts
import { Module } from '@nestjs/common';

import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { MessagingModule } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    // 1. Layer Modules
    DomainModule,
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,

    // 2. Shared/Global Modules
    SharedAuthModule,
    NotificationModule,

    // 3. Event Bus Configuration
    // FIX: Register without config.
    // This creates a standard ClientProxy for PUBLISHING events.
    // It will use default settings (auto-ack for replies), fixing the 406 error.
    MessagingModule.register(),

    // 4. Monitoring
    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '1.0.0',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AccountModule {}
