import { UserRole } from '@shamba/common';
import { DomainEvent } from './domain-event.base';

/**
 * Defines the structure for tracking changes to user fields.
 */
export interface UpdatedFields {
  firstName?: { old: string; new: string };
  lastName?: { old: string; new: string };
  email?: { old: string; new: string };
  role?: { old: UserRole; new: UserRole };
  isActive?: { old: boolean; new: boolean };
}

/**
 * Defines the specific data payload for the UserUpdatedEvent.
 */
export interface UserUpdatedEventData {
  readonly email: string;
  readonly updatedFields: UpdatedFields;
  /** The ID of the user (often an admin) who performed the update. Optional. */
  readonly updatedBy?: string;
}

/**
 * UserUpdatedEvent
 *
 * Published when a user's information is updated.
 * Contains details about what changed for audit purposes.
 */
export class UserUpdatedEvent extends DomainEvent implements UserUpdatedEventData {
  public readonly eventName = 'user.updated';

  public readonly email: string;
  public readonly updatedFields: UpdatedFields;
  public readonly updatedBy?: string;

  constructor(props: { aggregateId: string } & UserUpdatedEventData) {
    // Call the base class constructor with the updated user's ID
    super(props.aggregateId);

    this.email = props.email;
    this.updatedFields = props.updatedFields;
    this.updatedBy = props.updatedBy;
  }
}
