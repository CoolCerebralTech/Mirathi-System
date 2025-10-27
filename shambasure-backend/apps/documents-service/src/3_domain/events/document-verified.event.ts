export interface DocumentVerifiedPayload {
  aggregateId: string; // documentId
  filename: string;
  category: string;
  uploaderId: string;
  uploadedBy: string; // User's full name
  verifiedBy: string; // Verifier user ID
  verifiedByName: string; // Verifier's full name
  verifiedAt: Date;
  assetId?: string;
  willId?: string;
}

/**
 * Event emitted when a document is verified by VERIFIER or ADMIN.
 *
 * SUBSCRIBERS:
 * - notifications-service: Notify user their document was approved
 * - succession-service: Link verified document to asset/will
 * - auditing-service: Log verification action
 */
export class DocumentVerifiedEvent extends DomainEvent {
  constructor(public readonly payload: DocumentVerifiedPayload) {
    super(payload.aggregateId);
  }

  getEventName(): string {
    return 'document.verified';
  }
}
