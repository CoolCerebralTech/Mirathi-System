// ============================================================================
// Shamba Sure - Messaging System Interfaces
// ============================================================================
// This file defines the core contracts and data structures for interacting
// with the event-driven architecture, primarily RabbitMQ. It establishes a
// "shared language" for all microservices.
//
// DESIGN PRINCIPLES:
// - All communication contracts are centralized here.
// - Enums are used to prevent typos and enforce consistency.
// - Interfaces are detailed to support production-ready features like
//   distributed tracing, dead-lettering, and health monitoring.
// ============================================================================

/**
 * Defines the names for the primary RabbitMQ exchanges.
 * All Shamba Sure events flow through a single topic exchange for flexible routing.
 */
export enum Exchange {
  SHAMBA_EVENTS = 'shamba.events.topic',
}

/**
 * Defines the names of the durable queues used by our microservices.
 * Each long-running service that consumes events MUST have its own queue.
 * Convention: `{service-name}.events`
 */
export enum Queue {
  ACCOUNTS_EVENTS = 'accounts.events',
  DOCUMENTS_EVENTS = 'documents.events',
  SUCCESSION_EVENTS = 'succession.events',
  NOTIFICATIONS_EVENTS = 'notifications.events',
  AUDITING_EVENTS = 'auditing.events',
}

/**
 * Defines routing key patterns for event subscriptions.
 * These patterns are used by consumer services to bind their queue to the
 * topic exchange and receive only the events they are interested in.
 *
 * RabbitMQ Topic Pattern Rules:
 * - `*` (star) can substitute for exactly one word.
 * - `#` (hash) can substitute for zero or more words.
 *
 * Example: A consumer binding with `accounts.#` will receive all events
 * whose routing key starts with "accounts.".
 */
export enum RoutingPattern {
  // Account service events
  ACCOUNT_ALL = 'accounts.#',

  // Document service events
  DOCUMENT_ALL = 'documents.#',

  // Succession service events
  SUCCESSION_ALL = 'succession.#',

  // Catch-all pattern, typically used only by the auditing service
  ALL_EVENTS = '#',
}

/**
 * Defines the base structure for all events published within the system.
 * This ensures consistency and provides essential metadata for every event.
 */
export interface BaseEvent<T = any> {
  /**
   * The unique type of the event, which also serves as its routing key.
   * Convention: `{source-service}.{domain-entity}.{action}`
   * Example: 'accounts.user.created'
   */
  eventType: string;

  /**
   * The ISO 8601 timestamp indicating when the event was generated.
   * Example: '2025-10-31T19:22:30.123Z'
   */
  timestamp: string;

  /**
   * A unique identifier used to trace a single request's flow across
   * multiple microservices. This MUST be propagated from the initial
   * API Gateway request to all subsequent events.
   */
  correlationId: string;

  /**
   * The event-specific data payload. The structure of this object
   * varies based on the `eventType`.
   */
  payload: T;

  /**
   * Optional metadata about the event's origin and context.
   */
  metadata?: {
    /** The name of the service that published the event (e.g., 'accounts-service'). */
    service: string;
    /** The version of the service that published the event. */
    version?: string;
    /** The ID of the user who initiated the action, if applicable. */
    userId?: string;
  };
}

/**
 * Defines the required configuration for the RabbitMQ client.
 * This is used by the `MessagingModule` to establish a connection.
 */
export interface RabbitMQConfig {
  /**
   * The RabbitMQ connection URI, including credentials.
   * Format: amqp://username:password@host:port/vhost
   * THIS MUST BE PROVIDED VIA ENVIRONMENT VARIABLES.
   */
  uri: string;

  /** The primary exchange for publishing all events. */
  exchange: Exchange;

  /**
   * The name of the queue this specific service will consume from.
   * This is optional, as some services (like an API Gateway) may only publish
   * events and do not need their own queue.
   */
  queue?: Queue;
}

/**
 * A simplified interface representing the health status of the message broker connection.
 * Used by the service's health check endpoint (`/health`) for monitoring.
 */
export interface BrokerHealth {
  /** The sanitized broker URL (credentials removed). */
  brokerUrl: string;

  /** Indicates if the client is currently connected to RabbitMQ. */
  isConnected: boolean;

  /** The error message if the connection is currently down. */
  error?: string;

  /** Timestamp of the last successful connection. */
  lastConnectedAt?: Date;
}
