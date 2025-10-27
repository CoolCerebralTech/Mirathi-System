import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the PhoneVerifiedEvent.
 */
export interface PhoneVerifiedEventData {
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
export class PhoneVerifiedEvent extends DomainEvent implements PhoneVerifiedEventData {
  public readonly eventName = 'phone.verified';

  public readonly phoneNumber: string;
  public readonly provider: 'Safaricom' | 'Airtel' | 'Telkom' | 'Unknown';

  constructor(props: { aggregateId: string } & PhoneVerifiedEventData) {
    // Call the base class constructor with the user's ID
    super(props.aggregateId);

    // Assign the specific payload properties
    this.phoneNumber = props.phoneNumber;
    this.provider = props.provider;
  }
}
