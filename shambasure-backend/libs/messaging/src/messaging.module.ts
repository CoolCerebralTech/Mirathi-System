import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@shamba/config';
import { MessagingService } from './messaging.service';
import { Exchange } from './interfaces/messaging.interface';

// ============================================================================
// Shamba Sure - Shared Messaging Module
// ============================================================================
// This module provides a standardized way for our microservices to connect
// to RabbitMQ and publish events. It uses a dynamic `register()` method
// to allow each consuming service to specify its own unique queue.
// ============================================================================

@Module({})
export class MessagingModule {
  /**
   * Configures the MessagingModule for a specific service.
   * This is the entry point for using the messaging system.
   *
   * @param config An object containing the queue name for the service.
   */
  static register(config: { queue?: string }): DynamicModule {
    // This provider is responsible for creating and configuring the NestJS
    // RabbitMQ client (ClientProxy). It injects the ConfigService to get
    // the RabbitMQ URI from our environment variables.
    const rabbitMqClientProvider: Provider = {
      provide: 'RABBITMQ_CLIENT',
      useFactory: (configService: ConfigService) => {
        // CORRECTED: The 'transport' property now goes INSIDE the 'options' object.
        return ClientProxyFactory.create({
          options: {
            transport: Transport.RMQ, // <-- MOVED THIS LINE
            urls: [configService.get('RABBITMQ_URI')],
            exchange: Exchange.SHAMBA_EVENTS,
            exchangeType: 'topic',
            // The queue name provided by the specific microservice
            queue: config.queue,
            persistent: true, // Ensures messages survive a broker restart
            queueOptions: {
              durable: true, // The queue itself will survive a broker restart
              // This is the CRITICAL part for resilience. If a message
              // processing fails, it will be sent to a dead-letter exchange.
              deadLetterExchange: 'shamba.events.dead',
              // The failed message will be routed in the DLX with its original
              // queue name, making it easy to inspect.
              deadLetterRoutingKey: config.queue,
            },
            // Ensure messages are not acknowledged automatically.
            // The framework will handle ACK/NACK based on whether the
            // @EventPattern handler throws an error.
            noAck: false,
          },
        });
      },
      inject: [ConfigService],
    };

    return {
      // This makes the module dynamic
      module: MessagingModule,
      // Provide the MessagingService itself and our configured client
      providers: [MessagingService, rabbitMqClientProvider],
      // Export ONLY the MessagingService. The client is an internal detail.
      exports: [MessagingService],
    };
  }
}
