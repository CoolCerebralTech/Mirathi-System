import { UserRole } from '@shamba/common';
import { DomainEvent } from './domain-event.base';

// Define the shape of the data specific to this event
export interface UserCreatedEventData {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly marketingOptIn: boolean;
  readonly requiresEmailVerification: boolean;
}

/**
 * Published when a new user registers in the system.
 */
export class UserCreatedEvent extends DomainEvent implements UserCreatedEventData {
  // Set the unique event name
  public readonly eventName = 'user.created';

  // Include the specific data payload properties
  public readonly email: string;
  public readonly firstName: string;
  public readonly lastName: string;
  public readonly role: UserRole;
  public readonly marketingOptIn: boolean;
  public readonly requiresEmailVerification: boolean;

  constructor(props: { aggregateId: string } & UserCreatedEventData) {
    // Call the base class constructor with the user's ID
    super(props.aggregateId);

    // Assign the specific payload properties
    this.email = props.email;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.role = props.role;
    this.marketingOptIn = props.marketingOptIn;
    this.requiresEmailVerification = props.requiresEmailVerification;
  }
}
