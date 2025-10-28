import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for EmailVerificationRequestedEvent.
 */
export interface EmailVerificationRequestedEventData {
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
export class EmailVerificationRequestedEvent
  extends DomainEvent
  implements EmailVerificationRequestedEventData
{
  public readonly eventName = 'user.email_verification_requested';

  public readonly email: string;
  public readonly firstName: string;
  public readonly token: string;
  public readonly isResend: boolean;

  constructor(props: { aggregateId: string } & EmailVerificationRequestedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.firstName = props.firstName;
    this.token = props.token;
    this.isResend = props.isResend;
  }
}
