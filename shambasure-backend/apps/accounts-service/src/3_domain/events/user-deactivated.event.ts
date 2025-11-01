import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserDeactivatedEvent.
 */
export interface UserDeactivatedEventData extends Record<string, unknown> {
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
export class UserDeactivatedEvent extends DomainEvent<UserDeactivatedEventData> {
  public readonly eventName = 'user.deactivated';

  constructor(props: { aggregateId: string } & UserDeactivatedEventData) {
    super(props.aggregateId, {
      email: props.email,
      deactivatedBy: props.deactivatedBy,
      reason: props.reason,
    });
  }
}
