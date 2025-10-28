import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserReactivatedEvent.
 */
export interface UserReactivatedEventData {
  readonly email: string;
  readonly reactivatedBy: string; // userId of admin who reactivated
  readonly reason?: string;
}

/**
 * UserReactivatedEvent
 *
 * Published when a previously deactivated user account is reactivated.
 */
export class UserReactivatedEvent extends DomainEvent implements UserReactivatedEventData {
  public readonly eventName = 'user.reactivated';

  public readonly email: string;
  public readonly reactivatedBy: string;
  public readonly reason?: string;

  constructor(props: { aggregateId: string } & UserReactivatedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.reactivatedBy = props.reactivatedBy;
    this.reason = props.reason;
  }
}
