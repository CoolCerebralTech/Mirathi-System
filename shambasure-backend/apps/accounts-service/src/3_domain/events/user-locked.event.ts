import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the UserLockedEvent.
 */
export interface UserLockedEventData {
  readonly email: string;
  readonly reason: 'failed_attempts' | 'admin_action' | 'suspicious_activity';
  /** The timestamp when the lock expires. `null` indicates an indefinite lock. */
  readonly lockedUntil: Date | null;
  /** The ID of the user (typically an admin) who initiated the lock. Optional. */
  readonly lockedBy?: string;
}

/**
 * UserLockedEvent
 *
 * Published when a user account is locked, either automatically or by an administrator.
 * This is a critical security event for monitoring and user notification.
 */
export class UserLockedEvent extends DomainEvent implements UserLockedEventData {
  public readonly eventName = 'user.locked';

  public readonly email: string;
  public readonly reason: 'failed_attempts' | 'admin_action' | 'suspicious_activity';
  public readonly lockedUntil: Date | null;
  public readonly lockedBy?: string;

  constructor(props: { aggregateId: string } & UserLockedEventData) {
    // Call the base class constructor with the ID of the locked user
    super(props.aggregateId);

    // Assign the specific payload properties
    this.email = props.email;
    this.reason = props.reason;
    this.lockedUntil = props.lockedUntil;
    this.lockedBy = props.lockedBy;
  }
}
