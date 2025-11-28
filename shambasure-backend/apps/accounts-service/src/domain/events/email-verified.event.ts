import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the EmailVerifiedEvent.
 * This data is useful for services like notifications to personalize messages.
 */
export interface EmailVerifiedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

/**
 * EmailVerifiedEvent
 *
 * Published when a user successfully verifies their email address.
 * This can trigger welcome emails and unlock full platform features.
 */
export class EmailVerifiedEvent extends DomainEvent<EmailVerifiedEventData> {
  public readonly eventName = 'email.verified';

  constructor(props: { aggregateId: string } & EmailVerifiedEventData) {
    // Call the base class constructor with the verified user's ID and payload
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
    });
  }
}
