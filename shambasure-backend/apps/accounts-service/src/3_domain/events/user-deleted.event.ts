import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the UserDeletedEvent.
 */
export interface UserDeletedEventData {
  readonly email: string;
  /** The ID of the user (often an admin) who performed the deletion. Optional. */
  readonly deletedBy?: string;
}

/**
 * UserDeletedEvent
 *
 * Published when a user's account is soft-deleted.
 */
export class UserDeletedEvent extends DomainEvent implements UserDeletedEventData {
  public readonly eventName = 'user.deleted';

  public readonly email: string;
  public readonly deletedBy?: string;

  constructor(props: { aggregateId: string } & UserDeletedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.deletedBy = props.deletedBy;
  }
}
