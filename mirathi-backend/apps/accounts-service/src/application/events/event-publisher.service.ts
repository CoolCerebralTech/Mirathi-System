// src/application/events/event-publisher.service.ts
import { Injectable, Logger } from '@nestjs/common';

import { DomainEvent } from '../../domain/events/domain-event';
import { EventPublisherPort } from '../../domain/ports/event-publisher.port';

/**
 * Application layer service for publishing domain events.
 * Delegates to the infrastructure adapter (MessagingEventPublisherAdapter).
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(private readonly eventPublisher: EventPublisherPort) {}

  /**
   * Publish a single domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.eventPublisher.publish(event);
      this.logger.debug(`Published event: ${event.eventName} for aggregate: ${event.aggregateId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventName}`, error);
      // Don't throw - event publishing failure shouldn't break the main flow
    }
  }

  /**
   * Publish multiple domain events in batch
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    try {
      await this.eventPublisher.publishAll(events);
      this.logger.debug(`Published ${events.length} events`);
    } catch (error) {
      this.logger.error(`Failed to publish ${events.length} events`, error);
      // Don't throw - event publishing failure shouldn't break the main flow
    }
  }
}
