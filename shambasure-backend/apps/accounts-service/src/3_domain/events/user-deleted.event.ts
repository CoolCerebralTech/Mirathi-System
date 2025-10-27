import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the UserDeletedEvent.
 */
export interface UserDeletedEventData {
  readonly email: string;
}

/**
 * UserDeletedEvent
 *
 * Published when a user's account is soft-deleted.
 */
export class UserDeletedEvent extends DomainEvent implements UserDeletedEventData {
  public readonly eventName = 'user.deleted';

  public readonly email: string;

  constructor(props: { aggregateId: string } & UserDeletedEventData) {
    super(props.aggregateId);
    this.email = props.email;
  }
}
