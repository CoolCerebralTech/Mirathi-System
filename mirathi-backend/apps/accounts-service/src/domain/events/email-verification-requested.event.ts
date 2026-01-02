import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailVerificationRequestedEvent.
 */
export interface EmailVerificationRequestedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly firstName: string;
  readonly token: string; // Verification token to be sent
  readonly isResend: boolean;
}

/**
 * EmailVerificationRequestedEvent
 *
 * Published when an email verification is requested (initial signup or resend).
 * Triggers the notifications service to send the verification email.
 */
export class EmailVerificationRequestedEvent extends DomainEvent<EmailVerificationRequestedEventData> {
  public readonly eventName = 'user.email_verification_requested';

  constructor(props: { aggregateId: string } & EmailVerificationRequestedEventData) {
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
      token: props.token,
      isResend: props.isResend,
    });
  }
}
