import { AggregateRoot } from '@nestjs/cqrs';
import { AssetType, AssetOwnershipType } from '@prisma/client';
import { AssetValue } from '../value-objects/asset-value.vo';
import { KENYAN_COUNTIES_LIST } from '../../../common/constants/kenyan-law.constants';
import { AssetAddedEvent } from '../events/asset-added.event';
import { AssetUpdatedEvent } from '../events/asset-updated.event';
import { AssetValuationUpdatedEvent } from '../events/asset-valuation-updated.event';
import { AssetVerifiedEvent } from '../events/asset-verified.event';
import { AssetEncumberedEvent } from '../events/asset-encumbered.event';

/**
 * Represents the geographical location of an asset within Kenya
 * @interface AssetLocation
 */
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

/**
 * Identification details for various asset types in Kenya
 * @interface AssetIdentification
 */
export interface AssetIdentification {
  registrationNumber?: string;
  serialNumber?: string;
  accountNumber?: string;
  parcelNumber?: string;
  vehicleRegistration?: string;
  otherIdentifiers?: Record<string, string>;
}

/**
 * Data structure for asset valuation information
 * @interface AssetValueData
 */
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface AssetReconstituteProps
 */
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

// Define the KenyanCounty type based on KENYAN_COUNTIES_LIST
type KenyanCounty = (typeof KENYAN_COUNTIES_LIST)[number];

/**
 * Asset Entity representing property ownership under Kenyan succession law
 *
 * Core Domain Entity for managing testator's assets including:
 * - Land parcels (with Kenyan title deed validation)
 * - Financial assets (bank accounts, investments)
 * - Business interests and personal property
 *
 * @class Asset
 * @extends {AggregateRoot}
 */
export class Asset extends AggregateRoot {
  // Core Asset Properties
  private readonly _id: string;
  private _name: string;
  private _description: string;
  private readonly _type: AssetType;
  private readonly _ownerId: string;
  private _ownershipType: AssetOwnershipType;
  private _ownershipShare: number;
  private _currentValue: AssetValue;
  private _location: AssetLocation | null;
  private _identification: AssetIdentification | null;

  // Legal Status Flags (Kenyan Law Compliance)
  private _hasVerifiedDocument: boolean;
  private _isEncumbered: boolean;
  private _encumbranceDetails: string | null;
  private _encumbranceAmount: number;
  private _isActive: boolean;

  // Audit Trail - Remove readonly for reconstruction
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
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

    if (!id?.trim()) throw new Error('Asset ID is required');
    if (!name?.trim()) throw new Error('Asset name is required');
    if (!ownerId?.trim()) throw new Error('Owner ID is required');

    this._id = id;
    this._name = name.trim();
    this._type = type;
    this._ownerId = ownerId;
    this._currentValue = currentValue;
    this._ownershipType = ownershipType;
    this._ownershipShare = ownershipShare;

    // Initialize default values
    this._description = '';
    this._location = null;
    this._identification = null;
    this._hasVerifiedDocument = false;
    this._isEncumbered = false;
    this._encumbranceDetails = null;
    this._encumbranceAmount = 0;
    this._isActive = true;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a new Asset entity with proper domain event emission
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
    if (ownershipShare < 0 || ownershipShare > 100) {
      throw new Error('Ownership share must be between 0 and 100 percent');
    }

    const asset = new Asset(id, name, type, ownerId, value, ownershipType, ownershipShare);

    asset.apply(
      new AssetAddedEvent(
        asset._id,
        asset._ownerId,
        asset._type,
        asset._ownershipType,
        asset._currentValue,
        asset._createdAt,
      ),
    );

    return asset;
  }

  /**
   * Reconstructs Asset entity from persistence layer data
   */
  static reconstitute(props: AssetReconstituteProps): Asset {
    if (!props.id || !props.name || !props.ownerId) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

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

    // Hydrate additional properties
    asset._description = props.description || '';
    asset._location = props.location ? { ...props.location } : null;
    asset._identification = props.identification ? { ...props.identification } : null;
    asset._hasVerifiedDocument = Boolean(props.hasVerifiedDocument);
    asset._isEncumbered = Boolean(props.isEncumbered);
    asset._encumbranceDetails = props.encumbranceDetails || null;
    asset._encumbranceAmount = Number(props.encumbranceAmount) || 0;
    asset._isActive = Boolean(props.isActive);

    // Handle date reconstruction - remove readonly constraint
    asset._createdAt = Asset.safeDateConversion(props.createdAt, 'createdAt');
    asset._updatedAt = Asset.safeDateConversion(props.updatedAt, 'updatedAt');
    asset._deletedAt = props.deletedAt
      ? Asset.safeDateConversion(props.deletedAt, 'deletedAt')
      : null;

    return asset;
  }

  /**
   * Safely converts date strings to Date objects with validation
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Reconstructs AssetValue from raw data or existing instance
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }
    if (typeof valueData !== 'object' || valueData === null) {
      throw new Error('Invalid asset value data');
    }
    return new AssetValue(
      valueData.amount,
      valueData.currency,
      Asset.safeDateConversion(valueData.valuationDate, 'valuationDate'),
    );
  }

  /**
   * Validates Kenyan county against official list with type safety
   */
  private static isValidKenyanCounty(county: string): county is KenyanCounty {
    const countyUpper = county.trim().toUpperCase();
    return (KENYAN_COUNTIES_LIST as readonly string[]).includes(countyUpper);
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates asset descriptive information with validation
   */
  updateDetails(name: string, description: string): void {
    this.validateAssetIsActive();

    if (!name?.trim()) {
      throw new Error('Asset name cannot be empty');
    }

    this._name = name.trim();
    this._description = description?.trim() || '';
    this._updatedAt = new Date();

    this.apply(new AssetUpdatedEvent(this._id, this._ownerId));
  }

  /**
   * Updates asset valuation and emits valuation event
   */
  updateValue(newValue: AssetValue, reason: string = 'Manual Update'): void {
    this.validateAssetIsActive();

    if (!(newValue instanceof AssetValue)) {
      throw new Error('New value must be instance of AssetValue');
    }

    const oldValue = this._currentValue;
    this._currentValue = newValue;
    this._updatedAt = new Date();

    this.apply(
      new AssetValuationUpdatedEvent(
        this._id,
        this._ownerId,
        oldValue,
        newValue,
        reason.trim() || 'Manual Update',
      ),
    );
  }

  /**
   * Updates ownership structure with Kenyan legal validation
   */
  updateOwnership(ownershipType: AssetOwnershipType, share: number): void {
    this.validateAssetIsActive();

    if (share < 0 || share > 100) {
      throw new Error('Ownership share must be between 0 and 100 percent');
    }

    if (ownershipType === AssetOwnershipType.SOLE && share !== 100) {
      throw new Error('Sole ownership requires 100% ownership share under Kenyan law');
    }

    this._ownershipType = ownershipType;
    this._ownershipShare = share;
    this._updatedAt = new Date();

    this.apply(new AssetUpdatedEvent(this._id, this._ownerId));
  }

  /**
   * Sets geographical location with Kenyan county validation
   */
  setLocation(location: AssetLocation): void {
    this.validateAssetIsActive();

    if (!location?.county?.trim()) {
      throw new Error('County is required for asset location');
    }

    // Validate Kenyan county with type-safe approach
    if (!Asset.isValidKenyanCounty(location.county)) {
      throw new Error(
        `Invalid Kenyan county: ${location.county}. Must be one of: ${KENYAN_COUNTIES_LIST.join(', ')}`,
      );
    }

    this._location = { ...location };
    this._updatedAt = new Date();
  }

  /**
   * Sets asset identification details
   */
  setIdentification(identification: AssetIdentification): void {
    this.validateAssetIsActive();
    this._identification = identification ? { ...identification } : null;
    this._updatedAt = new Date();
  }

  /**
   * Marks asset as verified with supporting document
   */
  markAsVerified(documentId: string, verifiedBy: string): void {
    this.validateAssetIsActive();

    if (!documentId?.trim() || !verifiedBy?.trim()) {
      throw new Error('Document ID and verifier are required for verification');
    }

    this._hasVerifiedDocument = true;
    this._updatedAt = new Date();

    this.apply(new AssetVerifiedEvent(this._id, documentId.trim(), verifiedBy.trim()));
  }

  /**
   * Removes verified status from asset
   */
  markAsUnverified(): void {
    this.validateAssetIsActive();
    this._hasVerifiedDocument = false;
    this._updatedAt = new Date();
  }

  /**
   * Adds encumbrance (debt/liability) to asset with validation
   */
  addEncumbrance(details: string, amount: number): void {
    this.validateAssetIsActive();

    if (!details?.trim()) throw new Error('Encumbrance details required');
    if (amount < 0) throw new Error('Encumbrance amount cannot be negative');

    this._isEncumbered = true;

    // Append details if they exist, otherwise set them
    const timestamp = new Date().toISOString().split('T')[0];
    const newDetail = `[${timestamp}] ${details.trim()} (Amt: ${amount})`;

    this._encumbranceDetails = this._encumbranceDetails
      ? `${this._encumbranceDetails}; ${newDetail}`
      : newDetail;

    // Add to existing amount rather than overwriting
    this._encumbranceAmount += amount;

    this._updatedAt = new Date();

    this.apply(
      new AssetEncumberedEvent(
        this._id,
        this._ownerId,
        this._encumbranceDetails,
        this._encumbranceAmount,
      ),
    );
  }

  /**
   * Removes all encumbrances from asset
   */
  removeEncumbrance(): void {
    this.validateAssetIsActive();
    this._isEncumbered = false;
    this._encumbranceDetails = null;
    this._encumbranceAmount = 0;
    this._updatedAt = new Date();
  }

  /**
   * Performs soft deletion of asset
   */
  softDelete(): void {
    this._isActive = false;
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Restores previously soft-deleted asset
   */
  restore(): void {
    this._isActive = true;
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS
  // --------------------------------------------------------------------------

  /**
   * Validates that asset is active for operations
   */
  private validateAssetIsActive(): void {
    if (!this._isActive) {
      throw new Error('Cannot perform operation on inactive asset');
    }
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Determines if asset is fully owned by a single owner
   */
  isFullyOwned(): boolean {
    return this._ownershipType === AssetOwnershipType.SOLE && this._ownershipShare === 100;
  }

  /**
   * Determines if asset can be legally transferred under Kenyan law
   */
  canBeTransferred(): boolean {
    return this._isActive && this._hasVerifiedDocument;
  }

  /**
   * Calculates net transferable value considering ownership share and encumbrances
   */
  getTransferableValue(): AssetValue {
    this.validateAssetIsActive();
    const totalAmount = this._currentValue.getAmount();
    const shareFraction = this._ownershipShare / 100;
    const grossShareValue = totalAmount * shareFraction;

    // Pro-rate liability based on share (simplification for general transfers)
    const liabilityShare = this._encumbranceAmount * shareFraction;
    const netValue = Math.max(0, grossShareValue - liabilityShare);

    return new AssetValue(
      netValue,
      this._currentValue.getCurrency(),
      this._currentValue.getValuationDate(),
    );
  }

  /**
   * Calculates total net equity value (asset value minus total encumbrances)
   */
  getNetValue(): AssetValue {
    const netValue = Math.max(0, this._currentValue.getAmount() - this._encumbranceAmount);

    return new AssetValue(
      netValue,
      this._currentValue.getCurrency(),
      this._currentValue.getValuationDate(),
    );
  }

  /**
   * Determines if asset has sufficient equity for legal transfer
   */
  hasSufficientEquity(minimumEquityPercentage: number = 10): boolean {
    if (minimumEquityPercentage < 0 || minimumEquityPercentage > 100) {
      throw new Error('Minimum equity percentage must be between 0 and 100');
    }

    const netValue = this.getNetValue().getAmount();
    const totalValue = this._currentValue.getAmount();

    if (totalValue === 0) return false;

    const equityPercentage = (netValue / totalValue) * 100;
    return equityPercentage >= minimumEquityPercentage;
  }

  /**
   * Validates Kenyan location data
   */
  hasValidLocation(): boolean {
    if (!this._location?.county) return false;
    return Asset.isValidKenyanCounty(this._location.county);
  }

  /**
   * Checks if asset documentation meets legal requirements for transfer
   */
  isDocumentationComplete(): boolean {
    return this._hasVerifiedDocument && this._identification !== null && this.hasValidLocation();
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string {
    return this._description;
  }
  get type(): AssetType {
    return this._type;
  }
  get ownerId(): string {
    return this._ownerId;
  }
  get ownershipType(): AssetOwnershipType {
    return this._ownershipType;
  }
  get ownershipShare(): number {
    return this._ownershipShare;
  }
  get currentValue(): AssetValue {
    return this._currentValue;
  }
  get location(): AssetLocation | null {
    return this._location ? { ...this._location } : null;
  }
  get identification(): AssetIdentification | null {
    return this._identification ? { ...this._identification } : null;
  }
  get hasVerifiedDocument(): boolean {
    return this._hasVerifiedDocument;
  }
  get isEncumbered(): boolean {
    return this._isEncumbered;
  }
  get encumbranceDetails(): string | null {
    return this._encumbranceDetails;
  }
  get encumbranceAmount(): number {
    return this._encumbranceAmount;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
  get deletedAt(): Date | null {
    return this._deletedAt ? new Date(this._deletedAt) : null;
  }
}
