import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UserLoggedOutEvent.
 */
export interface UserLoggedOutEventData extends Record<string, unknown> {
  readonly email: string;
  readonly sessionId?: string;
  readonly deviceId?: string;
}

/**
 * UserLoggedOutEvent
 *
 * Published when a user explicitly logs out of the system.
 */
export class UserLoggedOutEvent extends DomainEvent<UserLoggedOutEventData> {
  public readonly eventName = 'user.logged_out';

  constructor(props: { aggregateId: string } & UserLoggedOutEventData) {
    super(props.aggregateId, {
      email: props.email,
      sessionId: props.sessionId,
      deviceId: props.deviceId,
    });
  }
}
