import { EventPattern } from '@shamba/common';

// ============================================================================
// ARCHITECTURAL NOTE: Leveraging NestJS Microservices
// ============================================================================
// This library provides a simplified interface for interacting with our
// event-driven architecture. We rely heavily on the abstractions provided by
// `@nestjs/microservices` to handle connections, retries, ACKs/NACKs, and
// dead-lettering.
//
// Our interfaces are therefore focused on the *application-level* contracts,
// such as the structure of our event payloads and the required configuration,
// rather than low-level RabbitMQ client options.
// ============================================================================

/**
 * Defines the names for our primary RabbitMQ exchanges.
 * Using an enum prevents typos in configuration and code.
 */
export enum Exchange {
  SHAMBA_EVENTS = 'shamba.events.topic',
}

/**
 * Defines the names of the queues used by our services.
 * Following a `service-name.events` convention is recommended.
 */
export enum Queue {
  ACCOUNTS_EVENTS = 'accounts.events',
  DOCUMENTS_EVENTS = 'documents.events',
  SUCCESSION_EVENTS = 'succession.events',
  NOTIFICATIONS_EVENTS = 'notifications.events',
  AUDITING_EVENTS = 'auditing.events',
}

/**
 * Defines the required configuration for the RabbitMQ client in our services.
 * This aligns with the options expected by `@nestjs/microservices`.
 */
export interface RabbitMQConfig {
  /** The RabbitMQ connection URI. */
  uri: string;
  /** The primary exchange for publishing events. */
  exchange: Exchange;
  /**
   * The name of the queue this service will consume from.
   * This is optional because some services (like the API Gateway)
   * may only publish events and not consume them.
   */
  queue?: Queue;
}

/**
 * Defines the options for publishing an event.
 * This is a simplified set of the most common AMQP options.
 */
export interface PublishOptions {
  /**
   * A unique ID for tracing a request's flow across multiple services.
   * If provided, it will be attached to the event payload.
   */
  correlationId?: string;
  /**
   * A time-to-live for the message, in milliseconds.
   * Example: 60000 for 1 minute.
   */
  expiration?: number;
}

/**
 * A simplified interface representing the health status of the message broker connection.
 */
export interface BrokerHealth {
  /** Indicates if the client is currently connected to RabbitMQ. */
  isConnected: boolean;
  /** The error message if the connection is down. */
  error?: string;
}