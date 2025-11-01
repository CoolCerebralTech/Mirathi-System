import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for SessionRevokedEvent.
 */
export interface SessionRevokedEventData extends Record<string, unknown> {
  readonly email: string;
  readonly sessionIds: string[];
  readonly revokedBy: string; // 'self' | userId (for admin revocation)
  readonly reason?: string;
}

/**
 * SessionRevokedEvent
 *
 * Published when one or more user sessions are forcefully terminated.
 * Used for "logout from all devices" functionality or admin-initiated session termination.
 */
export class SessionRevokedEvent extends DomainEvent<SessionRevokedEventData> {
  public readonly eventName = 'user.session_revoked';

  constructor(props: { aggregateId: string } & SessionRevokedEventData) {
    super(props.aggregateId, {
      email: props.email,
      sessionIds: props.sessionIds,
      revokedBy: props.revokedBy,
      reason: props.reason,
    });
  }
}
