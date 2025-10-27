import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the EmailVerifiedEvent.
 * This data is useful for services like notifications to personalize messages.
 */
export interface EmailVerifiedEventData {
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
export class EmailVerifiedEvent extends DomainEvent implements EmailVerifiedEventData {
  public readonly eventName = 'email.verified';

  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;

  constructor(props: { aggregateId: string } & EmailVerifiedEventData) {
    // Call the base class constructor with the verified user's ID
    super(props.aggregateId);

    // Assign the specific payload properties
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }
}
