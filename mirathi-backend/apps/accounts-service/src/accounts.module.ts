// src/account.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule as SharedAuthModule } from '@shamba/auth';
// --- SHARED LIBRARY IMPORTS ---
import { DatabaseModule } from '@shamba/database';
import { MessagingModule, Queue } from '@shamba/messaging';
import { NotificationModule } from '@shamba/notification';
import { ObservabilityModule } from '@shamba/observability';

import { EVENT_PUBLISHER_PORT } from './domain/ports/event-publisher.port';
// Repositories
import { USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { DomainEventMapper } from './infrastructure/adapters/messaging/domain-event.mapper';
import { MessagingEventPublisherAdapter } from './infrastructure/adapters/messaging/messaging-event-publisher.adapter';
import { AppleOAuthAdapter } from './infrastructure/adapters/oauth/apple.adapter';
import { GoogleOAuthAdapter } from './infrastructure/adapters/oauth/google.adapter';
// Adapters & Mappers
import { OAuthAdapterFactory } from './infrastructure/adapters/oauth/oauth-adapter.factory';
import { UserMapper } from './infrastructure/persistence/mappers/user.mapper';
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository';

// Controllers
// import { AuthController } from './presentation/controllers/auth.controller';
// (Uncomment when you share controllers)

@Module({
  imports: [
    // Nest.js Core Modules
    CqrsModule,
    // Shared Library Modules
    DatabaseModule, // Provides PrismaService and database connectivity
    SharedAuthModule, // Shared authentication utilities, guards, strategies
    // Register Messaging Module
    // We subscribe to ACCOUNTS_EVENTS queue to handle our own chores or saga replies
    MessagingModule.register({
      queue: Queue.ACCOUNTS_EVENTS,
    }),
    ObservabilityModule.register({ serviceName: 'accounts-service', version: '1.0.0' }), // Logging, metrics, tracing, monitoring
    NotificationModule,
  ],
  controllers: [
    // AuthController,
    // UserController
  ],
  providers: [
    // --- Infrastructure: Mappers ---
    UserMapper,
    DomainEventMapper, // <--- Registered here

    // --- Infrastructure: OAuth ---
    GoogleOAuthAdapter,
    AppleOAuthAdapter,
    OAuthAdapterFactory,

    // --- Infrastructure: Repositories ---
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepository,
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: MessagingEventPublisherAdapter,
    },

    // --- Application Services ---
    // (We will register these next when you share the service files)
  ],
  exports: [
    USER_REPOSITORY_PORT,
    OAuthAdapterFactory,
    // Exporting mapper in case other modules need to map account events manually
    DomainEventMapper,
  ],
})
export class AccountModule {}
