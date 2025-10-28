import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneNumberUpdatedEvent.
 */
export interface PhoneNumberUpdatedEventData {
  readonly previousPhoneNumber?: string; // undefined if adding first phone
  readonly newPhoneNumber: string; // E.164 format
  readonly verified: boolean;
}

/**
 * PhoneNumberUpdatedEvent
 *
 * Published when a user adds or changes their phone number in their profile.
 */
export class PhoneNumberUpdatedEvent extends DomainEvent implements PhoneNumberUpdatedEventData {
  public readonly eventName = 'user.phone_number_updated';

  public readonly previousPhoneNumber?: string;
  public readonly newPhoneNumber: string;
  public readonly verified: boolean;

  constructor(props: { aggregateId: string } & PhoneNumberUpdatedEventData) {
    super(props.aggregateId);
    this.previousPhoneNumber = props.previousPhoneNumber;
    this.newPhoneNumber = props.newPhoneNumber;
    this.verified = props.verified;
  }
}
