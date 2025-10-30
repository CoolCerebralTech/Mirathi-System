import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneNumberUpdatedEvent.
 */
export interface PhoneNumberUpdatedEventData {
  readonly email: string;
  readonly previousPhone?: string; // undefined if adding for the first time
  readonly newPhone: string; // E.164 format
}

/**
 * PhoneNumberUpdatedEvent
 *
 * Published when a user adds or changes their phone number in their profile.
 */
export class PhoneNumberUpdatedEvent extends DomainEvent implements PhoneNumberUpdatedEventData {
  public readonly eventName = 'user.phone_number_updated';

  public readonly email: string;
  public readonly previousPhone?: string;
  public readonly newPhone: string;

  constructor(props: { aggregateId: string } & PhoneNumberUpdatedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.previousPhone = props.previousPhone;
    this.newPhone = props.newPhone;
  }
}
