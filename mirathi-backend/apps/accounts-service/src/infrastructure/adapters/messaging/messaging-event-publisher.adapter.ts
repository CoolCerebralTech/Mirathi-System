// src/infrastructure/adapters/messaging/messaging-event-publisher.adapter.ts
import { Inject, Injectable, Logger } from '@nestjs/common';

// Imports from your local messaging module structure
import { IEventPublisher } from '@shamba/messaging';

import { DomainEvent } from '../../../domain/events/domain-event';
import { EventPublisherPort } from '../../../domain/ports/event-publisher.port';
import { DomainEventMapper } from './domain-event.mapper';

/**
 * Adapter that implements the domain EventPublisherPort using the shared messaging library.
 * This keeps the Domain layer clean (it doesn't know about RabbitMQ/BaseEvent).
 */
@Injectable()
export class MessagingEventPublisherAdapter implements EventPublisherPort {
  private readonly logger = new Logger(MessagingEventPublisherAdapter.name);

  constructor(
    // We inject the abstract interface token, resolved to MessagingService at runtime
    @Inject(IEventPublisher)
    private readonly messagingClient: IEventPublisher,
    private readonly eventMapper: DomainEventMapper,
  ) {}

  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      const message = this.eventMapper.toMessage(event);
      await this.messagingClient.publish(message);
    } catch (error) {
      // Production Resilience: Log error but don't throw.
      // We prioritize DB consistency over Event consistency for now.
      // (Future Upgrade: Transactional Outbox Pattern)
      this.logger.error(`Failed to publish event: ${event.constructor.name}`, error);
    }
  }

  /**
   * Publish multiple domain events
   * OPTIMIZED: Uses publishBatch instead of looping manually
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    if (!events || events.length === 0) return;

    try {
      // 1. Map all events to messages
      const messages = events.map((event) => this.eventMapper.toMessage(event));

      // 2. Send in one batch operation
      await this.messagingClient.publishBatch(messages);
    } catch (error) {
      this.logger.error(`Failed to publish batch of ${events.length} events`, error);
      // We swallow the error to ensure the HTTP response still succeeds
    }
  }
}
