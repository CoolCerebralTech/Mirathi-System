import { AggregateRoot } from '@nestjs/cqrs';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';
import { AssetAddedEvent } from '../events/asset-added.event';
import { AssetUpdatedEvent } from '../events/asset-updated.event';

export interface AssetLocation {
  county: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface AssetIdentification {
  registrationNumber?: string;
  serialNumber?: string;
  accountNumber?: string;
  parcelNumber?: string; // For land
  vehicleRegistration?: string; // For cars
  otherIdentifiers?: Record<string, string>;
}

export class Asset extends AggregateRoot {
  private id: string;
  private name: string;
  private description: string;
  private type: AssetType;
  private ownerId: string;
  private ownershipType: AssetOwnershipType;
  private ownershipShare: number; // 0-100%
  private currentValue: AssetValue;
  private location: AssetLocation | null;
  private identification: AssetIdentification | null;

  // Status Flags
  private hasVerifiedDocument: boolean;
  private isEncumbered: boolean;
  private encumbranceDetails: string | null;
  private isActive: boolean;

  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Private constructor enforces use of static factory method
  private constructor(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    currentValue: AssetValue,
  ) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.ownerId = ownerId;
    this.currentValue = currentValue;

    // Defaults
    this.description = '';
    this.ownershipType = AssetOwnershipType.SOLE;
    this.ownershipShare = 100;
    this.location = null;
    this.identification = null;
    this.hasVerifiedDocument = false;
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHOD (Creation)
  // --------------------------------------------------------------------------
  static create(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    value: AssetValue,
  ): Asset {
    if (!name.trim()) {
      throw new Error('Asset name is required');
    }

    const asset = new Asset(id, name, type, ownerId, value);

    // Domain Event: Asset Created
    asset.apply(new AssetAddedEvent(id, ownerId, type, value));

    return asset;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

  updateDetails(name: string, description: string): void {
    if (!name.trim()) {
      throw new Error('Asset name cannot be empty');
    }
    this.name = name.trim();
    this.description = description.trim();
    this.updatedAt = new Date();
    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  updateValue(newValue: AssetValue): void {
    // AssetValue VO handles negative checks internally
    this.currentValue = newValue;
    this.updatedAt = new Date();
    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  updateOwnership(ownershipType: AssetOwnershipType, share: number): void {
    if (share < 0 || share > 100) {
      throw new Error('Ownership share must be between 0 and 100');
    }

    if (ownershipType === AssetOwnershipType.SOLE && share !== 100) {
      throw new Error('Sole ownership requires a 100% share');
    }

    this.ownershipType = ownershipType;
    this.ownershipShare = share;
    this.updatedAt = new Date();
    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  setLocation(location: AssetLocation): void {
    if (location.county) {
      // Validate against Single Source of Truth
      const validCounties = KENYAN_COUNTIES_LIST as readonly string[];
      if (!validCounties.includes(location.county.toUpperCase())) {
        throw new Error(`Invalid Kenyan county: ${location.county}`);
      }
    }
    this.location = { ...location };
    this.updatedAt = new Date();
  }

  setIdentification(identification: AssetIdentification): void {
    this.identification = { ...identification };
    this.updatedAt = new Date();
  }

  markAsVerified(): void {
    this.hasVerifiedDocument = true;
    this.updatedAt = new Date();
  }

  markAsUnverified(): void {
    this.hasVerifiedDocument = false;
    this.updatedAt = new Date();
  }

  addEncumbrance(details: string): void {
    if (!details.trim()) throw new Error('Encumbrance details required');
    this.isEncumbered = true;
    this.encumbranceDetails = details;
    this.updatedAt = new Date();
  }

  removeEncumbrance(): void {
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.updatedAt = new Date();
  }

  updateMetadata(): void {
    this.updatedAt = new Date();
  }

  softDelete(): void {
    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS & COMPUTED PROPERTIES
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string {
    return this.description;
  }
  getType(): AssetType {
    return this.type;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getOwnershipType(): AssetOwnershipType {
    return this.ownershipType;
  }
  getOwnershipShare(): number {
    return this.ownershipShare;
  }
  getCurrentValue(): AssetValue {
    return this.currentValue;
  }
  getLocation(): AssetLocation | null {
    return this.location ? { ...this.location } : null;
  }
  getIdentification(): AssetIdentification | null {
    return this.identification ? { ...this.identification } : null;
  }

  getHasVerifiedDocument(): boolean {
    return this.hasVerifiedDocument;
  }
  getIsEncumbered(): boolean {
    return this.isEncumbered;
  }
  getEncumbranceDetails(): string | null {
    return this.encumbranceDetails;
  }

  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }
  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }
  getDeletedAt(): Date | null {
    return this.deletedAt ? new Date(this.deletedAt) : null;
  }

  // --------------------------------------------------------------------------
  // DOMAIN LOGIC
  // --------------------------------------------------------------------------

  isFullyOwned(): boolean {
    return this.ownershipType === AssetOwnershipType.SOLE && this.ownershipShare === 100;
  }

  canBeTransferred(): boolean {
    // Must be active, unencumbered, and verified
    return this.isActive && !this.isEncumbered && this.hasVerifiedDocument;
  }

  /**
   * Returns the monetary value of the share owned by this user.
   */
  getTransferableValue(): AssetValue {
    if (!this.canBeTransferred()) {
      throw new Error(
        'Asset cannot be transferred due to status, encumbrances, or missing documentation',
      );
    }

    // Calculate share amount based on percentage
    const totalAmount = this.currentValue.getAmount();
    const transferableAmount = totalAmount * (this.ownershipShare / 100);

    return new AssetValue(
      transferableAmount,
      this.currentValue.getCurrency(),
      this.currentValue.getValuationDate(),
    );
  }
}
