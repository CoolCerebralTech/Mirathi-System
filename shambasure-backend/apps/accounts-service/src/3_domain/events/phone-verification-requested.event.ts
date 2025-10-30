import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneVerificationRequestedEvent.
 */
export interface PhoneVerificationRequestedEventData {
  readonly email: string;
  readonly phoneNumber: string; // E.164 format
}

/**
 * PhoneVerificationRequestedEvent
 *
 * Published when a phone verification OTP is requested.
 * Triggers a downstream service (e.g., notifications) to generate and send an SMS with an OTP code.
 */
export class PhoneVerificationRequestedEvent
  extends DomainEvent
  implements PhoneVerificationRequestedEventData
{
  public readonly eventName = 'user.phone_verification_requested';

  public readonly email: string;
  public readonly phoneNumber: string;

  constructor(props: { aggregateId: string } & PhoneVerificationRequestedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.phoneNumber = props.phoneNumber;
  }
}
