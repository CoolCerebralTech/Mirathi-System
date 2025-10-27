import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordResetRequestedEvent.
 */
export interface PasswordResetRequestedEventData {
  readonly email: string;
  readonly firstName: string;
  /** The unique, single-use token for resetting the password. */
  readonly resetToken: string;
  /** The timestamp when the reset token will expire. */
  readonly expiresAt: Date;
}

/**
 * PasswordResetRequestedEvent
 *
 * Published when a user initiates the password reset process.
 * This event's primary consumer is the notifications service, which sends the reset email.
 */
export class PasswordResetRequestedEvent
  extends DomainEvent
  implements PasswordResetRequestedEventData
{
  public readonly eventName = 'password.reset_requested';

  public readonly email: string;
  public readonly firstName: string;
  public readonly resetToken: string;
  public readonly expiresAt: Date;

  constructor(props: { aggregateId: string } & PasswordResetRequestedEventData) {
    // Call the base class constructor with the user's ID
    super(props.aggregateId);

    // Assign the specific payload properties
    this.email = props.email;
    this.firstName = props.firstName;
    this.resetToken = props.resetToken;
    this.expiresAt = props.expiresAt;
  }
}
