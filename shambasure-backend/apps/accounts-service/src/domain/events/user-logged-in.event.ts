import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserLoggedInEvent.
 */
export interface UserLoggedInEventData extends Record<string, unknown> {
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
export class UserLoggedInEvent extends DomainEvent<UserLoggedInEventData> {
  public readonly eventName = 'user.logged_in';

  constructor(props: { aggregateId: string } & UserLoggedInEventData) {
    super(props.aggregateId, {
      email: props.email,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
      deviceId: props.deviceId,
    });
  }
}
