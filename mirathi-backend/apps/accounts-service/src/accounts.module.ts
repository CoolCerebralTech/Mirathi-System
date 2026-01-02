// src/account.module.ts
import { Module } from '@nestjs/common';

import { AuthModule as SharedAuthModule } from '@shamba/auth';
import { MessagingModule, Queue } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

import { ApplicationModule } from './application/application.module';
import { DomainModule } from './domain/domain.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

// import { AuthController } from './presentation/controllers/auth.controller';
// import { UserController } from './presentation/controllers/user.controller';
// import { AdminController } from './presentation/controllers/admin.controller';

@Module({
  imports: [
    // 1. Layer Modules
    DomainModule,
    InfrastructureModule,
    ApplicationModule,

    // 2. Shared/Global Modules
    SharedAuthModule,
    NotificationModule,

    // Register Messaging Listener Configuration (Consumer)
    // The InfrastructureModule imports MessagingModule.register() for Publishing.
    // This register() call establishes the Queue for Consuming events from other services.
    MessagingModule.register({
      queue: Queue.ACCOUNTS_EVENTS,
    }),

    ObservabilityModule.register({
      serviceName: 'accounts-service',
      version: '1.0.0',
    }),
  ],
  controllers: [
    // AuthController,
    // UserController,
    // AdminController
  ],
  providers: [],
})
export class AccountModule {}
