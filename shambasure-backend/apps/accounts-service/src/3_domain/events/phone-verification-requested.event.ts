import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneVerificationRequestedEvent.
 */
export interface PhoneVerificationRequestedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly phoneNumber: string; // E.164 format
}

/**
 * PhoneVerificationRequestedEvent
 *
 * Published when a phone verification OTP is requested.
 * Triggers a downstream service (e.g., notifications) to generate and send an SMS with an OTP code.
 */
export class PhoneVerificationRequestedEvent extends DomainEvent<PhoneVerificationRequestedEventData> {
  public readonly eventName = 'user.phone_verification_requested';

  constructor(props: { aggregateId: string } & PhoneVerificationRequestedEventData) {
    super(props.aggregateId, {
      email: props.email,
      phoneNumber: props.phoneNumber,
    });
  }
}
