import { DomainEvent } from './domain-event.base';

/**
 * Defines the specific data payload for UsersBulkUpdatedEvent.
 */
export interface UsersBulkUpdatedEventData extends Record<string, unknown> {
  readonly adminId: string;
  readonly updatedUserIds: string[];
  readonly changes: any;
  readonly reason?: string;
}

/**
 * UsersBulkUpdatedEvent
 *
 * Published when multiple users are updated in bulk by an admin.
 */
export class UsersBulkUpdatedEvent extends DomainEvent<UsersBulkUpdatedEventData> {
  public readonly eventName = 'admin.users_bulk_updated';

  constructor(payload: UsersBulkUpdatedEventData) {
    super(payload.adminId, payload);
  }
}
