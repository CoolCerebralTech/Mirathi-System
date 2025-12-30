import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserReactivatedEvent.
 */
export interface UserReactivatedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly reactivatedBy: string; // userId of admin who reactivated
  readonly reason?: string;
}

/**
 * UserReactivatedEvent
 *
 * Published when a previously deactivated user account is reactivated.
 */
export class UserReactivatedEvent extends DomainEvent<UserReactivatedEventData> {
  public readonly eventName = 'user.reactivated';

  constructor(props: { aggregateId: string } & UserReactivatedEventData) {
    super(props.aggregateId, {
      email: props.email,
      reactivatedBy: props.reactivatedBy,
      reason: props.reason,
    });
  }
}
