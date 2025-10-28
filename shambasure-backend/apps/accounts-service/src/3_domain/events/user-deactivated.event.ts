import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserDeactivatedEvent.
 */
export interface UserDeactivatedEventData {
  readonly email: string;
  readonly deactivatedBy: string; // 'self' | userId (if admin deactivated)
  readonly reason?: string;
}

/**
 * UserDeactivatedEvent
 *
 * Published when a user account is deactivated (soft disable, not deleted).
 * User can be reactivated later by admin.
 */
export class UserDeactivatedEvent extends DomainEvent implements UserDeactivatedEventData {
  public readonly eventName = 'user.deactivated';

  public readonly email: string;
  public readonly deactivatedBy: string;
  public readonly reason?: string;

  constructor(props: { aggregateId: string } & UserDeactivatedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.deactivatedBy = props.deactivatedBy;
    this.reason = props.reason;
  }
}
