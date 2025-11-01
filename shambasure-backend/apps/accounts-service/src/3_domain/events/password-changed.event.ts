import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordChangedEvent.
 * Useful for sending a "Your password has changed" security notification.
 */
export interface PasswordChangedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly firstName: string;
}

/**
 * PasswordChangedEvent
 *
 * Published when a user successfully changes their own password.
 * This is a security-sensitive event that should trigger a notification.
 */
export class PasswordChangedEvent extends DomainEvent<PasswordChangedEventData> {
  public readonly eventName = 'password.changed';

  constructor(props: { aggregateId: string } & PasswordChangedEventData) {
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
    });
  }
}
