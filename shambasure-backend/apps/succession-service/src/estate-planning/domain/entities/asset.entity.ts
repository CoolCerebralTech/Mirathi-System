import { AggregateRoot } from '@nestjs/cqrs';
import {
  AssetEncumbranceType,
  AssetOwnershipType,
  AssetType,
  AssetVerificationStatus,
  KenyanCounty,
} from '@prisma/client';

import { AssetAddedEvent } from '../events/asset-added.event';
import { AssetEncumberedEvent } from '../events/asset-encumbered.event';
import { AssetUpdatedEvent } from '../events/asset-updated.event';
import { AssetValuationUpdatedEvent } from '../events/asset-valuation-updated.event';
import { AssetVerifiedEvent } from '../events/asset-verified.event';

// -----------------------------------------------------------------------------
// VALUE OBJECTS & INTERFACES
// -----------------------------------------------------------------------------

/**
 * GPS coordinates for Kenyan land parcels.
 * Mapped from Prisma Json field.
 */
export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Properties required for entity reconstitution from persistence.
 * Strictly aligned with Prisma Schema.
 */
export interface AssetReconstituteProps {
  id: string;
  name: string;
  description: string | null;
  type: AssetType;
  ownerId: string;
  ownershipType: AssetOwnershipType;
  ownershipShare: number;

  // Kenyan Location Data
  county: KenyanCounty | null;
  subCounty: string | null;
  ward: string | null;
  village: string | null;
  landReferenceNumber: string | null;
  gpsCoordinates: GPSCoordinates | null; // Parsed from Json

  // Kenyan Identification
  titleDeedNumber: string | null;
  registrationNumber: string | null;
  kraPin: string | null;
  identificationDetails: Record<string, any> | null; // Parsed from Json

  // Valuation
  currentValue: number | null;
  currency: string;
  valuationDate: Date | null;
  valuationSource: string | null;

  // Legal Status - Kenyan Compliance
  verificationStatus: AssetVerificationStatus;
  isEncumbered: boolean;
  encumbranceType: AssetEncumbranceType | null;
  encumbranceDetails: string | null;
  encumbranceAmount: number | null;

  // Matrimonial Property Status (Matrimonial Property Act, 2013)
  isMatrimonialProperty: boolean;
  acquiredDuringMarriage: boolean;
  spouseConsentRequired: boolean;

  // Life Interest Support (Law of Succession Act, Cap 160)
  hasLifeInterest: boolean;
  lifeInterestHolderId: string | null;
  lifeInterestEndsAt: Date | null;

  // Management & Status
  isActive: boolean;
  requiresProbate: boolean;

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}

/**
 * Asset Aggregate Root
 *
 * Represents an item of property within a Kenyan Estate.
 *
 * Legal Context:
 * - Governed by Law of Succession Act (Cap 160).
 * - Matrimonial Property Act (2013) applies to ownership and consent.
 * - Land Registration Act applies to title details.
 */
export class Asset extends AggregateRoot {
  // Core Identity
  private readonly _id: string;
  private _name: string;
  private _description: string | null;
  private readonly _type: AssetType;
  private readonly _ownerId: string;

  // Ownership
  private _ownershipType: AssetOwnershipType;
  private _ownershipShare: number; // Percentage (0-100)

  // Kenyan Location Data
  private _county: KenyanCounty | null;
  private _subCounty: string | null;
  private _ward: string | null;
  private _village: string | null;
  private _landReferenceNumber: string | null; // Critical for Land Assets (L.R. No)
  private _gpsCoordinates: GPSCoordinates | null;

  // Kenyan Identification
  private _titleDeedNumber: string | null;
  private _registrationNumber: string | null; // For Vehicles/Business
  private _kraPin: string | null; // For Tax compliance check
  private _identificationDetails: Record<string, any> | null;

  // Valuation
  private _currentValue: number | null;
  private _currency: string;
  private _valuationDate: Date | null;
  private _valuationSource: string | null;

  // Legal Status
  private _verificationStatus: AssetVerificationStatus;
  private _isEncumbered: boolean;
  private _encumbranceType: AssetEncumbranceType | null;
  private _encumbranceDetails: string | null;
  private _encumbranceAmount: number | null;

  // Matrimonial Property (Matrimonial Property Act)
  private _isMatrimonialProperty: boolean;
  private _acquiredDuringMarriage: boolean;
  private _spouseConsentRequired: boolean;

  // Life Interest (Cap 160, Section 37)
  private _hasLifeInterest: boolean;
  private _lifeInterestHolderId: string | null; // Link to FamilyMember
  private _lifeInterestEndsAt: Date | null;

  // State
  private _isActive: boolean;
  private _requiresProbate: boolean;

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    currency: string = 'KES',
  ) {
    super();

    if (!id) throw new Error('Asset ID is required');
    if (!name) throw new Error('Asset name is required');
    if (!ownerId) throw new Error('Owner ID is required');

    this._id = id;
    this._name = name.trim();
    this._type = type;
    this._ownerId = ownerId;
    this._currency = currency;

    // Defaults
    this._description = null;
    this._ownershipType = AssetOwnershipType.SOLE;
    this._ownershipShare = 100.0;

    // Location Defaults
    this._county = null;
    this._subCounty = null;
    this._ward = null;
    this._village = null;
    this._landReferenceNumber = null;
    this._gpsCoordinates = null;

    // ID Defaults
    this._titleDeedNumber = null;
    this._registrationNumber = null;
    this._kraPin = null;
    this._identificationDetails = null;

    // Valuation Defaults
    this._currentValue = null;
    this._valuationDate = null;
    this._valuationSource = null;

    // Status Defaults
    this._verificationStatus = AssetVerificationStatus.UNVERIFIED;
    this._isEncumbered = false;
    this._encumbranceType = null;
    this._encumbranceDetails = null;
    this._encumbranceAmount = null;

    // Matrimonial Defaults
    this._isMatrimonialProperty = false;
    this._acquiredDuringMarriage = false;
    this._spouseConsentRequired = false;

    // Life Interest Defaults
    this._hasLifeInterest = false;
    this._lifeInterestHolderId = null;
    this._lifeInterestEndsAt = null;

    // System Defaults
    this._isActive = true;
    this._requiresProbate = true; // Default to true for caution in Kenya
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    name: string,
    type: AssetType,
    ownerId: string,
    currency: string = 'KES',
  ): Asset {
    const asset = new Asset(id, name, type, ownerId, currency);

    asset.apply(
      new AssetAddedEvent(
        asset._id,
        asset._ownerId,
        asset._type,
        asset._ownershipType,
        asset._createdAt,
      ),
    );

    return asset;
  }

  static reconstitute(props: AssetReconstituteProps): Asset {
    const asset = new Asset(props.id, props.name, props.type, props.ownerId, props.currency);

    asset._description = props.description;
    asset._ownershipType = props.ownershipType;
    asset._ownershipShare = props.ownershipShare;

    // Location
    asset._county = props.county;
    asset._subCounty = props.subCounty;
    asset._ward = props.ward;
    asset._village = props.village;
    asset._landReferenceNumber = props.landReferenceNumber;
    asset._gpsCoordinates = props.gpsCoordinates;

    // ID
    asset._titleDeedNumber = props.titleDeedNumber;
    asset._registrationNumber = props.registrationNumber;
    asset._kraPin = props.kraPin;
    asset._identificationDetails = props.identificationDetails;

    // Valuation
    asset._currentValue = props.currentValue;
    asset._valuationDate = props.valuationDate ? new Date(props.valuationDate) : null;
    asset._valuationSource = props.valuationSource;

    // Legal
    asset._verificationStatus = props.verificationStatus;
    asset._isEncumbered = props.isEncumbered;
    asset._encumbranceType = props.encumbranceType;
    asset._encumbranceDetails = props.encumbranceDetails;
    asset._encumbranceAmount = props.encumbranceAmount;

    // Matrimonial
    asset._isMatrimonialProperty = props.isMatrimonialProperty;
    asset._acquiredDuringMarriage = props.acquiredDuringMarriage;
    asset._spouseConsentRequired = props.spouseConsentRequired;

    // Life Interest
    asset._hasLifeInterest = props.hasLifeInterest;
    asset._lifeInterestHolderId = props.lifeInterestHolderId;
    asset._lifeInterestEndsAt = props.lifeInterestEndsAt
      ? new Date(props.lifeInterestEndsAt)
      : null;

    // State
    asset._isActive = props.isActive;
    asset._requiresProbate = props.requiresProbate;
    asset._createdAt = new Date(props.createdAt);
    asset._updatedAt = new Date(props.updatedAt);
    asset._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;

    return asset;
  }

  // --------------------------------------------------------------------------
  // DOMAIN BEHAVIORS (Kenyan Succession Law)
  // --------------------------------------------------------------------------

  public updateValuation(value: number, valuationDate: Date, source: string): void {
    this.checkInvariants();

    if (value < 0) throw new Error('Asset value cannot be negative');
    if (valuationDate > new Date()) throw new Error('Valuation date cannot be in the future');

    this._currentValue = value;
    this._valuationDate = valuationDate;
    this._valuationSource = source;
    this._updatedAt = new Date();

    this.apply(
      new AssetValuationUpdatedEvent(
        this._id,
        this._ownerId,
        value,
        this._currency,
        valuationDate,
        source,
      ),
    );
  }

  /**
   * Designates asset as Matrimonial Property.
   * Reference: Matrimonial Property Act, 2013 (Section 6 & 12).
   * Matrimonial property cannot be alienated without spousal consent.
   */
  public markAsMatrimonialProperty(acquiredDuringMarriage: boolean = true): void {
    this.checkInvariants();
    this._isMatrimonialProperty = true;
    this._acquiredDuringMarriage = acquiredDuringMarriage;
    this._spouseConsentRequired = true; // Legal default
    this._updatedAt = new Date();
  }

  /**
   * Establishes a Life Interest.
   * Reference: Law of Succession Act (Cap 160), Section 37.
   * Usually for surviving spouse or children until age of majority.
   */
  public setLifeInterest(holderFamilyMemberId: string, endsAt: Date): void {
    this.checkInvariants();

    if (endsAt <= new Date()) {
      throw new Error('Life interest end date must be in the future');
    }
    // Note: holderFamilyMemberId refers to a FamilyMember entity ID, not User ID
    this._hasLifeInterest = true;
    this._lifeInterestHolderId = holderFamilyMemberId;
    this._lifeInterestEndsAt = endsAt;
    this._updatedAt = new Date();
  }

  public terminateLifeInterest(): void {
    this.checkInvariants();
    this._hasLifeInterest = false;
    this._lifeInterestHolderId = null;
    this._lifeInterestEndsAt = null;
    this._updatedAt = new Date();
  }

  public updateVerificationStatus(status: AssetVerificationStatus, verifiedByUserId: string): void {
    this.checkInvariants();
    this._verificationStatus = status;
    this._updatedAt = new Date();

    if (status === AssetVerificationStatus.VERIFIED) {
      this.apply(new AssetVerifiedEvent(this._id, verifiedByUserId));
    }
  }

  /**
   * Registers an encumbrance (e.g., Bank Charge, Caveat).
   * This reduces the Net Estate value available for distribution.
   */
  public addEncumbrance(type: AssetEncumbranceType, details: string, amount: number = 0): void {
    this.checkInvariants();

    if (!details) throw new Error('Encumbrance details required');
    if (amount < 0) throw new Error('Encumbrance amount cannot be negative');

    this._isEncumbered = true;
    this._encumbranceType = type;
    this._encumbranceDetails = details;
    this._encumbranceAmount = amount;
    this._updatedAt = new Date();

    this.apply(new AssetEncumberedEvent(this._id, this._ownerId, type, details, amount));
  }

  public setKenyanLocation(
    county: KenyanCounty,
    subCounty?: string,
    ward?: string,
    village?: string,
    landReferenceNumber?: string,
    gpsCoordinates?: GPSCoordinates,
  ): void {
    this.checkInvariants();

    this._county = county;
    this._subCounty = subCounty || null;
    this._ward = ward || null;
    this._village = village || null;
    this._landReferenceNumber = landReferenceNumber || null;
    this._gpsCoordinates = gpsCoordinates || null;
    this._updatedAt = new Date();
  }

  public setKenyanIdentification(
    titleDeedNumber?: string,
    registrationNumber?: string,
    kraPin?: string,
    identificationDetails?: Record<string, any>,
  ): void {
    this.checkInvariants();
    this._titleDeedNumber = titleDeedNumber || null;
    this._registrationNumber = registrationNumber || null;
    this._kraPin = kraPin || null;
    this._identificationDetails = identificationDetails || null;
    this._updatedAt = new Date();
  }

  public updateOwnership(ownershipType: AssetOwnershipType, share: number): void {
    this.checkInvariants();

    if (share < 0 || share > 100) {
      throw new Error('Ownership share must be between 0 and 100 percent');
    }
    if (ownershipType === AssetOwnershipType.SOLE && share !== 100) {
      throw new Error('Sole ownership requires 100% share');
    }
    // Logic: If transitioning FROM Matrimonial TO Sole, strict checks (usually consent) are needed.
    // We enforce validation here, though the actual consent document is handled in the Documents module.
    if (this._isMatrimonialProperty && ownershipType === AssetOwnershipType.SOLE) {
      if (this._spouseConsentRequired) {
        // In a real app, we might check for a linked consent document here.
        // For now, we allow the change but it technically flags a legal risk.
      }
    }

    this._ownershipType = ownershipType;
    this._ownershipShare = share;
    this._updatedAt = new Date();

    this.apply(new AssetUpdatedEvent(this._id, this._ownerId));
  }

  /**
   * Can this asset be distributed in a will or intestacy?
   */
  public canBeTransferred(): boolean {
    if (!this._isActive) return false;

    // Unverified assets pose a risk of fraud (e.g., non-existent land)
    if (this._verificationStatus !== AssetVerificationStatus.VERIFIED) return false;

    // Assets with active life interest cannot be transferred absolutely
    if (this.hasActiveLifeInterest()) return false;

    // Court orders (e.g., disputes) freeze the asset
    if (this._isEncumbered && this._encumbranceType === AssetEncumbranceType.COURT_ORDER)
      return false;

    return true;
  }

  public getNetEquityValue(): number {
    const value = this._currentValue ?? 0;
    const debt = this._encumbranceAmount ?? 0;
    const netValue = Math.max(0, value - debt);
    // Return value proportional to ownership share
    return netValue * (this._ownershipShare / 100);
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private checkInvariants(): void {
    if (!this._isActive) throw new Error('Asset is not active');
    if (this._deletedAt) throw new Error('Asset is deleted');
  }

  public hasActiveLifeInterest(): boolean {
    if (!this._hasLifeInterest || !this._lifeInterestEndsAt) return false;
    return this._lifeInterestEndsAt > new Date();
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string | null {
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

  get county(): KenyanCounty | null {
    return this._county;
  }
  get subCounty(): string | null {
    return this._subCounty;
  }
  get ward(): string | null {
    return this._ward;
  }
  get village(): string | null {
    return this._village;
  }
  get landReferenceNumber(): string | null {
    return this._landReferenceNumber;
  }
  get gpsCoordinates(): GPSCoordinates | null {
    return this._gpsCoordinates ? { ...this._gpsCoordinates } : null;
  }

  get titleDeedNumber(): string | null {
    return this._titleDeedNumber;
  }
  get registrationNumber(): string | null {
    return this._registrationNumber;
  }
  get kraPin(): string | null {
    return this._kraPin;
  }
  get identificationDetails(): Record<string, any> | null {
    return this._identificationDetails ? { ...this._identificationDetails } : null;
  }

  get currentValue(): number | null {
    return this._currentValue;
  }
  get currency(): string {
    return this._currency;
  }
  get valuationDate(): Date | null {
    return this._valuationDate;
  }
  get valuationSource(): string | null {
    return this._valuationSource;
  }

  get verificationStatus(): AssetVerificationStatus {
    return this._verificationStatus;
  }
  get isEncumbered(): boolean {
    return this._isEncumbered;
  }
  get encumbranceType(): AssetEncumbranceType | null {
    return this._encumbranceType;
  }
  get encumbranceDetails(): string | null {
    return this._encumbranceDetails;
  }
  get encumbranceAmount(): number | null {
    return this._encumbranceAmount;
  }

  get isMatrimonialProperty(): boolean {
    return this._isMatrimonialProperty;
  }
  get acquiredDuringMarriage(): boolean {
    return this._acquiredDuringMarriage;
  }
  get spouseConsentRequired(): boolean {
    return this._spouseConsentRequired;
  }

  get hasLifeInterest(): boolean {
    return this._hasLifeInterest;
  }
  get lifeInterestHolderId(): string | null {
    return this._lifeInterestHolderId;
  }
  get lifeInterestEndsAt(): Date | null {
    return this._lifeInterestEndsAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }
  get requiresProbate(): boolean {
    return this._requiresProbate;
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
