import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailChangedEvent.
 */
export interface EmailChangedEventData extends Record<string, unknown> {
  readonly previousEmail: string;
  readonly newEmail: string;
}

/**
 * EmailChangedEvent
 *
 * Published when a user's email address has been successfully changed
 * after verification of the new email address.
 */
export class EmailChangedEvent extends DomainEvent<EmailChangedEventData> {
  public readonly eventName = 'user.email_changed';

  constructor(props: { aggregateId: string } & EmailChangedEventData) {
    super(props.aggregateId, {
      previousEmail: props.previousEmail,
      newEmail: props.newEmail,
    });
  }
}
