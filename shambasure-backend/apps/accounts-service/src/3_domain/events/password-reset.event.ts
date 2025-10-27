import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordResetEvent.
 * Useful for sending a "Your password has been successfully reset" confirmation.
 */
export interface PasswordResetEventData {
  readonly email: string;
  readonly firstName: string;
}

/**
 * PasswordResetEvent
 *
 * Published when a user's password has been successfully reset via the
 * "forgot password" flow.
 */
export class PasswordResetEvent extends DomainEvent implements PasswordResetEventData {
  public readonly eventName = 'password.reset';

  public readonly email: string;
  public readonly firstName: string;

  constructor(props: { aggregateId: string } & PasswordResetEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.firstName = props.firstName;
  }
}
