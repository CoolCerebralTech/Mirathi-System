import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  BrokerHealth,
  BaseEvent,
  FailedMessage,
  RetryConfig,
} from './interfaces/messaging.interface';
import { IEventPublisher } from './interfaces/event-publisher.interface';
import { timeout, firstValueFrom, from } from 'rxjs';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy, IEventPublisher {
  private readonly logger = new Logger(MessagingService.name);

  /** Tracks the current connection state to the message broker. */
  private isConnected = false;
  /** Stores the last connection error for health reporting. */
  private lastError?: string;
  /** Timestamp of the last successful connection. */
  private lastConnectedAt?: Date;

  // Connection configuration
  private readonly CONNECTION_TIMEOUT = 10000;
  private readonly MAX_CONNECTION_RETRIES = 3;

  // Message counters for health monitoring
  private messagesPublished = 0;
  private messagesConsumed = 0;
  private messagesFailed = 0;

  // Default retry configuration
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 100,
    backoffMultiplier: 2,
    maxDelayMs: 10000,
  };

  constructor(@Inject('RABBITMQ_CLIENT') private readonly client: ClientProxy) {}

  /**
   * Lifecycle hook: called when the module is initialized.
   * Attempts to connect to RabbitMQ with a resilient retry strategy.
   */
  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  /**
   * Lifecycle hook: called when the application is shutting down.
   * Gracefully closes the connection to the message broker.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting from message broker...');
      await this.client.close();
      this.isConnected = false;
      this.logger.log('Successfully disconnected from message broker.');
    } catch (error) {
      this.logger.error('Error during broker disconnection:', this.extractErrorMessage(error));
    }
  }

  // ============================================================================
  // IEventPublisher IMPLEMENTATION
  // ============================================================================

  /**
   * Publishes a single event to the message broker with acknowledgment.
   * @param event The event object conforming to the BaseEvent interface.
   */
  async publish(event: BaseEvent): Promise<void> {
    if (!this.isConnected) {
      const errorMessage = `Cannot publish event. Not connected to message broker.`;
      this.logger.error(errorMessage, {
        eventType: event.eventType,
        correlationId: event.correlationId,
      });
      throw new Error(errorMessage);
    }

    try {
      const routingKey = event.eventType;

      // Use firstValueFrom to wait for the emit operation to complete
      await firstValueFrom(this.client.emit(routingKey, event));

      this.messagesPublished++;
      this.logger.debug(`✅ Event published: ${routingKey}`, {
        correlationId: event.correlationId,
        timestamp: event.timestamp,
      });
    } catch (error) {
      this.messagesFailed++;
      const errorMessage = `Failed to publish event: ${event.eventType}`;
      this.logger.error(errorMessage, {
        error: this.extractErrorMessage(error),
        correlationId: event.correlationId,
        eventType: event.eventType,
      });
      throw new Error(`${errorMessage}: ${this.extractErrorMessage(error)}`);
    }
  }

  /**
   * Publishes an array of events to the message broker in sequence.
   * @param events An array of event objects.
   */
  async publishBatch(events: BaseEvent[]): Promise<void> {
    if (!events || events.length === 0) {
      this.logger.warn('publishBatch called with empty events array');
      return;
    }

    this.logger.log(`Publishing batch of ${events.length} events...`);

    for (const [index, event] of events.entries()) {
      try {
        await this.publish(event);
        this.logger.debug(`Published ${index + 1}/${events.length} events`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${index + 1}/${events.length} in batch:`, {
          eventType: event.eventType,
          correlationId: event.correlationId,
          error: this.extractErrorMessage(error),
        });
        // Continue with remaining events even if one fails
      }
    }

    this.logger.log(`Batch publish completed for ${events.length} events`);
  }

  /**
   * Publishes an event with retry mechanism for production resilience.
   * @param event The event to publish
   * @param retryConfig Optional custom retry configuration
   */
  async publishWithRetry(event: BaseEvent, retryConfig?: Partial<RetryConfig>): Promise<void> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        await this.publish(event);
        return;
      } catch (error) {
        const isLastAttempt = attempt === config.maxAttempts;

        this.logger.warn(
          `Publish attempt ${attempt}/${config.maxAttempts} failed for event: ${event.eventType}`,
          {
            correlationId: event.correlationId,
            error: this.extractErrorMessage(error),
            nextRetry: isLastAttempt ? 'NONE' : `in ${this.calculateBackoff(attempt, config)}ms`,
          },
        );

        if (isLastAttempt) {
          throw new Error(
            `Failed to publish event after ${config.maxAttempts} attempts: ${event.eventType}`,
          );
        }

        // Wait with exponential backoff before retrying
        const backoffDelay = this.calculateBackoff(attempt, config);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // ============================================================================
  // CONNECTION & HEALTH CHECK LOGIC
  // ============================================================================

  /**
   * Returns the current health status of the message broker connection.
   */
  getHealth(): BrokerHealth {
    return {
      isConnected: this.isConnected,
      brokerUrl: this.sanitizeBrokerUrl(),
      error: this.lastError,
      lastConnectedAt: this.lastConnectedAt,
      messagesPublished: this.messagesPublished,
      messagesConsumed: this.messagesConsumed,
      messagesFailed: this.messagesFailed,
    };
  }

  /**
   * Manually reconnect to the message broker.
   * Useful for recovery scenarios.
   */
  async reconnect(): Promise<void> {
    this.logger.log('Manual reconnection requested...');
    await this.connectWithRetry();
  }

  // ============================================================================
  // CONSUMER METHODS (For services that consume events)
  // ============================================================================

  /**
   * Increments the consumed messages counter.
   * Called by event handlers when they successfully process a message.
   */
  recordMessageConsumed(): void {
    this.messagesConsumed++;
  }

  /**
   * Increments the failed messages counter.
   * Called when a message fails processing and is sent to DLQ.
   */
  recordMessageFailed(): void {
    this.messagesFailed++;
  }

  /**
   * Creates a failed message object for DLQ handling.
   */
  createFailedMessage(event: BaseEvent, error: Error, retryCount: number): FailedMessage {
    return {
      event,
      error: error.message,
      stackTrace: error.stack,
      retryCount,
      failedAt: new Date().toISOString(),
      failingService: this.getServiceNameFromEventType(event.eventType),
    };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Connects to RabbitMQ with exponential backoff retry strategy.
   */
  private async connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_CONNECTION_RETRIES; attempt++) {
      try {
        this.logger.log(
          `Connecting to message broker (attempt ${attempt}/${this.MAX_CONNECTION_RETRIES})...`,
        );

        // Wrap connect() in an Observable for proper timeout handling
        await firstValueFrom(from(this.client.connect()).pipe(timeout(this.CONNECTION_TIMEOUT)));

        this.isConnected = true;
        this.lastConnectedAt = new Date();
        this.lastError = undefined;
        this.logger.log('✅ Successfully connected to the message broker.');
        return;
      } catch (error) {
        const errorMessage = this.extractErrorMessage(error);
        this.isConnected = false;
        this.lastError = errorMessage;
        this.logger.error(`Failed to connect (attempt ${attempt}): ${errorMessage}`);

        if (attempt < this.MAX_CONNECTION_RETRIES) {
          const backoffDelay = 1000 * Math.pow(2, attempt - 1);
          this.logger.log(`Retrying in ${backoffDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    const finalError =
      '❌ All connection attempts failed. Service will operate without broker connection.';
    this.logger.error(finalError);
    throw new Error(finalError);
  }

  /**
   * Calculates exponential backoff delay for retries.
   */
  private calculateBackoff(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelayMs);
  }

  /**
   * Extracts service name from event type for failed message tracking.
   */
  private getServiceNameFromEventType(eventType: string): string {
    const parts = eventType.split('.');
    return parts[0] + '-service';
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred during broker communication.';
  }

  private sanitizeBrokerUrl(): string {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      const parsed = new URL(url);
      parsed.username = '***';
      parsed.password = '***';
      return parsed.toString();
    } catch {
      return 'invalid_url_format';
    }
  }
}
