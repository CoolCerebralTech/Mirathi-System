import { UserRole } from '@shamba/common';
import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the RoleChangedEvent.
 */
export interface RoleChangedEventData {
  readonly email: string;
  readonly oldRole: UserRole;
  readonly newRole: UserRole;
  /** The ID of the user (typically an admin) who initiated the change. */
  readonly changedBy: string;
  readonly reason?: string;
}

/**
 * RoleChangedEvent
 *
 * Published when a user's role is changed.
 * This is a critical security event for the audit trail.
 */
export class RoleChangedEvent extends DomainEvent implements RoleChangedEventData {
  public readonly eventName = 'user.role_changed';

  public readonly email: string;
  public readonly oldRole: UserRole;
  public readonly newRole: UserRole;
  public readonly changedBy: string;
  public readonly reason?: string;

  constructor(props: { aggregateId: string } & RoleChangedEventData) {
    // Call the base class constructor with the ID of the user whose role changed
    super(props.aggregateId);

    // Assign the specific payload properties
    this.email = props.email;
    this.oldRole = props.oldRole;
    this.newRole = props.newRole;
    this.changedBy = props.changedBy;
    this.reason = props.reason;
  }
}
