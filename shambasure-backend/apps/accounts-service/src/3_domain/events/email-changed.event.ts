import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailChangedEvent.
 */
export interface EmailChangedEventData {
  readonly previousEmail: string;
  readonly newEmail: string;
}

/**
 * EmailChangedEvent
 *
 * Published when a user's email address has been successfully changed
 * after verification of the new email address.
 */
export class EmailChangedEvent extends DomainEvent implements EmailChangedEventData {
  public readonly eventName = 'user.email_changed';

  public readonly previousEmail: string;
  public readonly newEmail: string;

  constructor(props: { aggregateId: string } & EmailChangedEventData) {
    super(props.aggregateId);
    this.previousEmail = props.previousEmail;
    this.newEmail = props.newEmail;
  }
}
