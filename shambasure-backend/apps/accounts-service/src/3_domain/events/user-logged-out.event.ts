import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserLoggedOutEvent.
 */
export interface UserLoggedOutEventData {
  readonly email: string;
  readonly sessionId?: string;
  readonly deviceId?: string;
}

/**
 * UserLoggedOutEvent
 *
 * Published when a user explicitly logs out of the system.
 */
export class UserLoggedOutEvent extends DomainEvent implements UserLoggedOutEventData {
  public readonly eventName = 'user.logged_out';

  public readonly email: string;
  public readonly sessionId?: string;
  public readonly deviceId?: string;

  constructor(props: { aggregateId: string } & UserLoggedOutEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.sessionId = props.sessionId;
    this.deviceId = props.deviceId;
  }
}
