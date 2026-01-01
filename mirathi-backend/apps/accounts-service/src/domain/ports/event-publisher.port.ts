// src/domain/ports/event-publisher.port.ts
import { DomainEvent } from '../events/domain-event';

/**
 * Event publisher port for domain events
 */
export abstract class EventPublisherPort {
  /**
   * Publish a domain event
   */
  abstract publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  abstract publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * Injection token for EventPublisherPort
 */
export const EVENT_PUBLISHER_PORT = 'EVENT_PUBLISHER_PORT';
