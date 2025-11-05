import { DocumentId, UserId, DocumentStatus, RejectionReason } from '../value-objects';
import { VerificationAttemptId } from '../value-objects';

// ============================================================================
// Domain Errors
// ============================================================================
export class VerificationAttemptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationAttemptError';
  }
}

// ============================================================================
// Document Verification Attempt Entity Properties Interface
// ============================================================================
export interface DocumentVerificationAttemptProps {
  id: VerificationAttemptId;
  documentId: DocumentId;
  verifierId: UserId;
  status: DocumentStatus;
  reason: RejectionReason | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

// ============================================================================
// Document Verification Attempt Entity
// ============================================================================
export class DocumentVerificationAttempt {
  private readonly _id: VerificationAttemptId;
  private readonly _documentId: DocumentId;
  private readonly _verifierId: UserId;
  private readonly _status: DocumentStatus;
  private readonly _reason: RejectionReason | null;
  private readonly _metadata: Record<string, any> | null;
  private readonly _createdAt: Date;

  private constructor(props: DocumentVerificationAttemptProps) {
    this._id = props.id;
    this._documentId = props.documentId;
    this._verifierId = props.verifierId;
    this._status = props.status;
    this._reason = props.reason;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  static createVerified(props: {
    documentId: DocumentId;
    verifierId: UserId;
    metadata?: Record<string, any>;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: VerificationAttemptId.generate<VerificationAttemptId>(),
      documentId: props.documentId,
      verifierId: props.verifierId,
      status: DocumentStatus.createVerified(),
      reason: null,
      metadata: props.metadata ?? null,
      createdAt: new Date(),
    });
  }

  static createRejected(props: {
    documentId: DocumentId;
    verifierId: UserId;
    reason: RejectionReason;
    metadata?: Record<string, any>;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: VerificationAttemptId.generate<VerificationAttemptId>(),
      documentId: props.documentId,
      verifierId: props.verifierId,
      status: DocumentStatus.createRejected(),
      reason: props.reason,
      metadata: props.metadata ?? null,
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: {
    id: string;
    documentId: string;
    verifierId: string;
    status: string; // e.g., 'VERIFIED'
    reason: string | null;
    metadata: Record<string, any> | null;
    createdAt: Date;
  }): DocumentVerificationAttempt {
    return new DocumentVerificationAttempt({
      id: new VerificationAttemptId(props.id),
      documentId: new DocumentId(props.documentId),
      verifierId: new UserId(props.verifierId),
      status: DocumentStatus.create(props.status),
      reason: props.reason ? RejectionReason.create(props.reason) : null,
      metadata: props.metadata,
      createdAt: props.createdAt,
    });
  }

  // ============================================================================
  // Public API & Query Methods
  // ============================================================================
  isSuccessful(): boolean {
    return this._status.isVerified();
  }

  isRejection(): boolean {
    return this._status.isRejected();
  }

  wasMadeBy(verifierId: UserId): boolean {
    return this._verifierId.equals(verifierId);
  }

  // ============================================================================
  // Getters
  // ============================================================================
  get id(): VerificationAttemptId {
    return this._id;
  }
  get documentId(): DocumentId {
    return this._documentId;
  }
  get verifierId(): UserId {
    return this._verifierId;
  }
  get status(): DocumentStatus {
    return this._status;
  }
  get reason(): RejectionReason | null {
    return this._reason;
  }
  get metadata(): Record<string, any> | null {
    return this._metadata;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
