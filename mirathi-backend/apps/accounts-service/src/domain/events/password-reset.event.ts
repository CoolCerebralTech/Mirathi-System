import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordResetEvent.
 * Useful for sending a "Your password has been successfully reset" confirmation.
 */
export interface PasswordResetEventData extends Record<string, unknown> {
  readonly email: string;
  readonly firstName: string;
}

/**
 * PasswordResetEvent
 *
 * Published when a user's password has been successfully reset via the
 * "forgot password" flow.
 */
export class PasswordResetEvent extends DomainEvent<PasswordResetEventData> {
  public readonly eventName = 'password.reset';

  constructor(props: { aggregateId: string } & PasswordResetEventData) {
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
    });
  }
}
