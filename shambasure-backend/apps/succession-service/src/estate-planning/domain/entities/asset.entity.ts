import { AggregateRoot } from '@nestjs/cqrs';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { LandParcel } from '../value-objects/land-parcel.vo';
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
  parcelNumber?: string;
  vehicleRegistration?: string;
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
  private hasVerifiedDocument: boolean;
  private isEncumbered: boolean;
  private encumbranceDetails: string | null;
  private metadata: Record<string, any> | null;
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  constructor(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    currentValue: AssetValue,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.ownerId = ownerId;
    this.currentValue = currentValue;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Default values
    this.description = '';
    this.ownershipType = AssetOwnershipType.SOLE;
    this.ownershipShare = 100;
    this.location = null;
    this.identification = null;
    this.hasVerifiedDocument = false;
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.metadata = null;
    this.isActive = true;
    this.deletedAt = null;
  }

  // Getters
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
  getMetadata(): Record<string, any> | null {
    return this.metadata ? { ...this.metadata } : null;
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

  // Business methods
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
    if (newValue.getAmount() < 0) {
      throw new Error('Asset value cannot be negative');
    }

    this.currentValue = newValue;
    this.updatedAt = new Date();

    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  updateOwnership(ownershipType: AssetOwnershipType, share: number): void {
    if (share < 0 || share > 100) {
      throw new Error('Ownership share must be between 0 and 100');
    }

    this.ownershipType = ownershipType;
    this.ownershipShare = share;
    this.updatedAt = new Date();

    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  setLocation(location: AssetLocation): void {
    if (location.county && !LandParcel.isValidCounty(location.county)) {
      throw new Error('Invalid Kenyan county');
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
    this.isEncumbered = true;
    this.encumbranceDetails = details;
    this.updatedAt = new Date();
  }

  removeEncumbrance(): void {
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.updatedAt = new Date();
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...metadata };
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

  // Business rules
  isFullyOwned(): boolean {
    return this.ownershipType === AssetOwnershipType.SOLE && this.ownershipShare === 100;
  }

  canBeTransferred(): boolean {
    return this.isActive && !this.isEncumbered && this.hasVerifiedDocument;
  }

  getTransferableValue(): AssetValue {
    if (!this.canBeTransferred()) {
      throw new Error('Asset cannot be transferred due to encumbrances or missing documentation');
    }

    const transferableAmount = this.currentValue.getAmount() * (this.ownershipShare / 100);
    return new AssetValue(
      transferableAmount,
      this.currentValue.getCurrency(),
      this.currentValue.getValuationDate(),
    );
  }

  // Static factory method
  static create(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    value: AssetValue,
  ): Asset {
    const asset = new Asset(id, name, type, ownerId, value);
    asset.apply(new AssetAddedEvent(id, ownerId, type, value));
    return asset;
  }
}
