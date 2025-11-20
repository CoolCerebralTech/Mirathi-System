import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the UserDeletedEvent.
 */
export interface UserDeletedEventData extends Record<string, unknown> {
  readonly email: string;
  /** The ID of the user (often an admin) who performed the deletion. Optional. */
  readonly deletedBy?: string;
}

/**
 * UserDeletedEvent
 *
 * Published when a user's account is soft-deleted.
 */
export class UserDeletedEvent extends DomainEvent<UserDeletedEventData> {
  public readonly eventName = 'user.deleted';

  constructor(props: { aggregateId: string } & UserDeletedEventData) {
    super(props.aggregateId, {
      email: props.email,
      deletedBy: props.deletedBy,
    });
  }
}
