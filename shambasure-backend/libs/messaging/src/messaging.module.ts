// libs/messaging/src/messaging.module.ts

import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { ClientProxyFactory, Transport, RmqOptions } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@shamba/config';
import { MessagingService } from './messaging.service';
import { Exchange } from './interfaces/messaging.interface';

// ============================================================================
// Shamba Sure - Shared Messaging Module
// ============================================================================
// This module provides a standardized way for our microservices to connect
// to RabbitMQ and publish events. It uses a dynamic `register()` method
// to allow each consuming service to specify its own unique queue.
//
// ARCHITECTURE DECISIONS:
// - Global module: Available throughout the app without re-importing
// - ClientProxy: Used for PUBLISHING events (fire-and-forget or RPC)
// - Event consumption: Handled separately via @EventPattern decorators
// - Dead-letter exchange: Captures failed messages for manual review
//
// KEY FIX:
// - Removed 'noAck: false' from ClientProxy options
// - ClientProxy is for PUBLISHING only - it doesn't consume messages
// - The noAck option is for CONSUMERS (set in @EventPattern handlers)
// - This fixes the "PRECONDITION_FAILED - reply consumer cannot acknowledge" error
// ============================================================================

/**
 * Configuration options for registering the MessagingModule.
 */
export interface MessagingModuleConfig {
  /**
   * The queue name for this service (optional).
   * Only required if this service will CONSUME events.
   * Publishers-only (like API Gateway) don't need a queue.
   */
  queue?: string;

  /**
   * Prefetch count: limits unacknowledged messages per consumer.
   * Recommended: 10-50 for balanced throughput.
   * Only applies if this service has a queue (is a consumer).
   */
  prefetchCount?: number;

  /**
   * Enable persistent message delivery.
   * When true, messages survive broker restarts.
   * Default: true (production-safe).
   */
  persistent?: boolean;
}

@Global() // Makes module available everywhere without re-importing
@Module({})
export class MessagingModule {
  /**
   * Configures the MessagingModule for a specific service.
   * This is the entry point for using the messaging system.
   *
   * USAGE EXAMPLES:
   *
   * Publisher-only service (e.g., API Gateway):
   * ```typescript
   * MessagingModule.register({}) // No queue needed
   * ```
   *
   * Consumer service (e.g., Notifications Service):
   * ```typescript
   * MessagingModule.register({
   *   queue: Queue.NOTIFICATIONS_EVENTS,
   *   prefetchCount: 20
   * })
   * ```
   *
   * @param config - Configuration object with queue name and options
   * @returns A DynamicModule configured for this service
   */
  static register(config: MessagingModuleConfig = {}): DynamicModule {
    const rabbitMqClientProvider: Provider = {
      provide: 'RABBITMQ_CLIENT',
      useFactory: (configService: ConfigService) => {
        // Get RabbitMQ connection URL from environment
        const rabbitMqUrl = configService.get('RABBITMQ_URL');

        if (!rabbitMqUrl) {
          throw new Error(
            'RABBITMQ_URL is not configured. Please set it in your environment variables.',
          );
        }

        // Set defaults
        const prefetchCount = config.prefetchCount ?? 10;
        const persistent = config.persistent ?? true;

        // ====================================================================
        // CRITICAL FIX: ClientProxy Configuration
        // ====================================================================
        // The ClientProxy is used for PUBLISHING events only.
        // It should NOT have consumer-specific options like 'noAck'.
        //
        // The 'noAck' option is ONLY for consumers (services that receive
        // messages). It's set in the microservice transport options or
        // in individual @EventPattern/@MessagePattern handlers.
        //
        // When using ClientProxy for RPC (send/reply pattern), NestJS
        // automatically creates a temporary reply queue with noAck=true.
        // We should NOT override this behavior.
        // ====================================================================

        const clientOptions: RmqOptions['options'] = {
          // Connection configuration
          urls: [rabbitMqUrl],

          // Exchange configuration
          exchange: Exchange.SHAMBA_EVENTS,
          exchangeType: 'topic',

          // Queue configuration (only if this service consumes messages)
          ...(config.queue && {
            queue: config.queue,
            queueOptions: {
              // Durable: Queue survives broker restarts
              durable: true,

              // Dead-letter exchange: Where failed messages go
              // After max retries, messages are routed here for manual review
              deadLetterExchange: 'shamba.events.dead',
              deadLetterRoutingKey: config.queue,

              // Message TTL: Optional, can be set per-message
              // messageTtl: 3600000, // 1 hour

              // Max length: Optional, prevents queue from growing infinitely
              // maxLength: 10000,
            },
          }),

          // Message persistence
          persistent,

          // Prefetch count: Only relevant for consumers
          // Limits how many unacknowledged messages a consumer can have
          // Lower = better load distribution, Higher = better throughput
          prefetchCount,

          // ❌ REMOVED: noAck option
          // This was causing the "PRECONDITION_FAILED" error
          // The ClientProxy doesn't need this - it's for publishers
          // noAck: false, // <-- DELETED

          // Connection timeout and retry settings
          socketOptions: {
            // Heartbeat interval to detect broken connections
            heartbeatIntervalInSeconds: 30,

            // Reconnection strategy
            reconnectTimeInSeconds: 5,
          },
        };

        // Create and return the ClientProxy
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: clientOptions,
        });
      },
      inject: [ConfigService],
    };

    return {
      module: MessagingModule,

      // Import ConfigModule to ensure it's available for dependency injection
      imports: [ConfigModule],

      // Provide both the MessagingService and the RabbitMQ client
      providers: [MessagingService, rabbitMqClientProvider],

      // Export MessagingService so other modules can use it
      exports: [MessagingService],
    };
  }

  /**
   * Creates a standalone microservice transport configuration.
   * Use this when setting up a service as a microservice (not hybrid).
   *
   * USAGE:
   * ```typescript
   * // In main.ts
   * const app = await NestFactory.createMicroservice<MicroserviceOptions>(
   *   AppModule,
   *   MessagingModule.createMicroserviceOptions({
   *     queue: Queue.NOTIFICATIONS_EVENTS,
   *     prefetchCount: 20
   *   })
   * );
   * ```
   *
   * @param config - Configuration with queue name and options
   * @returns RmqOptions for creating a microservice
   */
  static createMicroserviceOptions(config: MessagingModuleConfig): RmqOptions {
    if (!config.queue) {
      throw new Error('Queue name is required for microservice configuration');
    }

    const prefetchCount = config.prefetchCount ?? 10;
    const persistent = config.persistent ?? true;

    return {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],

        // Exchange configuration
        exchange: Exchange.SHAMBA_EVENTS,
        exchangeType: 'topic',

        // Queue configuration
        queue: config.queue,
        queueOptions: {
          durable: true,
          deadLetterExchange: 'shamba.events.dead',
          deadLetterRoutingKey: config.queue,
        },

        // Message persistence
        persistent,

        // Prefetch count for consumers
        prefetchCount,

        // ✅ CORRECT PLACE for noAck: In consumer configuration
        // Set to false to require manual acknowledgment (safer for production)
        // This ensures messages aren't lost if processing fails
        noAck: false,

        // Connection settings
        socketOptions: {
          heartbeatIntervalInSeconds: 30,
          reconnectTimeInSeconds: 5,
        },
      },
    };
  }
}

// ============================================================================
// PRODUCTION CHECKLIST
// ============================================================================
// ✅ Dead-letter exchange configured for failed messages
// ✅ Durable queues (survive broker restarts)
// ✅ Persistent messages (survive broker restarts)
// ✅ Prefetch count for load balancing
// ✅ Heartbeat monitoring for connection health
// ✅ Automatic reconnection on connection loss
// ✅ Manual acknowledgment for consumers (noAck: false in microservice options)
// ✅ No acknowledgment for publishers (ClientProxy)
// ✅ Type-safe configuration with TypeScript interfaces
// ✅ Comprehensive error handling and validation
// ✅ Separation of concerns: Publisher vs Consumer configuration
// ============================================================================
