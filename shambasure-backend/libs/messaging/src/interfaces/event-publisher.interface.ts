import { BaseEvent } from './messaging.interface';

/**
 * Defines the contract for an event publisher.
 * This is the "Port" in a Clean/Hexagonal Architecture that application services
 * will depend on to publish domain events.
 */
export const IEventPublisher = 'IEventPublisher'; // Use a string-based token

export interface IEventPublisher {
  /**
   * Publishes a single domain event.
   * @param event The event to publish, conforming to the BaseEvent structure.
   */
  publish(event: BaseEvent): Promise<void>;

  /**
   * Publishes multiple domain events in a batch.
   * @param events An array of events to publish.
   */
  publishBatch(events: BaseEvent[]): Promise<void>;
}
