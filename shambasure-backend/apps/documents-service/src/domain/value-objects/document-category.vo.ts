export enum DocumentCategoryEnum {
  LAND_OWNERSHIP = 'LAND_OWNERSHIP',
  IDENTITY_PROOF = 'IDENTITY_PROOF',
  SUCCESSION_DOCUMENT = 'SUCCESSION_DOCUMENT',
  FINANCIAL_PROOF = 'FINANCIAL_PROOF',
  OTHER = 'OTHER',
}

export class DocumentCategory {
  constructor(private readonly _value: DocumentCategoryEnum) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(DocumentCategoryEnum).includes(this._value)) {
      throw new Error('Invalid document category');
    }
  }

  get value(): DocumentCategoryEnum {
    return this._value;
  }

  isIdentityProof(): boolean {
    return this._value === DocumentCategoryEnum.IDENTITY_PROOF;
  }

  isLandOwnership(): boolean {
    return this._value === DocumentCategoryEnum.LAND_OWNERSHIP;
  }

  equals(other: DocumentCategory): boolean {
    return this._value === other._value;
  }

  /** ✅ Factory methods */
  static create(value: string | DocumentCategoryEnum): DocumentCategory {
    if (typeof value === 'string') {
      if (!Object.values(DocumentCategoryEnum).includes(value as DocumentCategoryEnum)) {
        throw new Error(`Invalid document category: ${value}`);
      }
      return new DocumentCategory(value as DocumentCategoryEnum);
    }

    return new DocumentCategory(value);
  }

  static fromString(value: string): DocumentCategory {
    return this.create(value);
  }
}
