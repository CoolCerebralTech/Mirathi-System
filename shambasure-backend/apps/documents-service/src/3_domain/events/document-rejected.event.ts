export interface DocumentRejectedPayload {
  aggregateId: string; // documentId
  filename: string;
  category: string;
  uploaderId: string;
  uploadedBy: string; // User's full name
  rejectedBy: string; // Verifier user ID
  rejectedByName: string; // Verifier's full name
  rejectionReason: string;
  rejectedAt: Date;
}

/**
 * Event emitted when a document is rejected during verification.
 *
 * SUBSCRIBERS:
 * - notifications-service: Notify user with rejection reason
 * - auditing-service: Log rejection action
 */
export class DocumentRejectedEvent extends DomainEvent {
  constructor(public readonly payload: DocumentRejectedPayload) {
    super(payload.aggregateId);
  }

  getEventName(): string {
    return 'document.rejected';
  }
}
