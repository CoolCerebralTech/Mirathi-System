export enum AssetCategory {
  LAND = 'LAND',
  PROPERTY = 'PROPERTY',
  VEHICLE = 'VEHICLE',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  INVESTMENT = 'INVESTMENT',
  BUSINESS = 'BUSINESS',
  LIVESTOCK = 'LIVESTOCK',
  PERSONAL_EFFECTS = 'PERSONAL_EFFECTS',
  OTHER = 'OTHER',
}

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  VERIFIED = 'VERIFIED',
  ENCUMBERED = 'ENCUMBERED',
  DISPUTED = 'DISPUTED',
  LIQUIDATED = 'LIQUIDATED',
}

export interface AssetProps {
  id: string;
  estateId: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  estimatedValue: number;
  currency: string;
  isVerified: boolean;
  proofDocumentUrl?: string;
  isEncumbered: boolean;
  encumbranceDetails?: string;
  purchaseDate?: Date;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Asset {
  private constructor(private props: AssetProps) {}

  static create(
    estateId: string,
    name: string,
    category: AssetCategory,
    estimatedValue: number,
    description?: string,
  ): Asset {
    if (estimatedValue < 0) {
      throw new Error('Asset value cannot be negative');
    }

    return new Asset({
      id: crypto.randomUUID(),
      estateId,
      name,
      description,
      category,
      status: AssetStatus.ACTIVE,
      estimatedValue,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: AssetProps): Asset {
    return new Asset(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get name(): string {
    return this.props.name;
  }
  get category(): AssetCategory {
    return this.props.category;
  }
  get estimatedValue(): number {
    return this.props.estimatedValue;
  }
  get isVerified(): boolean {
    return this.props.isVerified;
  }
  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  }
  get status(): AssetStatus {
    return this.props.status;
  }

  // Business Logic
  updateValue(newValue: number): void {
    if (newValue < 0) {
      throw new Error('Asset value cannot be negative');
    }
    this.props.estimatedValue = newValue;
    this.props.updatedAt = new Date();
  }

  verify(proofDocumentUrl: string): void {
    this.props.isVerified = true;
    this.props.proofDocumentUrl = proofDocumentUrl;
    this.props.status = AssetStatus.VERIFIED;
    this.props.updatedAt = new Date();
  }

  encumber(details: string): void {
    this.props.isEncumbered = true;
    this.props.encumbranceDetails = details;
    this.props.status = AssetStatus.ENCUMBERED;
    this.props.updatedAt = new Date();
  }

  dispute(): void {
    this.props.status = AssetStatus.DISPUTED;
    this.props.updatedAt = new Date();
  }

  toJSON(): AssetProps {
    return { ...this.props };
  }
}
