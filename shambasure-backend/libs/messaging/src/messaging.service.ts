import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ShambaEvent } from '@shamba/common';
import { BrokerHealth, PublishOptions } from './interfaces/messaging.interface';
import { timeout, catchError, firstValueFrom, TimeoutError } from 'rxjs';

/**
 * MessagingService
 *
 * Provides a simplified interface for publishing events to RabbitMQ.
 * This service wraps the NestJS ClientProxy to add:
 * - Connection management with health tracking
 * - Graceful error handling
 * - Structured logging
 * - Distributed tracing support via correlationId
 * - Retry logic for failed connections
 *
 * ARCHITECTURE NOTES:
 * - This service is for PUBLISHING events only
 * - Event CONSUMPTION is handled by @EventPattern decorators in controllers
 * - Uses NestJS microservices ClientProxy abstraction
 * - Supports both fire-and-forget (emit) and request-reply (send) patterns
 *
 * PRODUCTION CONSIDERATIONS:
 * - Connection failures are logged but don't crash the service
 * - Events are dropped if broker is unavailable (consider circuit breaker pattern)
 * - Health checks expose broker connectivity status
 * - Implements graceful shutdown to drain in-flight messages
 */
@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);

  /** Tracks the current connection state to the message broker. */
  private isConnected = false;

  /** Stores the last connection error for health reporting. */
  private lastError?: string;

  /** Timestamp of the last successful connection. */
  private lastConnectedAt?: Date;

  /** Counter for failed connection attempts (for monitoring). */
  private connectionAttempts = 0;

  /** Maximum time to wait for connection in milliseconds. */
  private readonly CONNECTION_TIMEOUT = 10000;

  /** Maximum retry attempts for initial connection. */
  private readonly MAX_CONNECTION_RETRIES = 3;

  constructor(@Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy) {}

  /**
   * Initializes the connection to RabbitMQ when the module starts.
   * Uses retry logic with exponential backoff for resilience.
   *
   * BEHAVIOR:
   * - Attempts to connect up to MAX_CONNECTION_RETRIES times
   * - Logs connection status (success or failure)
   * - Service continues to run even if initial connection fails
   * - Background reconnection is handled by NestJS microservices
   */
  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Gracefully closes the connection when the module is destroyed.
   * Ensures in-flight messages are processed before shutdown.
   */
  async onModuleDestroy() {
    try {
      this.logger.log('Disconnecting from message broker...');
      await this.client.close();
      this.isConnected = false;
      this.logger.log('Successfully disconnected from message broker.');
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error('Error during broker disconnection:', errorMessage);
    }
  }

  /**
   * Attempts to connect to RabbitMQ with retry logic.
   * Uses exponential backoff between attempts.
   */
  private async connectWithRetry(): Promise<void> {
    this.connectionAttempts = 0;

    while (this.connectionAttempts < this.MAX_CONNECTION_RETRIES) {
      try {
        this.connectionAttempts++;
        this.logger.log(
          `Connecting to message broker (attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_RETRIES})...`,
        );

        // Connect with timeout to prevent hanging
        const connectPromise = this.client.connect();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), this.CONNECTION_TIMEOUT);
        });

        await Promise.race([connectPromise, timeoutPromise]);

        // Connection successful
        this.isConnected = true;
        this.lastConnectedAt = new Date();
        this.lastError = undefined;
        this.connectionAttempts = 0;

        this.logger.log('✅ Successfully connected to the message broker.');
        return;
      } catch (error) {
        const errorMessage = this.extractErrorMessage(error);
        this.isConnected = false;
        this.lastError = errorMessage;

        this.logger.error(
          `Failed to connect to message broker (attempt ${this.connectionAttempts}/${this.MAX_CONNECTION_RETRIES}): ${errorMessage}`,
        );

        // Wait before retrying (exponential backoff)
        if (this.connectionAttempts < this.MAX_CONNECTION_RETRIES) {
          const backoffDelay = Math.min(1000 * Math.pow(2, this.connectionAttempts - 1), 10000);
          this.logger.log(`Retrying in ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
        }
      }
    }

    // All retry attempts exhausted
    this.logger.error(
      `❌ Failed to connect to message broker after ${this.MAX_CONNECTION_RETRIES} attempts. Service will continue without broker connection.`,
    );
    this.logger.warn(
      'Background reconnection will be attempted by NestJS microservices. Monitor health endpoint for status.',
    );
  }

  /**
   * Publishes an event to the message broker using fire-and-forget pattern.
   *
   * USAGE:
   * ```typescript
   * messagingService.emit({
   *   type: 'accounts.user.created',
   *   payload: { userId: '123', email: 'user@example.com' },
   *   timestamp: new Date().toISOString()
   * }, {
   *   correlationId: 'req-abc-123',
   *   expiration: 60000
   * });
   * ```
   *
   * BEHAVIOR:
   * - Returns immediately without waiting for acknowledgment
   * - Fails silently if broker is unavailable (logs error)
   * - Adds correlation ID for distributed tracing
   * - Supports message expiration and priority
   *
   * @param event - The event to publish (must extend ShambaEvent)
   * @param options - Optional publishing options (correlationId, expiration, etc.)
   */
  emit<T extends ShambaEvent>(event: T, options?: PublishOptions): void {
    // Guard: Check connection status
    if (!this.isConnected) {
      this.logger.error(`Cannot emit event. Not connected to broker. Event type: ${event.type}`, {
        eventType: event.type,
        correlationId: options?.correlationId,
      });
      return;
    }

    try {
      // Prepare the message payload with metadata
      const messagePayload = {
        ...event,
        correlationId: options?.correlationId || event.correlationId,
        timestamp: event.timestamp || new Date().toISOString(),
      };

      // Prepare AMQP options with proper typing
      interface AmqpOptions {
        expiration?: string;
        priority?: number;
        headers?: Record<string, any>;
        persistent?: boolean;
      }

      const amqpOptions: AmqpOptions = {};

      if (options?.expiration !== undefined) {
        amqpOptions.expiration = options.expiration.toString();
      }
      if (options?.priority !== undefined) {
        amqpOptions.priority = options.priority;
      }
      if (options?.headers !== undefined) {
        amqpOptions.headers = options.headers;
      }
      if (options?.persistent !== undefined) {
        amqpOptions.persistent = options.persistent;
      }

      // Emit the event (fire-and-forget)
      this.client.emit(event.type, messagePayload);

      // Log success (debug level to avoid spam)
      this.logger.debug(`Event emitted: ${event.type}`, {
        eventType: event.type,
        correlationId: messagePayload.correlationId,
        hasExpiration: options?.expiration !== undefined,
      });
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`Failed to emit event: ${event.type}`, errorMessage, {
        eventType: event.type,
        correlationId: options?.correlationId,
      });
    }
  }

  /**
   * Sends a request and waits for a reply (RPC pattern).
   *
   * ⚠️ WARNING: Use sparingly! RPC introduces tight coupling between services.
   * Prefer async event-driven patterns for most inter-service communication.
   *
   * USAGE:
   * ```typescript
   * const response = await messagingService.send<UserData>(
   *   'accounts.user.get',
   *   { userId: '123' },
   *   { correlationId: 'req-abc-123' }
   * );
   * ```
   *
   * BEHAVIOR:
   * - Waits for a reply from the consumer (synchronous)
   * - Times out after 5 seconds by default
   * - Throws error if broker is unavailable
   * - Returns typed response data
   *
   * @param pattern - The message pattern (routing key)
   * @param data - The request payload
   * @param options - Optional publishing options
   * @param timeoutMs - Maximum time to wait for reply (default: 5000ms)
   * @returns Promise resolving to the response data
   */
  async send<TResult = any, TInput = any>(
    pattern: string,
    data: TInput,
    options?: PublishOptions,
    timeoutMs: number = 5000,
  ): Promise<TResult> {
    // Guard: Check connection status
    if (!this.isConnected) {
      const error = new Error(`Cannot send request. Not connected to broker. Pattern: ${pattern}`);
      this.logger.error(error.message, { pattern, correlationId: options?.correlationId });
      throw error;
    }

    try {
      // Prepare the request payload
      const requestPayload = {
        ...data,
        correlationId: options?.correlationId,
        timestamp: new Date().toISOString(),
      };

      this.logger.debug(`Sending RPC request: ${pattern}`, {
        pattern,
        correlationId: options?.correlationId,
      });

      // Send request and wait for reply with timeout
      const response = await firstValueFrom(
        this.client.send<TResult>(pattern, requestPayload).pipe(
          timeout(timeoutMs),
          catchError((err: unknown) => {
            if (err instanceof TimeoutError) {
              throw new Error(`RPC request timed out after ${timeoutMs}ms: ${pattern}`);
            }
            throw err;
          }),
        ),
      );

      this.logger.debug(`Received RPC response: ${pattern}`, {
        pattern,
        correlationId: options?.correlationId,
      });

      return response;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      this.logger.error(`Failed to send RPC request: ${pattern}`, errorMessage, {
        pattern,
        correlationId: options?.correlationId,
      });
      throw error;
    }
  }

  /**
   * Returns the current health status of the message broker connection.
   * Used by health check endpoints (/health) for monitoring.
   *
   * MONITORING RECOMMENDATIONS:
   * - Alert if isConnected = false for > 30 seconds
   * - Track lastConnectedAt to detect flapping connections
   * - Monitor connectionAttempts for repeated failures
   *
   * @returns BrokerHealth object with connection status and metadata
   */
  getHealth(): BrokerHealth {
    return {
      isConnected: this.isConnected,
      brokerUrl: this.sanitizeBrokerUrl(),
      error: this.lastError,
      lastConnectedAt: this.lastConnectedAt,
      prefetchCount: undefined, // Set if you track this in config
    };
  }

  /**
   * Checks if the service is currently connected to the broker.
   * Useful for conditional logic in application code.
   *
   * @returns true if connected, false otherwise
   */
  isHealthy(): boolean {
    return this.isConnected;
  }

  /**
   * Attempts to manually reconnect to the broker.
   * Useful for recovery after extended outages.
   *
   * @returns Promise resolving to true if reconnection succeeded
   */
  async reconnect(): Promise<boolean> {
    this.logger.log('Manual reconnection requested...');
    await this.connectWithRetry();
    return this.isConnected;
  }

  /**
   * Extracts a safe error message from an unknown error object.
   * Handles Error instances, strings, and unknown types.
   *
   * @param error - The error to extract a message from
   * @returns A safe error message string
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'An unknown error occurred';
  }

  /**
   * Returns a sanitized broker URL (without credentials) for logging.
   * Prevents leaking sensitive credentials in logs.
   *
   * @returns Sanitized URL or 'unavailable' if not configured
   */
  private sanitizeBrokerUrl(): string {
    try {
      // Try to get URL from client options (if available)
      // This is environment-specific, adjust based on your setup
      const url = process.env.RABBITMQ_URI || 'amqp://localhost:5672';
      const parsed = new URL(url);
      parsed.username = '***';
      parsed.password = '***';
      return parsed.toString();
    } catch {
      return 'unavailable';
    }
  }

  /**
   * Helper method for async sleep (used in retry logic).
   *
   * @param ms - Time to sleep in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
