import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for SessionRevokedEvent.
 */
export interface SessionRevokedEventData {
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
export class SessionRevokedEvent extends DomainEvent implements SessionRevokedEventData {
  public readonly eventName = 'user.session_revoked';

  public readonly email: string;
  public readonly sessionIds: string[];
  public readonly revokedBy: string;
  public readonly reason?: string;

  constructor(props: { aggregateId: string } & SessionRevokedEventData) {
    super(props.aggregateId);
    this.email = props.email;
    this.sessionIds = props.sessionIds;
    this.revokedBy = props.revokedBy;
    this.reason = props.reason;
  }
}
