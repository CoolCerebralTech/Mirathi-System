import { BaseEvent } from './messaging.interface';

/**
 * Defines the contract for an event subscriber/handler.
 * This is the "Port" that application services implement to handle domain events.
 */
export const IEventSubscriber = 'IEventSubscriber'; // String-based token for DI

export interface IEventSubscriber {
  /**
   * The specific event type this subscriber handles
   * Must match one of the routing patterns from ShambaEvents
   */
  readonly eventType: string;

  /**
   * Processes a single domain event
   * @param event The event to handle
   */
  handle(event: BaseEvent): Promise<void>;
}

/**
 * Registry to manage all event subscribers in the system
 */
export interface EventSubscriberRegistry {
  /**
   * Registers a subscriber for a specific event type
   */
  register(subscriber: IEventSubscriber): void;

  /**
   * Gets all subscribers for a specific event type
   */
  getSubscribersForEvent(eventType: string): IEventSubscriber[];

  /**
   * Gets all registered event patterns for RabbitMQ binding
   */
  getAllEventPatterns(): string[];
}
