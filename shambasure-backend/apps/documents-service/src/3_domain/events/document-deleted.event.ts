export interface DocumentDeletedPayload {
  aggregateId: string; // documentId
  filename: string;
  uploaderId: string;
  deletedBy: string; // Admin who deleted (can be same as uploaderId)
  deletedAt: Date;
  reason?: string;
}

/**
 * Event emitted when a document is soft-deleted.
 * 
 * SUBSCRIBERS:
 * - auditing-service: Log deletion action
 * - notifications-service: Notify user if deleted by admin
 */
export class DocumentDeletedEvent extends DomainEvent {
  constructor(public readonly payload: DocumentDeletedPayload) {
    super(payload.aggregateId);
  }

  getEventName(): string {
    return 'document.deleted';
  }
}
