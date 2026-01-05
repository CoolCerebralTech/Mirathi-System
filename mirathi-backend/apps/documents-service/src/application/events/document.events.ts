import { v4 as uuidv4 } from 'uuid';

import { BaseEvent, ShambaEvents } from '@shamba/messaging';

/**
 * Abstract implementation to satisfy BaseEvent interface requirements
 */
export abstract class DomainEvent<T> implements BaseEvent<T> {
  constructor(
    public readonly eventType: ShambaEvents,
    public readonly payload: T,
    public readonly correlationId: string = uuidv4(),
    public readonly timestamp: string = new Date().toISOString(),
    public readonly userId?: string,
  ) {}
}

// --- Uploaded ---
export interface DocumentUploadedPayload {
  documentId: string;
  uploaderId: string;
  documentName: string;
  uploadedAt: Date;
}

export class DocumentUploadedEvent extends DomainEvent<DocumentUploadedPayload> {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly uploadedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.DOCUMENTS_DOCUMENT_UPLOADED, // Updated Key
      { documentId, uploaderId, documentName, uploadedAt },
      correlationId,
      timestamp,
      uploaderId,
    );
  }
}

// --- Verified ---
export interface DocumentVerifiedPayload {
  documentId: string;
  uploaderId: string;
  documentName: string;
  referenceNumber: string;
  referenceType: string;
  encryptedReference: string;
  verifiedBy: string;
  verifiedAt: Date;
}

export class DocumentVerifiedEvent extends DomainEvent<DocumentVerifiedPayload> {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly referenceNumber: string,
    public readonly referenceType: string,
    public readonly encryptedReference: string,
    public readonly verifiedBy: string,
    public readonly verifiedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.DOCUMENTS_DOCUMENT_VERIFIED, // Updated Key
      {
        documentId,
        uploaderId,
        documentName,
        referenceNumber,
        referenceType,
        encryptedReference,
        verifiedBy,
        verifiedAt,
      },
      correlationId,
      timestamp,
      verifiedBy,
    );
  }
}

// --- Rejected ---
export interface DocumentRejectedPayload {
  documentId: string;
  uploaderId: string;
  documentName: string;
  rejectionReason: string;
  rejectedBy: string;
  rejectedAt: Date;
}

export class DocumentRejectedEvent extends DomainEvent<DocumentRejectedPayload> {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly documentName: string,
    public readonly rejectionReason: string,
    public readonly rejectedBy: string,
    public readonly rejectedAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.DOCUMENTS_DOCUMENT_REJECTED, // Updated Key
      { documentId, uploaderId, documentName, rejectionReason, rejectedBy, rejectedAt },
      correlationId,
      timestamp,
      rejectedBy,
    );
  }
}

// --- Expired ---
export interface DocumentExpiredPayload {
  documentId: string;
  uploaderId: string;
  expiredAt: Date;
}

export class DocumentExpiredEvent extends DomainEvent<DocumentExpiredPayload> {
  constructor(
    public readonly documentId: string,
    public readonly uploaderId: string,
    public readonly expiredAt: Date,
    correlationId?: string,
    timestamp?: string,
  ) {
    super(
      ShambaEvents.DOCUMENTS_DOCUMENT_EXPIRED, // Updated Key
      { documentId, uploaderId, expiredAt },
      correlationId,
      timestamp,
      'system',
    );
  }
}
