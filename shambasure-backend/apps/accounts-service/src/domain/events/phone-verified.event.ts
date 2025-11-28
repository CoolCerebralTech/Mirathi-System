import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PhoneVerifiedEvent.
 */
export interface PhoneVerifiedEventData extends Record<string, unknown> {
  /** The phone number in E.164 format. */
  readonly phoneNumber: string;
  readonly provider: 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown';
}

/**
 * PhoneVerifiedEvent
 *
 * Published when a user successfully verifies their phone number.
 * This can enable features like SMS notifications.
 */
export class PhoneVerifiedEvent extends DomainEvent<PhoneVerifiedEventData> {
  public readonly eventName = 'phone.verified';

  constructor(props: { aggregateId: string } & PhoneVerifiedEventData) {
    // Call the base class constructor with the user's ID and payload
    super(props.aggregateId, {
      phoneNumber: props.phoneNumber,
      provider: props.provider,
    });
  }
}
