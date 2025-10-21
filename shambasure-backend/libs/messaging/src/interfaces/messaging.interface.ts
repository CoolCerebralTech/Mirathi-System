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
//
// DESIGN PRINCIPLES:
// - Type safety over runtime checks
// - Explicit contracts for cross-service communication
// - Configuration validation at startup
// - Support for distributed tracing via correlationId
// ============================================================================

/**
 * Defines the names for our primary RabbitMQ exchanges.
 * Using an enum prevents typos in configuration and code.
 *
 * EXCHANGE TYPES:
 * - Topic exchanges allow flexible routing patterns using wildcards
 * - Pattern: service.events.action (e.g., accounts.events.created)
 */
export enum Exchange {
  SHAMBA_EVENTS = 'shamba.events.topic',
}

/**
 * Defines the names of the queues used by our services.
 * Following a `service-name.events` convention is recommended.
 *
 * QUEUE NAMING CONVENTION:
 * - Format: {service}.events
 * - Each service should have its own dedicated queue
 * - Queues are durable by default (survive broker restarts)
 */
export enum Queue {
  ACCOUNTS_EVENTS = 'accounts.events',
  DOCUMENTS_EVENTS = 'documents.events',
  SUCCESSION_EVENTS = 'succession.events',
  NOTIFICATIONS_EVENTS = 'notifications.events',
  AUDITING_EVENTS = 'auditing.events',
}

/**
 * Defines routing patterns for event subscriptions.
 * Uses RabbitMQ topic exchange pattern matching.
 *
 * PATTERN RULES:
 * - * matches exactly one word
 * - # matches zero or more words
 * - Words are separated by dots
 *
 * Examples:
 * - 'accounts.*.created' matches 'accounts.user.created'
 * - 'accounts.#' matches all account events
 */
export enum RoutingPattern {
  // Account events
  ACCOUNT_ALL = 'accounts.#',
  ACCOUNT_CREATED = 'accounts.*.created',
  ACCOUNT_UPDATED = 'accounts.*.updated',
  ACCOUNT_DELETED = 'accounts.*.deleted',

  // Document events
  DOCUMENT_ALL = 'documents.#',
  DOCUMENT_UPLOADED = 'documents.*.uploaded',
  DOCUMENT_VERIFIED = 'documents.*.verified',

  // Succession events
  SUCCESSION_ALL = 'succession.#',
  SUCCESSION_CREATED = 'succession.*.created',
  SUCCESSION_APPROVED = 'succession.*.approved',

  // Catch-all for auditing
  ALL_EVENTS = '#',
}

/**
 * Defines the required configuration for the RabbitMQ client in our services.
 * This aligns with the options expected by `@nestjs/microservices`.
 *
 * PRODUCTION REQUIREMENTS:
 * - Use connection pooling for high throughput
 * - Enable automatic reconnection with exponential backoff
 * - Set appropriate prefetch count to prevent message hoarding
 */
export interface RabbitMQConfig {
  /**
   * The RabbitMQ connection URI.
   * Format: amqp://username:password@host:port/vhost
   * Example: amqp://admin:secret@rabbitmq:5672/shamba
   */
  uri: string;

  /** The primary exchange for publishing events. */
  exchange: Exchange;

  /**
   * The name of the queue this service will consume from.
   * This is optional because some services (like the API Gateway)
   * may only publish events and not consume them.
   */
  queue?: Queue;

  /**
   * Prefetch count: number of unacknowledged messages a consumer can have.
   * Recommended: 10-50 for balanced throughput and fairness.
   * Lower values = better load distribution, higher values = better throughput.
   */
  prefetchCount?: number;

  /**
   * Enable persistent delivery mode for critical messages.
   * When true, messages survive broker restarts.
   * Default: true for production.
   */
  persistent?: boolean;

  /**
   * Heartbeat interval in seconds to detect broken connections.
   * Recommended: 30-60 seconds.
   */
  heartbeatInterval?: number;

  /**
   * Socket timeout in milliseconds.
   * Recommended: 10000 (10 seconds) for production.
   */
  socketTimeout?: number;
}

/**
 * Defines the options for publishing an event.
 * This is a simplified set of the most common AMQP options.
 *
 * BEST PRACTICES:
 * - Always include correlationId for distributed tracing
 * - Set expiration for time-sensitive events (e.g., OTPs)
 * - Use priority sparingly (0-9, higher = more important)
 */
export interface PublishOptions {
  /**
   * A unique ID for tracing a request's flow across multiple services.
   * If provided, it will be attached to the event payload.
   * Recommended format: UUID v4 or request ID from API Gateway.
   */
  correlationId?: string;

  /**
   * A time-to-live for the message, in milliseconds.
   * After this time, unprocessed messages are moved to dead-letter queue.
   * Example: 60000 for 1 minute, 3600000 for 1 hour.
   */
  expiration?: number;

  /**
   * Message priority (0-9, where 9 is highest).
   * Use sparingly as it can impact performance.
   * Example: 9 for critical alerts, 5 for normal events, 0 for background tasks.
   */
  priority?: number;

  /**
   * Custom message headers for metadata.
   * Useful for passing context without modifying the payload.
   * Example: { userId: '123', tenantId: 'abc' }
   */
  headers?: Record<string, any>;

  /**
   * Delivery mode: 1 (non-persistent) or 2 (persistent).
   * Persistent messages are written to disk and survive broker restarts.
   * Default: 2 (persistent) for production.
   */
  persistent?: boolean;
}

/**
 * A simplified interface representing the health status of the message broker connection.
 * Used by health check endpoints to monitor service connectivity.
 *
 * MONITORING:
 * - Expose this via /health endpoint
 * - Alert on isConnected = false for more than 30 seconds
 * - Log connection errors for debugging
 */
export interface BrokerHealth {
  /** The sanitized broker URL (without credentials). */
  brokerUrl: string;

  /** Indicates if the client is currently connected to RabbitMQ. */
  isConnected: boolean;

  /** The error message if the connection is down. */
  error?: string;

  /** Timestamp of the last successful connection. */
  lastConnectedAt?: Date;

  /** Number of messages in the queue (if available). */
  queueDepth?: number;

  /** Current prefetch count setting. */
  prefetchCount?: number;
}

/**
 * Configuration for retry behavior when message processing fails.
 * Uses exponential backoff to avoid overwhelming the system.
 *
 * RETRY STRATEGY:
 * - Failed messages are requeued with increasing delays
 * - After max attempts, messages move to dead-letter queue
 * - Dead-letter queue should be monitored and manually reviewed
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts before moving to dead-letter queue.
   * Recommended: 3-5 attempts.
   */
  maxAttempts: number;

  /**
   * Initial delay before first retry in milliseconds.
   * Recommended: 1000 (1 second).
   */
  initialDelay: number;

  /**
   * Multiplier for exponential backoff.
   * Example: With multiplier=2, delays are 1s, 2s, 4s, 8s, etc.
   * Recommended: 2.
   */
  backoffMultiplier: number;

  /**
   * Maximum delay between retries in milliseconds.
   * Prevents delays from growing infinitely.
   * Recommended: 60000 (1 minute).
   */
  maxDelay: number;
}

/**
 * Base interface for all events in the system.
 * Ensures consistent structure across all event types.
 *
 * EVENT STRUCTURE:
 * - eventType: Identifies the event (e.g., 'accounts.user.created')
 * - timestamp: When the event occurred (ISO 8601 format)
 * - correlationId: For distributed tracing
 * - payload: Event-specific data
 */
export interface BaseEvent<T = any> {
  /**
   * The type of event (routing key).
   * Format: service.entity.action
   * Example: 'accounts.user.created'
   */
  eventType: string;

  /**
   * When the event was created (ISO 8601 format).
   * Example: '2025-10-20T19:22:30.123Z'
   */
  timestamp: string;

  /**
   * Unique identifier for tracing this event across services.
   * Should be propagated from the original request.
   */
  correlationId: string;

  /**
   * The event-specific data.
   * Type varies based on eventType.
   */
  payload: T;

  /**
   * Metadata about the event source.
   * Example: { service: 'accounts-service', version: '1.0.0' }
   */
  metadata?: {
    service: string;
    version?: string;
    userId?: string;
    tenantId?: string;
  };
}

/**
 * Response interface for RPC-style request/reply patterns.
 * Used when a service needs a synchronous response.
 *
 * WARNING: Use sparingly! RPC introduces coupling.
 * Prefer async events for most inter-service communication.
 */
export interface RpcResponse<T = any> {
  /** Indicates if the operation was successful. */
  success: boolean;

  /** The response data if successful. */
  data?: T;

  /** Error message if the operation failed. */
  error?: string;

  /** Original correlationId for tracing. */
  correlationId: string;

  /** Processing time in milliseconds. */
  processingTime?: number;
}
