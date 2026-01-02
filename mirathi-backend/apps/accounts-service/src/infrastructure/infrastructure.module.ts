// src/infrastructure/infrastructure.module.ts
import { Module } from '@nestjs/common';

import { ConfigModule } from '@shamba/config';
import { DatabaseModule } from '@shamba/database';
import { MessagingModule } from '@shamba/messaging';

import { EVENT_PUBLISHER_PORT } from '../domain/ports/event-publisher.port';
import { USER_REPOSITORY_PORT } from '../domain/ports/user.repository.port';
import { DomainEventMapper } from './adapters/messaging/domain-event.mapper';
import { MessagingEventPublisherAdapter } from './adapters/messaging/messaging-event-publisher.adapter';
import { PrismaUserRepository } from './persistence/repositories/prisma-user.repository';

/**
 * Infrastructure Module
 *
 * This module provides concrete implementations of domain ports:
 * - UserRepositoryPort → PrismaUserRepository
 * - EventPublisherPort → MessagingEventPublisherAdapter
 * - OAuthProviderPort → GoogleAdapter, AppleAdapter (TODO)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MessagingModule.register(), // No queue - only publishing
  ],
  providers: [
    // ========================================================================
    // REPOSITORY IMPLEMENTATIONS
    // ========================================================================
    {
      provide: USER_REPOSITORY_PORT,
      useClass: PrismaUserRepository,
    },

    // ========================================================================
    // EVENT PUBLISHING
    // ========================================================================
    DomainEventMapper,
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: MessagingEventPublisherAdapter,
    },

    // ========================================================================
    // OAUTH ADAPTERS (TODO)
    // ========================================================================
    // GoogleAdapter,
    // AppleAdapter,
    // OAuthAdapterFactory,
    // {
    //   provide: OAUTH_PROVIDER_PORT,
    //   useFactory: (factory: OAuthAdapterFactory, config: ConfigService) => {
    //     // Return appropriate adapter based on runtime config
    //   },
    //   inject: [OAuthAdapterFactory, ConfigService],
    // },
  ],
  exports: [
    USER_REPOSITORY_PORT,
    EVENT_PUBLISHER_PORT,
    // OAUTH_PROVIDER_PORT,
  ],
})
export class InfrastructureModule {}
