import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneVerificationRequestedEvent.
 */
export interface PhoneVerificationRequestedEventData {
  readonly phoneNumber: string; // E.164 format
  readonly otp: string; // Plain OTP to be sent (hashed in DB)
  readonly provider: 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown';
}

/**
 * PhoneVerificationRequestedEvent
 *
 * Published when a phone verification OTP is requested.
 * Triggers the notifications service to send SMS with OTP code.
 */
export class PhoneVerificationRequestedEvent
  extends DomainEvent
  implements PhoneVerificationRequestedEventData
{
  public readonly eventName = 'user.phone_verification_requested';

  public readonly phoneNumber: string;
  public readonly otp: string;
  public readonly provider: 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown';

  constructor(props: { aggregateId: string } & PhoneVerificationRequestedEventData) {
    super(props.aggregateId);
    this.phoneNumber = props.phoneNumber;
    this.otp = props.otp;
    this.provider = props.provider;
  }
}
