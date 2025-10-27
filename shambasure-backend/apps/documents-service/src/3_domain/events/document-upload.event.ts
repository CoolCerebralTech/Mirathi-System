export interface DocumentUploadedPayload {
  aggregateId: string; // documentId
  filename: string;
  category: string; // DocumentCategory enum value
  sizeBytes: number;
  uploaderId: string;
  uploadedBy: string; // User's full name
  assetId?: string;
  willId?: string;
}

/**
 * Event emitted when a document is successfully uploaded.
 *
 * SUBSCRIBERS:
 * - notifications-service: Send upload confirmation to user
 * - auditing-service: Log the upload action
 */
export class DocumentUploadedEvent extends DomainEvent {
  constructor(public readonly payload: DocumentUploadedPayload) {
    super(payload.aggregateId);
  }

  getEventName(): string {
    return 'document.uploaded';
  }
}
