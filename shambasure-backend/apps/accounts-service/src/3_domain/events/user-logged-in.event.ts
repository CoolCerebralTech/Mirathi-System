import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserLoggedInEvent.
 */
export interface UserLoggedInEventData {
  readonly email: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceId?: string;
}

/**
 * UserLoggedInEvent
 *
 * Published when a user successfully logs into the system.
 */
export class UserLoggedInEvent extends DomainEvent implements UserLoggedInEventData {
  public readonly eventName = 'user.logged_in';

  public readonly email: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;
  public readonly deviceId?: string;

  constructor(props: { aggregateId: string } & UserLoggedInEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.deviceId = props.deviceId;
  }
}
