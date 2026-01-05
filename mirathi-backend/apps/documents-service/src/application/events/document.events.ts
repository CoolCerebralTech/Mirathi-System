// apps/documents-service/src/application/events/document.events.ts

/**
 * Domain Events - Published to RabbitMQ
 * Other services listen to these events
 */

export class DocumentUploadedEvent {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly uploadedAt: Date,
  ) {}
}

export class DocumentVerifiedEvent {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly referenceNumber: string,
    public readonly referenceType: string,
    public readonly encryptedReference: string,
    public readonly verifiedBy: string,
    public readonly verifiedAt: Date,
  ) {}
}

export class DocumentRejectedEvent {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly rejectionReason: string,
    public readonly rejectedBy: string,
    public readonly rejectedAt: Date,
  ) {}
}

export class DocumentExpiredEvent {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly expiredAt: Date,
  ) {}
}
