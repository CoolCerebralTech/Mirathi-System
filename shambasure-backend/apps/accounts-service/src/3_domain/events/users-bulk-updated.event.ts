import { DomainEvent } from './domain-event.base'; // Adjust import

export class UsersBulkUpdatedEvent extends DomainEvent {
  public eventName: string;
  constructor(
    public readonly payload: {
      adminId: string;
      updatedUserIds: string[];
      changes: any;
      reason?: string;
    },
  ) {
    super({
      eventName: 'admin.users_bulk_updated',
      aggregateId: adminId, // Use adminId as the "actor"
      payload: payload,
    });
  }
}
