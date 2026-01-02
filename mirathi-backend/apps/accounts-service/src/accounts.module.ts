// src/account.module.ts
import { Module } from '@nestjs/common';

// --- Shared Libraries ---
import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

import { ApplicationModule } from './application/application.module';
// --- Layer Modules ---
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

// <--- NEW IMPORT

@Module({
  imports: [
    // 1. Core Layers (The Clean Architecture Stack)
    DomainModule,
    InfrastructureModule,
    ApplicationModule,
    PresentationModule, // <--- Wires up GraphQL Resolvers & Controllers

    // 2. Shared/Global Modules
    SharedAuthModule,
    NotificationModule,

    // 3. Event Bus Consumer Configuration
    // (Listens for events directed at this service)
    MessagingModule.register({
      queue: Queue.ACCOUNTS_EVENTS,
    }),

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
