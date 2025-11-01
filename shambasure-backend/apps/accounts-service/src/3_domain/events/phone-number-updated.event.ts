import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for PhoneNumberUpdatedEvent.
 */
export interface PhoneNumberUpdatedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly previousPhone?: string; // undefined if adding for the first time
  readonly newPhone: string; // E.164 format
}

/**
 * PhoneNumberUpdatedEvent
 *
 * Published when a user adds or changes their phone number in their profile.
 */
export class PhoneNumberUpdatedEvent extends DomainEvent<PhoneNumberUpdatedEventData> {
  public readonly eventName = 'user.phone_number_updated';

  constructor(props: { aggregateId: string } & PhoneNumberUpdatedEventData) {
    super(props.aggregateId, {
      email: props.email,
      previousPhone: props.previousPhone,
      newPhone: props.newPhone,
    });
  }
}
