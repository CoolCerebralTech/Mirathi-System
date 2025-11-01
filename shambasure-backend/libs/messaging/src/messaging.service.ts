// ============================================================================
// Shamba Sure - Core Messaging Service
// ============================================================================
// This service wraps the NestJS RabbitMQ ClientProxy and provides a clean,
// decoupled interface for publishing domain events. Its responsibilities:
//
// 1. Implements the `IEventPublisher` interface for application services.
// 2. Manages the RabbitMQ connection lifecycle (`onModuleInit`, `onModuleDestroy`).
// 3. Exposes health check information about the broker connection.
// 4. Abstracts away low-level ClientProxy details.
// ============================================================================

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BrokerHealth, BaseEvent } from './interfaces/messaging.interface';
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

  /** Maximum time to wait for the initial connection in milliseconds. */
  private readonly CONNECTION_TIMEOUT = 10000;
  /** Maximum retry attempts for the initial connection. */
  private readonly MAX_CONNECTION_RETRIES = 3;

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
   * Publishes a single event to the message broker (fire-and-forget).
   * @param event The event object conforming to the BaseEvent interface.
   */
  publish(event: BaseEvent): Promise<void> {
    if (!this.isConnected) {
      this.logger.error(`Cannot publish event. Not connected.`, { event });
      return Promise.resolve();
    }

    try {
      const routingKey = event.eventType;
      this.client.emit(routingKey, event);
      this.logger.debug(`Event published: ${routingKey}`, { correlationId: event.correlationId });
    } catch (error) {
      this.logger.error(
        `Failed to publish event: ${event.eventType}`,
        this.extractErrorMessage(error),
        { event },
      );
    }

    return Promise.resolve();
  }

  /**
   * Publishes an array of events to the message broker.
   * @param events An array of event objects.
   */
  publishBatch(events: BaseEvent[]): Promise<void> {
    for (const event of events) {
      void this.publish(event);
    }
    return Promise.resolve();
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
    };
  }

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
    this.logger.error(
      '❌ All connection attempts failed. Service will operate without broker connection.',
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private extractErrorMessage(error: unknown): string {
    return error instanceof Error
      ? error.message
      : 'An unknown error occurred during broker communication.';
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
