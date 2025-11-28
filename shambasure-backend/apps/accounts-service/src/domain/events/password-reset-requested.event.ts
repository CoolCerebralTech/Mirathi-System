import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PasswordResetRequestedEvent.
 */
export interface PasswordResetRequestedEventData extends Record<string, unknown> {
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
export class PasswordResetRequestedEvent extends DomainEvent<PasswordResetRequestedEventData> {
  public readonly eventName = 'password.reset_requested';

  constructor(props: { aggregateId: string } & PasswordResetRequestedEventData) {
    // Call the base class constructor with the user's ID and payload
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
      resetToken: props.resetToken,
      expiresAt: props.expiresAt,
    });
  }
}
