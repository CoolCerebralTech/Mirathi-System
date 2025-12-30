// ============================================================================
// Custom Domain Error
// ============================================================================
export class InvalidDocumentStatusError extends Error {
  constructor(status: string) {
    super(`Invalid document status provided: ${status}`);
    this.name = 'InvalidDocumentStatusError';
  }
}

// ============================================================================
// Enum & Value Object
// ============================================================================

export enum DocumentStatusEnum {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class DocumentStatus {
  private constructor(private readonly _value: DocumentStatusEnum) {
    // Validation is now part of the constructor, called once.
  }

  // =====================================================
  // ✅ Static Factory
  // =====================================================
  static create(value: string | DocumentStatusEnum): DocumentStatus {
    const enumValue =
      typeof value === 'string'
        ? DocumentStatusEnum[value as keyof typeof DocumentStatusEnum]
        : value;

    // The validation is now centralized in the constructor via the private validate method.
    // We just need to check if the conversion from string was successful.
    if (!enumValue || !Object.values(DocumentStatusEnum).includes(enumValue)) {
      throw new InvalidDocumentStatusError(String(value));
    }

    return new DocumentStatus(enumValue);
  }

  static createPending(): DocumentStatus {
    return new DocumentStatus(DocumentStatusEnum.PENDING_VERIFICATION);
  }

  static createVerified(): DocumentStatus {
    return new DocumentStatus(DocumentStatusEnum.VERIFIED);
  }

  static createRejected(): DocumentStatus {
    return new DocumentStatus(DocumentStatusEnum.REJECTED);
  }

  // =====================================================
  // ✅ Accessor
  // =====================================================
  get value(): DocumentStatusEnum {
    return this._value;
  }

  // =====================================================
  // ✅ Query Helpers
  // =====================================================
  isPendingVerification(): boolean {
    return this._value === DocumentStatusEnum.PENDING_VERIFICATION;
  }

  isVerified(): boolean {
    return this._value === DocumentStatusEnum.VERIFIED;
  }

  isRejected(): boolean {
    return this._value === DocumentStatusEnum.REJECTED;
  }

  // =====================================================
  // ✅ Transition Rules
  // =====================================================
  canTransitionTo(newStatus: DocumentStatus): boolean {
    const allowedTransitions: Record<DocumentStatusEnum, DocumentStatusEnum[]> = {
      [DocumentStatusEnum.PENDING_VERIFICATION]: [
        DocumentStatusEnum.VERIFIED,
        DocumentStatusEnum.REJECTED,
      ],
      // VERIFIED is a terminal state for this lifecycle
      [DocumentStatusEnum.VERIFIED]: [],
      // A REJECTED document can be re-submitted for verification
      [DocumentStatusEnum.REJECTED]: [DocumentStatusEnum.PENDING_VERIFICATION],
    };

    return allowedTransitions[this._value].includes(newStatus.value);
  }

  // =====================================================
  // ✅ Equality
  // =====================================================
  equals(other: DocumentStatus): boolean {
    return this._value === other._value;
  }
}
