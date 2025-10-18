// libs/messaging/src/messaging.module.ts

import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@shamba/config'; // <-- UPDATED: Import ConfigModule
import { MessagingService } from './messaging.service';
import { Exchange } from './interfaces/messaging.interface';

// ============================================================================
// Shamba Sure - Shared Messaging Module
// ============================================================================
// This module provides a standardized way for our microservices to connect
// to RabbitMQ and publish events. It uses a dynamic `register()` method
// to allow each consuming service to specify its own unique queue.
// ============================================================================

@Global() // <-- ADDED: Make this module Global for simplicity
@Module({})
export class MessagingModule {
  /**
   * Configures the MessagingModule for a specific service.
   * This is the entry point for using the messaging system.
   *
   * @param config An object containing the queue name for the service.
   */
  static register(config: { queue?: string }): DynamicModule {
    const rabbitMqClientProvider: Provider = {
      provide: 'RABBITMQ_CLIENT',
      useFactory: (configService: ConfigService) => {
        // The logic here is already excellent and production-ready.
        // It correctly reads the URI from the ConfigService.
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get('RABBITMQ_URL')],
            exchange: Exchange.SHAMBA_EVENTS,
            exchangeType: 'topic',
            queue: config.queue,
            persistent: true,
            queueOptions: {
              durable: true,
              deadLetterExchange: 'shamba.events.dead',
              deadLetterRoutingKey: config.queue,
            },
            noAck: false,
          },
        });
      },
      inject: [ConfigService],
    };

    return {
      module: MessagingModule,
      // THE FIX: Explicitly import the ConfigModule here.
      // This guarantees that the ConfigModule is loaded and ready
      // BEFORE the 'useFactory' function for our provider is executed.
      imports: [ConfigModule],
      providers: [MessagingService, rabbitMqClientProvider],
      exports: [MessagingService],
    };
  }
}
