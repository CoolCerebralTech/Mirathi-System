import { AggregateRoot } from '@nestjs/cqrs';

import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';
import { InventoryItemAddedEvent } from '../events/inventory-item-added.event';
import { InventoryItemDisputedEvent } from '../events/inventory-item-disputed.event';
import { InventoryItemRemovedEvent } from '../events/inventory-item-removed.event';
import { InventoryItemUpdatedEvent } from '../events/inventory-item-updated.event';
import { InventoryItemVerifiedEvent } from '../events/inventory-item-verified.event';

export type InventoryStatus = 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'REMOVED' | 'AMENDED';
export type AssetCategory =
  | 'LAND'
  | 'PROPERTY'
  | 'FINANCIAL'
  | 'VEHICLE'
  | 'BUSINESS'
  | 'PERSONAL'
  | 'DIGITAL'
  | 'OTHER';
export type OwnershipType =
  | 'SOLE_OWNERSHIP'
  | 'JOINT_TENANCY'
  | 'TENANCY_IN_COMMON'
  | 'TRUST_PROPERTY'
  | 'COMMUNITY_PROPERTY';

// Safe interface for reconstitution
export interface EstateInventoryProps {
  id: string;
  estateId: string;
  assetId?: string | null;
  description: string;
  estimatedValue: AssetValue | { amount: number; currency: string; valuationDate?: Date | string };
  assetCategory: AssetCategory;
  ownershipType: OwnershipType;
  ownedByDeceased: boolean;
  status: InventoryStatus;
  isVerified: boolean;
  verifiedAt?: Date | string | null;
  verifiedBy?: string | null;
  verificationMethod?: string | null;
  verificationNotes?: string | null;
  locationDetails?: {
    county?: string | null;
    subCounty?: string | null;
    ward?: string | null;
    parcelNumber?: string | null;
    coordinates?: { lat: number; lng: number } | null;
  } | null;
  identificationDetails?: {
    registrationNumber?: string | null;
    titleDeedNumber?: string | null;
    accountNumber?: string | null;
    serialNumber?: string | null;
  } | null;
  disputeDetails?: {
    reason?: string | null;
    disputedBy?: string | null;
    disputeDate?: Date | string | null;
    evidence?: string[] | null;
  } | null;
  removalDetails?: {
    reason?: string | null;
    removedBy?: string | null;
    removalDate?: Date | string | null;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class EstateInventory extends AggregateRoot {
  private id: string;
  private estateId: string;
  private assetId: string | null;

  // Core Inventory Data
  private description: string;
  private estimatedValue: AssetValue;
  private assetCategory: AssetCategory;
  private ownershipType: OwnershipType;
  private ownedByDeceased: boolean;

  // Status and Verification
  private status: InventoryStatus;
  private isVerified: boolean;
  private verifiedAt: Date | null;
  private verifiedBy: string | null;
  private verificationMethod: string | null;
  private verificationNotes: string | null;

  // Location and Identification
  private locationDetails: {
    county: string | null;
    subCounty: string | null;
    ward: string | null;
    parcelNumber: string | null;
    coordinates: { lat: number; lng: number } | null;
  };

  private identificationDetails: {
    registrationNumber: string | null;
    titleDeedNumber: string | null;
    accountNumber: string | null;
    serialNumber: string | null;
  };

  // Dispute Information
  private disputeDetails: {
    reason: string | null;
    disputedBy: string | null;
    disputeDate: Date | null;
    evidence: string[];
  };

  // Removal Information
  private removalDetails: {
    reason: string | null;
    removedBy: string | null;
    removalDate: Date | null;
  };

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    description: string,
    estimatedValue: AssetValue,
    assetCategory: AssetCategory,
    ownershipType: OwnershipType,
    ownedByDeceased: boolean,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.description = description;
    this.estimatedValue = estimatedValue;
    this.assetCategory = assetCategory;
    this.ownershipType = ownershipType;
    this.ownedByDeceased = ownedByDeceased;

    this.assetId = null;
    this.status = 'PENDING';
    this.isVerified = false;
    this.verifiedAt = null;
    this.verifiedBy = null;
    this.verificationMethod = null;
    this.verificationNotes = null;

    this.locationDetails = {
      county: null,
      subCounty: null,
      ward: null,
      parcelNumber: null,
      coordinates: null,
    };

    this.identificationDetails = {
      registrationNumber: null,
      titleDeedNumber: null,
      accountNumber: null,
      serialNumber: null,
    };

    this.disputeDetails = {
      reason: null,
      disputedBy: null,
      disputeDate: null,
      evidence: [],
    };

    this.removalDetails = {
      reason: null,
      removedBy: null,
      removalDate: null,
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    estateId: string,
    description: string,
    estimatedValue: AssetValue,
    assetCategory: AssetCategory,
    ownershipType: OwnershipType,
    options?: {
      assetId?: string;
      ownedByDeceased?: boolean;
      locationDetails?: {
        county?: string;
        subCounty?: string;
        ward?: string;
        parcelNumber?: string;
        coordinates?: { lat: number; lng: number };
      };
      identificationDetails?: {
        registrationNumber?: string;
        titleDeedNumber?: string;
        accountNumber?: string;
        serialNumber?: string;
      };
    },
  ): EstateInventory {
    if (estimatedValue.getAmount() <= 0) {
      throw new Error('Inventory item value must be positive.');
    }

    if (estimatedValue.getCurrency() !== 'KES') {
      throw new Error('Kenyan estate inventory must be valued in KES.');
    }

    const item = new EstateInventory(
      id,
      estateId,
      description,
      estimatedValue,
      assetCategory,
      ownershipType,
      options?.ownedByDeceased ?? true,
    );

    if (options) {
      if (options.assetId) item.assetId = options.assetId;
      if (options.locationDetails)
        item.locationDetails = { ...item.locationDetails, ...options.locationDetails };
      if (options.identificationDetails)
        item.identificationDetails = {
          ...item.identificationDetails,
          ...options.identificationDetails,
        };
    }

    item.apply(
      new InventoryItemAddedEvent(
        id,
        estateId,
        description,
        estimatedValue,
        assetCategory,
        options?.assetId,
        ownershipType,
      ),
    );

    return item;
  }

  static reconstitute(props: EstateInventoryProps): EstateInventory {
    if (
      !props.id ||
      !props.estateId ||
      !props.description ||
      !props.estimatedValue ||
      !props.assetCategory ||
      !props.ownershipType
    ) {
      throw new Error('Missing required properties for EstateInventory reconstitution');
    }

    let estimatedValue: AssetValue;
    if (props.estimatedValue instanceof AssetValue) {
      estimatedValue = props.estimatedValue;
    } else {
      estimatedValue = AssetValue.create(
        props.estimatedValue.amount,
        props.estimatedValue.currency || 'KES',
        props.estimatedValue.valuationDate
          ? new Date(props.estimatedValue.valuationDate)
          : new Date(),
      );
    }

    const item = new EstateInventory(
      props.id,
      props.estateId,
      props.description,
      estimatedValue,
      props.assetCategory,
      props.ownershipType,
      props.ownedByDeceased,
    );

    item.assetId = props.assetId ?? null;
    item.status = props.status;
    item.isVerified = props.isVerified;
    item.verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;
    item.verifiedBy = props.verifiedBy ?? null;
    item.verificationMethod = props.verificationMethod ?? null;
    item.verificationNotes = props.verificationNotes ?? null;

    if (props.locationDetails) {
      item.locationDetails = {
        county: props.locationDetails.county ?? null,
        subCounty: props.locationDetails.subCounty ?? null,
        ward: props.locationDetails.ward ?? null,
        parcelNumber: props.locationDetails.parcelNumber ?? null,
        coordinates: props.locationDetails.coordinates ?? null,
      };
    }

    if (props.identificationDetails) {
      item.identificationDetails = {
        registrationNumber: props.identificationDetails.registrationNumber ?? null,
        titleDeedNumber: props.identificationDetails.titleDeedNumber ?? null,
        accountNumber: props.identificationDetails.accountNumber ?? null,
        serialNumber: props.identificationDetails.serialNumber ?? null,
      };
    }

    if (props.disputeDetails) {
      item.disputeDetails = {
        reason: props.disputeDetails.reason ?? null,
        disputedBy: props.disputeDetails.disputedBy ?? null,
        disputeDate: props.disputeDetails.disputeDate
          ? new Date(props.disputeDetails.disputeDate)
          : null,
        evidence: props.disputeDetails.evidence || [],
      };
    }

    if (props.removalDetails) {
      item.removalDetails = {
        reason: props.removalDetails.reason ?? null,
        removedBy: props.removalDetails.removedBy ?? null,
        removalDate: props.removalDetails.removalDate
          ? new Date(props.removalDetails.removalDate)
          : null,
      };
    }

    item.createdAt = new Date(props.createdAt);
    item.updatedAt = new Date(props.updatedAt);

    return item;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Verifies inventory item with detailed verification information
   */
  verify(
    verifiedBy: string,
    verificationMethod: string,
    options?: {
      notes?: string;
      supportingDocuments?: string[];
    },
  ): void {
    if (this.isVerified) {
      throw new Error('Inventory item is already verified.');
    }

    if (this.status === 'REMOVED') {
      throw new Error('Cannot verify a removed inventory item.');
    }

    this.isVerified = true;
    this.status = 'VERIFIED';
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    this.verificationMethod = verificationMethod;

    if (options?.notes) {
      this.verificationNotes = options.notes;
    }

    this.updatedAt = new Date();

    this.apply(
      new InventoryItemVerifiedEvent(
        this.id,
        this.estateId,
        verifiedBy,
        verificationMethod,
        this.verifiedAt,
        options?.notes,
      ),
    );
  }

  /**
   * Updates valuation with proper audit trail
   */
  updateValuation(newValue: AssetValue, updatedBy: string, reason?: string): void {
    if (this.status === 'REMOVED') {
      throw new Error('Cannot update valuation of a removed inventory item.');
    }

    const oldValue = this.estimatedValue;
    this.estimatedValue = newValue;
    this.status = 'AMENDED';
    this.updatedAt = new Date();

    this.apply(
      new InventoryItemUpdatedEvent(
        this.id,
        this.estateId,
        'estimatedValue',
        oldValue.getAmount(),
        newValue.getAmount(),
        updatedBy,
        reason,
      ),
    );
  }

  /**
   * Updates description with proper audit trail
   */
  updateDescription(newDescription: string, updatedBy: string, reason?: string): void {
    if (this.status === 'REMOVED') {
      throw new Error('Cannot update description of a removed inventory item.');
    }

    const oldDescription = this.description;
    this.description = newDescription;
    this.status = 'AMENDED';
    this.updatedAt = new Date();

    this.apply(
      new InventoryItemUpdatedEvent(
        this.id,
        this.estateId,
        'description',
        oldDescription,
        newDescription,
        updatedBy,
        reason,
      ),
    );
  }

  /**
   * Marks inventory item as disputed
   */
  markDisputed(reason: string, disputedBy: string, evidence?: string[]): void {
    if (this.status === 'REMOVED') {
      throw new Error('Cannot dispute a removed inventory item.');
    }

    this.status = 'DISPUTED';
    this.disputeDetails.reason = reason;
    this.disputeDetails.disputedBy = disputedBy;
    this.disputeDetails.disputeDate = new Date();

    if (evidence) {
      this.disputeDetails.evidence = evidence;
    }

    this.updatedAt = new Date();

    this.apply(
      new InventoryItemDisputedEvent(
        this.id,
        this.estateId,
        reason,
        disputedBy,
        this.disputeDetails.disputeDate,
        evidence,
      ),
    );
  }

  /**
   * Resolves dispute and returns to verified status
   */
  resolveDispute(resolution: string): void {
    if (this.status !== 'DISPUTED') {
      throw new Error('Can only resolve disputed inventory items.');
    }

    this.status = 'VERIFIED';
    this.disputeDetails.reason = `${this.disputeDetails.reason} - RESOLVED: ${resolution}`;
    this.updatedAt = new Date();
  }

  /**
   * Removes inventory item from estate (e.g., found not to belong to deceased)
   */
  remove(reason: string, removedBy: string): void {
    if (this.status === 'REMOVED') {
      throw new Error('Inventory item is already removed.');
    }

    this.status = 'REMOVED';
    this.removalDetails.reason = reason;
    this.removalDetails.removedBy = removedBy;
    this.removalDetails.removalDate = new Date();
    this.updatedAt = new Date();

    this.apply(
      new InventoryItemRemovedEvent(
        this.id,
        this.estateId,
        reason,
        removedBy,
        this.removalDetails.removalDate,
      ),
    );
  }

  /**
   * Updates location details for physical assets
   */
  updateLocationDetails(location: {
    county?: string;
    subCounty?: string;
    ward?: string;
    parcelNumber?: string;
    coordinates?: { lat: number; lng: number };
  }): void {
    if (this.status === 'REMOVED') {
      throw new Error('Cannot update location of a removed inventory item.');
    }

    this.locationDetails = { ...this.locationDetails, ...location };
    this.updatedAt = new Date();

    // Could emit specific event for location update if needed
  }

  /**
   * Links to an existing asset in the system
   */
  linkToAsset(assetId: string, linkedBy: string): void {
    if (this.assetId) {
      throw new Error('Inventory item is already linked to an asset.');
    }

    this.assetId = assetId;
    this.updatedAt = new Date();

    this.apply(
      new InventoryItemUpdatedEvent(
        this.id,
        this.estateId,
        'assetLink',
        null,
        assetId,
        linkedBy,
        'Linked to existing asset record',
      ),
    );
  }

  // --------------------------------------------------------------------------
  // VALIDATION & HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Checks if this is a land/property asset requiring title verification
   */
  requiresTitleVerification(): boolean {
    return this.assetCategory === 'LAND' || this.assetCategory === 'PROPERTY';
  }

  /**
   * Checks if asset valuation seems reasonable for its category
   */
  isValuationReasonable(): boolean {
    const value = this.estimatedValue.getAmount();

    // Basic sanity checks for Kenyan context
    const reasonableRanges: Record<AssetCategory, { min: number; max: number }> = {
      LAND: { min: 100000, max: 500000000 }, // 100K to 500M KES
      PROPERTY: { min: 500000, max: 1000000000 }, // 500K to 1B KES
      FINANCIAL: { min: 1000, max: 100000000 }, // 1K to 100M KES
      VEHICLE: { min: 100000, max: 20000000 }, // 100K to 20M KES
      BUSINESS: { min: 100000, max: 500000000 }, // 100K to 500M KES
      PERSONAL: { min: 100, max: 10000000 }, // 100 to 10M KES
      DIGITAL: { min: 100, max: 1000000 }, // 100 to 1M KES
      OTHER: { min: 100, max: 100000000 }, // 100 to 100M KES
    };

    const range = reasonableRanges[this.assetCategory];
    return value >= range.min && value <= range.max;
  }

  /**
   * Gets the full location description for legal documents - FIXED: Type safety
   */
  getFormalLocation(): string {
    const parts: string[] = [];

    if (this.locationDetails.county) parts.push(this.locationDetails.county);
    if (this.locationDetails.subCounty) parts.push(this.locationDetails.subCounty);
    if (this.locationDetails.ward) parts.push(this.locationDetails.ward);
    if (this.locationDetails.parcelNumber)
      parts.push(`Parcel ${this.locationDetails.parcelNumber}`);

    return parts.join(', ') || 'Location not specified';
  }

  /**
   * Checks if all required identification details are present
   */
  hasCompleteIdentification(): boolean {
    switch (this.assetCategory) {
      case 'LAND':
        return !!this.identificationDetails.titleDeedNumber;
      case 'PROPERTY':
        return !!this.identificationDetails.titleDeedNumber;
      case 'FINANCIAL':
        return !!this.identificationDetails.accountNumber;
      case 'VEHICLE':
        return !!this.identificationDetails.registrationNumber;
      default:
        return true;
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getDescription(): string {
    return this.description;
  }
  getValue(): AssetValue {
    return this.estimatedValue;
  }
  getAssetId(): string | null {
    return this.assetId;
  }
  getIsVerified(): boolean {
    return this.isVerified;
  }
  getStatus(): InventoryStatus {
    return this.status;
  }
  getAssetCategory(): AssetCategory {
    return this.assetCategory;
  }
  getOwnershipType(): OwnershipType {
    return this.ownershipType;
  }
  getOwnedByDeceased(): boolean {
    return this.ownedByDeceased;
  }
  getVerifiedAt(): Date | null {
    return this.verifiedAt;
  }
  getVerifiedBy(): string | null {
    return this.verifiedBy;
  }
  getVerificationMethod(): string | null {
    return this.verificationMethod;
  }
  getVerificationNotes(): string | null {
    return this.verificationNotes;
  }
  getLocationDetails() {
    return { ...this.locationDetails };
  }
  getIdentificationDetails() {
    return { ...this.identificationDetails };
  }
  getDisputeDetails() {
    return { ...this.disputeDetails };
  }
  getRemovalDetails() {
    return { ...this.removalDetails };
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Method to get all properties for persistence
  getProps(): EstateInventoryProps {
    return {
      id: this.id,
      estateId: this.estateId,
      assetId: this.assetId,
      description: this.description,
      estimatedValue: {
        amount: this.estimatedValue.getAmount(),
        currency: this.estimatedValue.getCurrency(),
        valuationDate: this.estimatedValue.getValuationDate(),
      }, // FIXED: Convert to plain object
      assetCategory: this.assetCategory,
      ownershipType: this.ownershipType,
      ownedByDeceased: this.ownedByDeceased,
      status: this.status,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      verifiedBy: this.verifiedBy,
      verificationMethod: this.verificationMethod,
      verificationNotes: this.verificationNotes,
      locationDetails: this.locationDetails,
      identificationDetails: this.identificationDetails,
      disputeDetails: this.disputeDetails,
      removalDetails: this.removalDetails,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
