export interface DocumentVersionedPayload {
  aggregateId: string; // documentId
  versionNumber: number;
  filename: string;
  sizeBytes: number;
  uploaderId: string;
  uploadedBy: string;
  changeNote?: string;
}

/**
 * Event emitted when a new version of a document is uploaded.
 * 
 * SUBSCRIBERS:
 * - notifications-service: Notify user about version update
 * - auditing-service: Log version creation
 */
export class DocumentVersionedEvent extends DomainEvent {
  constructor(public readonly payload: DocumentVersionedPayload) {
    super(payload.aggregateId);
  }

  getEventName(): string {
    return 'document.versioned';
  }
}
