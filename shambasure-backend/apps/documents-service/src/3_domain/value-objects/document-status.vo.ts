export enum DocumentStatusEnum {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export class DocumentStatus {
  constructor(private readonly _value: DocumentStatusEnum) {
    this.validate();
  }

  // =====================================================
  // ✅ Static Factory
  // =====================================================
  static create(value: string | DocumentStatusEnum): DocumentStatus {
    const enumValue =
      typeof value === 'string'
        ? DocumentStatusEnum[value as keyof typeof DocumentStatusEnum]
        : value;

    if (!enumValue) {
      throw new Error(`Invalid document status: ${value}`);
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
  // ✅ Validation
  // =====================================================
  private validate(): void {
    if (!Object.values(DocumentStatusEnum).includes(this._value)) {
      throw new Error(`Invalid document status: ${this._value}`);
    }
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
      [DocumentStatusEnum.VERIFIED]: [],
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
