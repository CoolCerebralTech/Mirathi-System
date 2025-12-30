import { ShambaEvents } from '../events/shamba-events.enum';

/**
 * Defines the names for the primary RabbitMQ exchanges.
 * All Shamba Sure events flow through a single topic exchange for flexible routing.
 */
export enum Exchange {
  SHAMBA_EVENTS = 'shamba.events.topic',
  SHAMBA_EVENTS_DEAD_LETTER = 'shamba.events.dead.letter',
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
 * Defines the names of dead letter queues for each service.
 * Failed messages that cannot be processed are routed here for investigation.
 */
export enum DeadLetterQueue {
  ACCOUNTS_DLQ = 'accounts.events.dlq',
  DOCUMENTS_DLQ = 'documents.events.dlq',
  SUCCESSION_DLQ = 'succession.events.dlq',
  NOTIFICATIONS_DLQ = 'notifications.events.dlq',
  AUDITING_DLQ = 'auditing.events.dlq',
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

  // Notifications service events
  NOTIFICATIONS_ALL = 'notifications.#',

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
   * MUST use values from ShambaEvents enum for type safety.
   */
  eventType: ShambaEvents;

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
   * The ID of the user who initiated the action, if applicable.
   * Used for auditing and authorization context.
   */
  userId?: string;

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
    /** The ID of the tenant/organization, if multi-tenant. */
    tenantId?: string;
    /** The source IP address of the request that triggered the event. */
    sourceIp?: string;
    /** User agent or client information. */
    userAgent?: string;
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

  /**
   * The dead letter queue for this service.
   * Required if the service consumes events.
   */
  deadLetterQueue?: DeadLetterQueue;

  /**
   * Prefetch count for message processing (quality of service).
   * Default: 10 messages at a time per consumer.
   */
  prefetchCount?: number;

  /**
   * Maximum retry attempts for failed messages before sending to DLQ.
   * Default: 3 attempts.
   */
  maxRetryAttempts?: number;
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

  /** Number of messages published since startup. */
  messagesPublished: number;

  /** Number of messages consumed since startup. */
  messagesConsumed: number;

  /** Number of failed messages (sent to DLQ). */
  messagesFailed: number;
}

/**
 * Represents a message that has failed processing and is being sent to DLQ.
 */
export interface FailedMessage {
  /** The original event that failed. */
  event: BaseEvent;
  /** The error that caused the failure. */
  error: string;
  /** The stack trace of the error. */
  stackTrace?: string;
  /** Number of times the message was retried. */
  retryCount: number;
  /** Timestamp when the failure occurred. */
  failedAt: string;
  /** The service that encountered the failure. */
  failingService: string;
}

/**
 * Configuration for message retry behavior.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. */
  maxAttempts: number;
  /** Initial delay in milliseconds for the first retry. */
  initialDelayMs: number;
  /** Multiplier for exponential backoff. */
  backoffMultiplier: number;
  /** Maximum delay between retries in milliseconds. */
  maxDelayMs: number;
}
