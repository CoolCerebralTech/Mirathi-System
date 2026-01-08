// =============================================================================
// DOMAIN ENTITY: ASSET
// =============================================================================
import {
  AssetCategory,
  AssetStatus,
  KenyanCounty,
  LandCategory,
  VehicleCategory,
} from '@prisma/client';

// --- Value Objects / Interfaces ---

export interface LandDetailsProps {
  titleDeedNumber: string;
  parcelNumber?: string;
  county: KenyanCounty;
  subCounty?: string;
  landCategory: LandCategory;
  sizeInAcres?: number;
}

export interface VehicleDetailsProps {
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  vehicleCategory: VehicleCategory;
}

export interface AssetProps {
  id: string;
  estateId: string;
  name: string;
  description?: string;
  category: AssetCategory;
  status: AssetStatus;
  estimatedValue: number; // Domain uses number, Persistence uses Decimal
  currency: string;

  // Verification & Encumbrance
  isVerified: boolean;
  proofDocumentUrl?: string;
  isEncumbered: boolean;
  encumbranceDetails?: string;

  // Polymorphic Details
  landDetails?: LandDetailsProps;
  vehicleDetails?: VehicleDetailsProps;

  // Metadata
  purchaseDate?: Date;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Asset {
  private constructor(private props: AssetProps) {}

  // --- FACTORY METHODS (The "Smart Constructor" Pattern) ---

  /**
   * Generic Asset Factory (Bank accounts, Furniture, etc.)
   */
  static create(
    estateId: string,
    name: string,
    category: AssetCategory,
    estimatedValue: number,
    description?: string,
  ): Asset {
    this.validateValue(estimatedValue);

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

  /**
   * Specialized Land Factory - Enforces Title Deed & County
   */
  static createLand(
    estateId: string,
    estimatedValue: number,
    details: LandDetailsProps,
    description?: string,
  ): Asset {
    this.validateValue(estimatedValue);

    // Auto-generate name based on legal description
    const name = `Land: ${details.titleDeedNumber} (${details.county})`;

    return new Asset({
      id: crypto.randomUUID(),
      estateId,
      name, // Standardized naming
      description: description || `Parcel ${details.parcelNumber ?? 'N/A'}`,
      category: AssetCategory.LAND,
      status: AssetStatus.ACTIVE,
      estimatedValue,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      landDetails: details, // Store details
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Specialized Vehicle Factory - Enforces Registration Number
   */
  static createVehicle(
    estateId: string,
    estimatedValue: number,
    details: VehicleDetailsProps,
    description?: string,
  ): Asset {
    this.validateValue(estimatedValue);

    // Auto-generate name: "Toyota Corolla (KCA 123B)"
    const name = `${details.make} ${details.model} (${details.registrationNumber})`;

    return new Asset({
      id: crypto.randomUUID(),
      estateId,
      name,
      description: description || `Year: ${details.year ?? 'Unknown'}`,
      category: AssetCategory.VEHICLE,
      status: AssetStatus.ACTIVE,
      estimatedValue,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      vehicleDetails: details,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: AssetProps): Asset {
    return new Asset(props);
  }

  // --- GETTERS (Added these to fix your errors) ---
  get id(): string {
    return this.props.id;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get name(): string {
    return this.props.name;
  } // Added
  get description(): string | undefined {
    return this.props.description;
  } // Added
  get category(): AssetCategory {
    return this.props.category;
  }
  get status(): AssetStatus {
    return this.props.status;
  }
  get estimatedValue(): number {
    return this.props.estimatedValue;
  }
  get currency(): string {
    return this.props.currency;
  } // Added
  get isVerified(): boolean {
    return this.props.isVerified;
  } // Added
  get proofDocumentUrl(): string | undefined {
    return this.props.proofDocumentUrl;
  } // Added
  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  } // Added
  get landDetails(): LandDetailsProps | undefined {
    return this.props.landDetails;
  }
  get vehicleDetails(): VehicleDetailsProps | undefined {
    return this.props.vehicleDetails;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // --- BUSINESS LOGIC ---

  private static validateValue(val: number) {
    if (val < 0) throw new Error('Asset value cannot be negative');
  }

  /**
   * Updates value and timestamps.
   * Logic: If value changes significantly (>20%), verification might need reset.
   */
  updateValue(newValue: number): void {
    Asset.validateValue(newValue);
    this.props.estimatedValue = newValue;
    this.props.updatedAt = new Date();
  }

  verify(proofDocumentUrl: string): void {
    if (!proofDocumentUrl) throw new Error('Proof document required for verification');
    this.props.isVerified = true;
    this.props.proofDocumentUrl = proofDocumentUrl;
    this.props.status = AssetStatus.VERIFIED;
    this.props.updatedAt = new Date();
  }

  encumber(details: string): void {
    this.props.isEncumbered = true;
    this.props.encumbranceDetails = details;
    this.props.status = AssetStatus.ENCUMBERED; // e.g., Has a mortgage
    this.props.updatedAt = new Date();
  }

  toJSON(): AssetProps {
    return { ...this.props };
  }
}
