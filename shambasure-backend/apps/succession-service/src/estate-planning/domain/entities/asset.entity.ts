import { AggregateRoot } from '@nestjs/cqrs';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';
import { AssetAddedEvent } from '../events/asset-added.event';
import { AssetUpdatedEvent } from '../events/asset-updated.event';
import { AssetValuationUpdatedEvent } from '../events/asset-valuation-updated.event';
import { AssetVerifiedEvent } from '../events/asset-verified.event';
import { AssetEncumberedEvent } from '../events/asset-encumbered.event';

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

// Interface for AssetValue data structure
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

// Interface for reconstitute method to fix TypeScript errors
export interface AssetReconstituteProps {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  ownerId: string;
  ownershipType: AssetOwnershipType;
  ownershipShare: number;
  currentValue: AssetValueData | AssetValue;
  location: AssetLocation | null;
  identification: AssetIdentification | null;
  hasVerifiedDocument: boolean;
  isEncumbered: boolean;
  encumbranceDetails: string | null;
  encumbranceAmount: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

export class Asset extends AggregateRoot {
  // Properties
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
  private encumbranceAmount: number; // Added to track liability
  private isActive: boolean;

  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Private constructor enforces use of static factory methods
  private constructor(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    currentValue: AssetValue,
    ownershipType: AssetOwnershipType = AssetOwnershipType.SOLE,
    ownershipShare: number = 100,
  ) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.ownerId = ownerId;
    this.currentValue = currentValue;
    this.ownershipType = ownershipType;
    this.ownershipShare = ownershipShare;

    // Defaults
    this.description = '';
    this.location = null;
    this.identification = null;
    this.hasVerifiedDocument = false;
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.encumbranceAmount = 0;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // 1. FACTORY METHODS
  // --------------------------------------------------------------------------

  /**
   * Create a new Asset (Lifecycle Start)
   */
  static create(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    value: AssetValue,
    ownershipType: AssetOwnershipType = AssetOwnershipType.SOLE,
    ownershipShare: number = 100,
  ): Asset {
    if (!name.trim()) throw new Error('Asset name is required');
    if (ownershipShare < 0 || ownershipShare > 100) throw new Error('Share must be 0-100%');

    const asset = new Asset(id, name, type, ownerId, value, ownershipType, ownershipShare);

    // Trigger Event (Correctly matching the updated event signature)
    asset.apply(new AssetAddedEvent(id, ownerId, type, ownershipType, value, new Date()));

    return asset;
  }

  /**
   * Rehydrate from Database (No Events)
   */
  static reconstitute(props: AssetReconstituteProps): Asset {
    // Reconstruct AssetValue first
    const currentValue = Asset.reconstructAssetValue(props.currentValue);

    const asset = new Asset(
      props.id,
      props.name,
      props.type,
      props.ownerId,
      currentValue,
      props.ownershipType,
      props.ownershipShare,
    );

    // Hydrate properties safely with proper typing
    asset.description = props.description;
    asset.location = props.location ? { ...props.location } : null;
    asset.identification = props.identification ? { ...props.identification } : null;
    asset.hasVerifiedDocument = props.hasVerifiedDocument;
    asset.isEncumbered = props.isEncumbered;
    asset.encumbranceDetails = props.encumbranceDetails;
    asset.encumbranceAmount = props.encumbranceAmount;
    asset.isActive = props.isActive;

    // Handle date conversions safely
    asset.createdAt = new Date(props.createdAt);
    asset.updatedAt = new Date(props.updatedAt);
    asset.deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    return asset;
  }

  /**
   * Helper method to reconstruct AssetValue from raw data or existing instance
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    // Handle raw data object
    const valuationDate =
      typeof valueData.valuationDate === 'string'
        ? new Date(valueData.valuationDate)
        : valueData.valuationDate;

    return new AssetValue(valueData.amount, valueData.currency, valuationDate);
  }

  // --------------------------------------------------------------------------
  // 2. BUSINESS LOGIC & MUTATORS
  // --------------------------------------------------------------------------

  updateDetails(name: string, description: string): void {
    if (!name.trim()) throw new Error('Asset name cannot be empty');
    this.name = name.trim();
    this.description = description.trim();
    this.updatedAt = new Date();
    this.apply(new AssetUpdatedEvent(this.id, this.ownerId));
  }

  updateValue(newValue: AssetValue, reason: string = 'Manual Update'): void {
    const oldValue = this.currentValue;
    this.currentValue = newValue;
    this.updatedAt = new Date();

    // Trigger Specific Valuation Event
    this.apply(new AssetValuationUpdatedEvent(this.id, this.ownerId, oldValue, newValue, reason));
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

  markAsVerified(documentId: string, verifiedBy: string): void {
    this.hasVerifiedDocument = true;
    this.updatedAt = new Date();
    this.apply(new AssetVerifiedEvent(this.id, documentId, verifiedBy));
  }

  markAsUnverified(): void {
    this.hasVerifiedDocument = false;
    this.updatedAt = new Date();
  }

  addEncumbrance(details: string, amount: number): void {
    if (!details.trim()) throw new Error('Encumbrance details required');
    if (amount < 0) throw new Error('Encumbrance amount cannot be negative');

    this.isEncumbered = true;
    this.encumbranceDetails = details;
    this.encumbranceAmount = amount;
    this.updatedAt = new Date();

    this.apply(new AssetEncumberedEvent(this.id, this.ownerId, details, amount));
  }

  removeEncumbrance(): void {
    this.isEncumbered = false;
    this.encumbranceDetails = null;
    this.encumbranceAmount = 0;
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
  // 3. GETTERS (Standard)
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

  getEncumbranceAmount(): number {
    return this.encumbranceAmount;
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
  // 4. DOMAIN LOGIC
  // --------------------------------------------------------------------------

  isFullyOwned(): boolean {
    return this.ownershipType === AssetOwnershipType.SOLE && this.ownershipShare === 100;
  }

  canBeTransferred(): boolean {
    // Must be active, unencumbered (or have less debt than value), and verified
    // Note: Technically you CAN transfer encumbered land with bank consent, but for now we flag it.
    return this.isActive && this.hasVerifiedDocument;
  }

  /**
   * Returns the Net Equity Value of the share owned by this user.
   * Formula: (TotalValue * Share%) - (EncumbranceAmount * Share%)
   */
  getTransferableValue(): AssetValue {
    if (!this.isActive) {
      throw new Error('Asset is inactive/deleted');
    }

    const totalAmount = this.currentValue.getAmount();
    const shareFraction = this.ownershipShare / 100;

    // Gross Share Value
    const grossShareValue = totalAmount * shareFraction;

    // Liability Share (Assumption: Liability is shared proportionally)
    const liabilityShare = this.encumbranceAmount * shareFraction;

    // Net Value
    const netValue = Math.max(0, grossShareValue - liabilityShare);

    return new AssetValue(
      netValue,
      this.currentValue.getCurrency(),
      this.currentValue.getValuationDate(),
    );
  }

  /**
   * Returns the net equity value (total value minus encumbrance)
   */
  getNetValue(): AssetValue {
    const netValue = Math.max(0, this.currentValue.getAmount() - this.encumbranceAmount);

    return new AssetValue(
      netValue,
      this.currentValue.getCurrency(),
      this.currentValue.getValuationDate(),
    );
  }

  /**
   * Checks if the asset has sufficient equity for transfer
   */
  hasSufficientEquity(minimumEquityPercentage: number = 10): boolean {
    const netValue = this.getNetValue().getAmount();
    const totalValue = this.currentValue.getAmount();

    if (totalValue === 0) return false;

    const equityPercentage = (netValue / totalValue) * 100;
    return equityPercentage >= minimumEquityPercentage;
  }

  /**
   * Validates if the county is a valid Kenyan county
   */
  hasValidLocation(): boolean {
    if (!this.location?.county) return false;

    const validCounties = KENYAN_COUNTIES_LIST as readonly string[];
    return validCounties.includes(this.location.county.toUpperCase());
  }

  /**
   * Checks if asset documentation is complete for legal transfer
   */
  isDocumentationComplete(): boolean {
    return this.hasVerifiedDocument && this.identification !== null && this.hasValidLocation();
  }
}
