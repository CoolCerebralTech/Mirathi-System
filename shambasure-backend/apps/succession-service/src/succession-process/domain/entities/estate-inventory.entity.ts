import { AggregateRoot } from '@nestjs/cqrs';
import { AssetType } from '@prisma/client';

// Domain Events
import { InventoryItemAddedEvent } from '../events/inventory-item-added.event';
import { InventoryItemRemovedEvent } from '../events/inventory-item-removed.event';
import { InventoryItemUpdatedEvent } from '../events/inventory-item-updated.event';

// Value Objects
export class KenyanLocation {
  constructor(
    private readonly county?: string,
    private readonly subCounty?: string,
    private readonly ward?: string,
    private readonly village?: string,
    private readonly landReferenceNumber?: string,
    private readonly gpsCoordinates?: { latitude: number; longitude: number },
  ) {}

  getCounty(): string | undefined {
    return this.county;
  }
  getSubCounty(): string | undefined {
    return this.subCounty;
  }
  getWard(): string | undefined {
    return this.ward;
  }
  getVillage(): string | undefined {
    return this.village;
  }
  getLandReferenceNumber(): string | undefined {
    return this.landReferenceNumber;
  }
  getGpsCoordinates(): { latitude: number; longitude: number } | undefined {
    return this.gpsCoordinates;
  }

  getFormalAddress(): string {
    const parts: string[] = [];
    if (this.village) parts.push(this.village);
    if (this.ward) parts.push(this.ward);
    if (this.subCounty) parts.push(this.subCounty);
    if (this.county) parts.push(this.county);
    return parts.join(', ') || 'Location not specified';
  }
}

export class AssetIdentification {
  constructor(
    private readonly titleDeedNumber?: string,
    private readonly registrationNumber?: string,
    private readonly kraPin?: string,
    private readonly identificationDetails?: Record<string, any>,
  ) {}

  getTitleDeedNumber(): string | undefined {
    return this.titleDeedNumber;
  }
  getRegistrationNumber(): string | undefined {
    return this.registrationNumber;
  }
  getKraPin(): string | undefined {
    return this.kraPin;
  }
  getIdentificationDetails(): Record<string, any> | undefined {
    return this.identificationDetails;
  }

  hasCompleteIdentification(assetType: AssetType): boolean {
    switch (assetType) {
      case AssetType.LAND_PARCEL:
      case AssetType.PROPERTY:
        return !!this.titleDeedNumber;
      case AssetType.VEHICLE:
        return !!this.registrationNumber;
      case AssetType.FINANCIAL_ASSET:
        return !!this.kraPin;
      default:
        return true;
    }
  }
}

// Main Entity
export class EstateInventory extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private description: string,
    private assetType: AssetType,
    private ownedByDeceased: boolean = true,
    private assetId?: string,
    private estimatedValue?: number,
    private currency: string = 'KES',
    private location?: KenyanLocation,
    private identification?: AssetIdentification,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static createItem(
    id: string,
    estateId: string,
    description: string,
    assetType: AssetType,
    options?: {
      assetId?: string;
      estimatedValue?: number;
      currency?: string;
      ownedByDeceased?: boolean;
      location?: {
        county?: string;
        subCounty?: string;
        ward?: string;
        village?: string;
        landReferenceNumber?: string;
        gpsCoordinates?: { latitude: number; longitude: number };
      };
      identification?: {
        titleDeedNumber?: string;
        registrationNumber?: string;
        kraPin?: string;
        identificationDetails?: Record<string, any>;
      };
    },
  ): EstateInventory {
    // Legal Validation: Kenyan asset identification requirements
    if (assetType === AssetType.LAND_PARCEL && !options?.identification?.titleDeedNumber) {
      console.warn('Land parcels should have title deed numbers for proper identification');
    }

    const location = options?.location
      ? new KenyanLocation(
          options.location.county,
          options.location.subCounty,
          options.location.ward,
          options.location.village,
          options.location.landReferenceNumber,
          options.location.gpsCoordinates,
        )
      : undefined;

    const identification = options?.identification
      ? new AssetIdentification(
          options.identification.titleDeedNumber,
          options.identification.registrationNumber,
          options.identification.kraPin,
          options.identification.identificationDetails,
        )
      : undefined;

    const inventory = new EstateInventory(
      id,
      estateId,
      description,
      assetType,
      options?.ownedByDeceased ?? true,
      options?.assetId,
      options?.estimatedValue,
      options?.currency || 'KES',
      location,
      identification,
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    inventory.apply(
      new InventoryItemAddedEvent(
        inventory.id,
        inventory.estateId,
        description,
        assetType,
        options?.estimatedValue,
        options?.assetId,
      ),
    );

    return inventory;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    description: string;
    assetType: AssetType;
    ownedByDeceased: boolean;
    assetId?: string;
    estimatedValue?: number;
    currency?: string;
    location?: {
      county?: string;
      subCounty?: string;
      ward?: string;
      village?: string;
      landReferenceNumber?: string;
      gpsCoordinates?: { latitude: number; longitude: number };
    };
    identification?: {
      titleDeedNumber?: string;
      registrationNumber?: string;
      kraPin?: string;
      identificationDetails?: Record<string, any>;
    };
    createdAt: Date;
    updatedAt: Date;
  }): EstateInventory {
    const location = props.location
      ? new KenyanLocation(
          props.location.county,
          props.location.subCounty,
          props.location.ward,
          props.location.village,
          props.location.landReferenceNumber,
          props.location.gpsCoordinates,
        )
      : undefined;

    const identification = props.identification
      ? new AssetIdentification(
          props.identification.titleDeedNumber,
          props.identification.registrationNumber,
          props.identification.kraPin,
          props.identification.identificationDetails,
        )
      : undefined;

    return new EstateInventory(
      props.id,
      props.estateId,
      props.description,
      props.assetType,
      props.ownedByDeceased,
      props.assetId,
      props.estimatedValue,
      props.currency || 'KES',
      location,
      identification,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Proper asset identification for Kenyan succession
  updateDescription(newDescription: string, updatedBy: string): void {
    if (!newDescription?.trim()) {
      throw new Error('Inventory description cannot be empty');
    }

    const oldDescription = this.description;
    this.description = newDescription;
    this.updatedAt = new Date();

    this.apply(
      new InventoryItemUpdatedEvent(
        this.id,
        this.estateId,
        'description',
        oldDescription,
        newDescription,
        updatedBy,
      ),
    );
  }

  // Legal Requirement: Accurate valuation for probate purposes
  updateValuation(
    newValue: number,
    currency: string = 'KES',
    updatedBy: string,
    valuationSource?: string,
  ): void {
    if (newValue < 0) {
      throw new Error('Inventory value cannot be negative');
    }

    if (currency !== 'KES') {
      throw new Error('Kenyan estate inventory must be valued in KES');
    }

    const oldValue = this.estimatedValue;
    this.estimatedValue = newValue;
    this.currency = currency;
    this.updatedAt = new Date();

    const changeReason = valuationSource
      ? `Valuation updated from ${valuationSource}`
      : 'Valuation updated';

    this.apply(
      new InventoryItemUpdatedEvent(
        this.id,
        this.estateId,
        'valuation',
        oldValue,
        newValue,
        updatedBy,
        changeReason,
      ),
    );
  }

  // Legal Requirement: Proper location documentation for immovable assets
  updateLocation(
    location: {
      county?: string;
      subCounty?: string;
      ward?: string;
      village?: string;
      landReferenceNumber?: string;
      gpsCoordinates?: { latitude: number; longitude: number };
    },
    updatedBy: string,
  ): void {
    this.location = new KenyanLocation(
      location.county,
      location.subCounty,
      location.ward,
      location.village,
      location.landReferenceNumber,
      location.gpsCoordinates,
    );
    this.updatedAt = new Date();

    // Legal Requirement: Land reference validation
    if (this.assetType === AssetType.LAND_PARCEL && !location.landReferenceNumber) {
      console.warn('Land parcels should have land reference numbers for proper identification');
    }
  }

  // Legal Requirement: Asset identification for traceability
  updateIdentification(
    identification: {
      titleDeedNumber?: string;
      registrationNumber?: string;
      kraPin?: string;
      identificationDetails?: Record<string, any>;
    },
    updatedBy: string,
  ): void {
    this.identification = new AssetIdentification(
      identification.titleDeedNumber,
      identification.registrationNumber,
      identification.kraPin,
      identification.identificationDetails,
    );
    this.updatedAt = new Date();

    // Legal Requirement: KRA PIN for certain asset types
    if (
      [AssetType.FINANCIAL_ASSET, AssetType.BUSINESS_INTEREST].includes(this.assetType) &&
      !identification.kraPin
    ) {
      console.warn('Financial and business assets should have KRA PIN for tax compliance');
    }
  }

  // Legal Requirement: Link to existing asset records
  linkToAsset(assetId: string, linkedBy: string): void {
    if (this.assetId) {
      throw new Error('Inventory item is already linked to an asset');
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

  // Legal Requirement: Remove non-estate assets
  removeFromInventory(reason: string, removedBy: string): void {
    if (!this.ownedByDeceased) {
      throw new Error('Cannot remove inventory item that is not owned by deceased');
    }

    this.ownedByDeceased = false;
    this.updatedAt = new Date();

    this.apply(new InventoryItemRemovedEvent(this.id, this.estateId, reason, removedBy));
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Inventory ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.description?.trim()) throw new Error('Inventory description is required');
    if (!this.assetType) throw new Error('Asset type is required');

    // Legal Requirement: Currency must be KES for Kenyan estates
    if (this.currency !== 'KES') {
      throw new Error('Kenyan estate inventory must use KES currency');
    }

    // Legal Requirement: Value validation if provided
    if (this.estimatedValue !== undefined && this.estimatedValue < 0) {
      throw new Error('Inventory value cannot be negative');
    }
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  requiresTitleVerification(): boolean {
    return [AssetType.LAND_PARCEL, AssetType.PROPERTY].includes(this.assetType);
  }

  hasCompleteIdentification(): boolean {
    if (!this.identification) return false;
    return this.identification.hasCompleteIdentification(this.assetType);
  }

  isImmovableProperty(): boolean {
    return [AssetType.LAND_PARCEL, AssetType.PROPERTY].includes(this.assetType);
  }

  requiresProbate(): boolean {
    // Legal Requirement: Certain assets require probate for transfer
    const probateRequiredTypes = [
      AssetType.LAND_PARCEL,
      AssetType.PROPERTY,
      AssetType.FINANCIAL_ASSET,
      AssetType.BUSINESS_INTEREST,
    ];
    return probateRequiredTypes.includes(this.assetType);
  }

  getFormalDescription(): string {
    if (this.assetType === AssetType.LAND_PARCEL && this.location) {
      return `Land Parcel ${this.location.getLandReferenceNumber() || ''} at ${this.location.getFormalAddress()}`;
    }
    return this.description;
  }

  isValuationReasonable(): boolean {
    if (!this.estimatedValue) return true;

    // Kenyan market reasonable ranges by asset type
    const reasonableRanges: Record<AssetType, { min: number; max: number }> = {
      [AssetType.LAND_PARCEL]: { min: 100000, max: 500000000 }, // 100K to 500M KES
      [AssetType.PROPERTY]: { min: 500000, max: 1000000000 }, // 500K to 1B KES
      [AssetType.FINANCIAL_ASSET]: { min: 1000, max: 100000000 }, // 1K to 100M KES
      [AssetType.DIGITAL_ASSET]: { min: 100, max: 1000000 }, // 100 to 1M KES
      [AssetType.BUSINESS_INTEREST]: { min: 100000, max: 500000000 }, // 100K to 500M KES
      [AssetType.VEHICLE]: { min: 100000, max: 20000000 }, // 100K to 20M KES
      [AssetType.INTELLECTUAL_PROPERTY]: { min: 10000, max: 10000000 }, // 10K to 10M KES
      [AssetType.LIVESTOCK]: { min: 1000, max: 10000000 }, // 1K to 10M KES
      [AssetType.PERSONAL_EFFECTS]: { min: 100, max: 10000000 }, // 100 to 10M KES
      [AssetType.OTHER]: { min: 100, max: 100000000 }, // 100 to 100M KES
    };

    const range = reasonableRanges[this.assetType];
    return this.estimatedValue >= range.min && this.estimatedValue <= range.max;
  }

  calculateStampDuty(): number {
    if (!this.estimatedValue || !this.isImmovableProperty()) return 0;

    const value = this.estimatedValue;
    let stampDuty = 0;

    // Kenyan Stamp Duty Act rates for property transfer
    if (value <= 100000) {
      stampDuty = value * 0.01; // 1% for first 100,000
    } else if (value <= 1000000) {
      stampDuty = 1000 + (value - 100000) * 0.02; // 2% for next 900,000
    } else {
      stampDuty = 19000 + (value - 1000000) * 0.04; // 4% for remainder
    }

    return Math.max(stampDuty, 100); // Minimum stamp duty
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getDescription(): string {
    return this.description;
  }
  getAssetType(): AssetType {
    return this.assetType;
  }
  getOwnedByDeceased(): boolean {
    return this.ownedByDeceased;
  }
  getAssetId(): string | undefined {
    return this.assetId;
  }
  getEstimatedValue(): number | undefined {
    return this.estimatedValue;
  }
  getCurrency(): string {
    return this.currency;
  }
  getLocation(): KenyanLocation | undefined {
    return this.location;
  }
  getIdentification(): AssetIdentification | undefined {
    return this.identification;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // For persistence reconstitution
  getProps() {
    return {
      id: this.id,
      estateId: this.estateId,
      description: this.description,
      assetType: this.assetType,
      ownedByDeceased: this.ownedByDeceased,
      assetId: this.assetId,
      estimatedValue: this.estimatedValue,
      currency: this.currency,
      location: this.location
        ? {
            county: this.location.getCounty(),
            subCounty: this.location.getSubCounty(),
            ward: this.location.getWard(),
            village: this.location.getVillage(),
            landReferenceNumber: this.location.getLandReferenceNumber(),
            gpsCoordinates: this.location.getGpsCoordinates(),
          }
        : undefined,
      identification: this.identification
        ? {
            titleDeedNumber: this.identification.getTitleDeedNumber(),
            registrationNumber: this.identification.getRegistrationNumber(),
            kraPin: this.identification.getKraPin(),
            identificationDetails: this.identification.getIdentificationDetails(),
          }
        : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
