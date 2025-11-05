/**
 * DocumentVerificationAttempt Entity - Persistence Layer
 *
 * Represents the document_verification_attempts table structure.
 * Immutable audit trail of verification decisions.
 */
export interface DocumentVerificationAttemptEntity {
  id: string;
  documentId: string;
  verifierId: string;
  status: string; // 'VERIFIED' or 'REJECTED'
  reason: string | null;
  metadata: any | null; // JSON field for additional verification context
  createdAt: Date;
}

/**
 * Create input for new verification attempts
 */
export type CreateDocumentVerificationAttemptEntity = Omit<
  DocumentVerificationAttemptEntity,
  'createdAt'
>;
