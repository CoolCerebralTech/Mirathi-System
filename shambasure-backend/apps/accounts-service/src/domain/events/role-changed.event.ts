import { UserRole } from '@shamba/common';
import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for the RoleChangedEvent.
 */
export interface RoleChangedEventData extends Record<string, unknown> {
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
export class RoleChangedEvent extends DomainEvent<RoleChangedEventData> {
  public readonly eventName = 'user.role_changed';

  constructor(props: { aggregateId: string } & RoleChangedEventData) {
    // Call the base class constructor with the ID of the user whose role changed and payload
    super(props.aggregateId, {
      email: props.email,
      oldRole: props.oldRole,
      newRole: props.newRole,
      changedBy: props.changedBy,
      reason: props.reason,
    });
  }
}
