// src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';

import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';

import { EVENT_PUBLISHER_PORT } from '../domain/ports/event-publisher.port';
import { OAUTH_FACTORY_PORT } from '../domain/ports/oauth-factory.port';
// Ports
import { USER_REPOSITORY_PORT } from '../domain/ports/user.repository.port';
import { DomainEventMapper } from './adapters/messaging/domain-event.mapper';
import { MessagingEventPublisherAdapter } from './adapters/messaging/messaging-event-publisher.adapter';
import { AppleOAuthAdapter } from './adapters/oauth/apple.adapter';
import { GoogleOAuthAdapter } from './adapters/oauth/google.adapter';
import { OAuthAdapterFactory } from './adapters/oauth/oauth-adapter.factory';
import { UserMapper } from './persistence/mappers/user.mapper';
// Adapters & Mappers
import { PrismaUserRepository } from './persistence/repositories/prisma-user.repository';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule, // Provides PrismaService
    MessagingModule, // Provides IEventPublisher
  ],
  providers: [
    // --- Mappers ---
    UserMapper,
    DomainEventMapper,

    // --- OAuth Implementation ---
    GoogleOAuthAdapter,
    AppleOAuthAdapter,
    OAuthAdapterFactory,
    // Bind Factory Port to Implementation
    {
      provide: OAUTH_FACTORY_PORT,
      useExisting: OAuthAdapterFactory,
    },

    // --- Repository Implementation ---
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepository,
    },

    // --- Event Publisher Implementation ---
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: MessagingEventPublisherAdapter,
    },
  ],
  exports: [
    // Export symbols (Interfaces) so Application layer can inject them
    USER_REPOSITORY_PORT,
    EVENT_PUBLISHER_PORT,
    OAUTH_FACTORY_PORT,

    // Export Concrete classes if strictly needed by specific modules
    UserMapper,
    DomainEventMapper,
  ],
})
export class InfrastructureModule {}
