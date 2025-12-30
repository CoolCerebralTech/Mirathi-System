import { UserRole } from '@prisma/client';

import { DomainEvent } from './domain-event.base';

// Define the shape of the data specific to this event
export interface UserCreatedEventData extends Record<string, unknown> {
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
export class UserCreatedEvent extends DomainEvent<UserCreatedEventData> {
  // Set the unique event name
  public readonly eventName = 'user.created';

  constructor(props: { aggregateId: string } & UserCreatedEventData) {
    // Call the base class constructor with the user's ID and payload
    super(props.aggregateId, {
      email: props.email,
      firstName: props.firstName,
      lastName: props.lastName,
      role: props.role,
      marketingOptIn: props.marketingOptIn,
      requiresEmailVerification: props.requiresEmailVerification,
    });
  }
}
