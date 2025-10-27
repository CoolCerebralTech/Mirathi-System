import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordChangedEvent.
 * Useful for sending a "Your password has changed" security notification.
 */
export interface PasswordChangedEventData {
  readonly email: string;
  readonly firstName: string;
}

/**
 * PasswordChangedEvent
 *
 * Published when a user successfully changes their own password.
 * This is a security-sensitive event that should trigger a notification.
 */
export class PasswordChangedEvent extends DomainEvent implements PasswordChangedEventData {
  public readonly eventName = 'password.changed';

  public readonly email: string;
  public readonly firstName: string;

  constructor(props: { aggregateId: string } & PasswordChangedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.firstName = props.firstName;
  }
}
