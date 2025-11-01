// ============================================================================
// Shamba Sure - Shared Messaging Module
// ============================================================================
// This is a dynamic, global module responsible for providing a standardized
// and resilient connection to RabbitMQ for all microservices in the ecosystem.
//
// KEY RESPONSIBILITIES:
// 1. DYNAMIC REGISTRATION: Uses a `register()` method to allow each consuming
//    service to specify its own unique queue if it's a consumer.
// 2. PROVIDES IEventPublisher: It provides and exports the `IEventPublisher`
//    interface, making the `MessagingService` available for dependency injection
//    throughout the application. THIS IS THE FIX for the dependency error.
// 3. CENTRALIZED CONFIGURATION: It centralizes the logic for creating the
//    RabbitMQ `ClientProxy`, ensuring all services connect in a consistent way.
// ============================================================================

import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { ClientProxyFactory, Transport, RmqOptions } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@shamba/config';
import { MessagingService } from './messaging.service';
import { Exchange, Queue } from './interfaces/messaging.interface';
import { IEventPublisher } from './interfaces/event-publisher.interface';

/**
 * Configuration options for registering the MessagingModule.
 */
export interface MessagingModuleConfig {
  /** The queue that this specific microservice will listen on. */
  queue?: Queue;
}

@Global() // Makes the exported providers available everywhere without re-importing this module.
@Module({})
export class MessagingModule {
  /**
   * Configures the MessagingModule for a specific microservice.
   *
   * @param config Configuration object, typically specifying the service's queue.
   * @returns A DynamicModule configured for the service.
   */
  static register(config: MessagingModuleConfig = {}): DynamicModule {
    // This provider is responsible for creating the low-level RabbitMQ client.
    // It reads the connection URL from the ConfigService.
    const rabbitMqClientProvider: Provider = {
      provide: 'RABBITMQ_CLIENT',
      useFactory: (configService: ConfigService) => {
        const rabbitMqUrl = configService.get('RABBITMQ_URL');
        if (!rabbitMqUrl) {
          throw new Error('RABBITMQ_URL is not configured. Please set it in your .env file.');
        }

        const clientOptions: RmqOptions['options'] = {
          urls: [rabbitMqUrl],
          exchange: Exchange.SHAMBA_EVENTS,
          exchangeType: 'topic',
          // Consumer-specific options are only added if a queue is provided.
          ...(config.queue && {
            queue: config.queue,
            queueOptions: {
              durable: true, // Queue survives broker restarts.
              deadLetterExchange: 'shamba.events.dead', // Where failed messages go.
              deadLetterRoutingKey: config.queue,
            },
            noAck: false, // Requires manual message acknowledgment for safety.
            prefetchCount: 10, // Process up to 10 messages at a time.
          }),
          persistent: true, // Messages survive broker restarts.
          socketOptions: {
            heartbeatIntervalInSeconds: 30,
            reconnectTimeInSeconds: 5,
          },
        };

        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: clientOptions,
        });
      },
      inject: [ConfigService],
    };

    // ============================================================================
    // --- THIS IS THE CRITICAL FIX ---
    // This provider maps the `IEventPublisher` injection token to the concrete
    // `MessagingService` implementation.
    // ============================================================================
    const eventPublisherProvider: Provider = {
      provide: IEventPublisher, // The string token ('IEventPublisher') our services inject.
      useExisting: MessagingService, // When asked for `IEventPublisher`, provide the existing instance of `MessagingService`.
    };

    return {
      module: MessagingModule,
      // We must import ConfigModule so the `useFactory` above can inject ConfigService.
      imports: [ConfigModule],
      providers: [
        MessagingService, // Provides the concrete implementation.
        rabbitMqClientProvider, // Provides the underlying RabbitMQ client.
        eventPublisherProvider, // Provides the alias for IEventPublisher.
      ],
      // We export both so that other modules can inject either the concrete service
      // or the abstract interface.
      exports: [
        MessagingService,
        eventPublisherProvider, // <-- EXPORTING THIS IS WHAT SOLVES THE ERROR.
      ],
    };
  }
}
