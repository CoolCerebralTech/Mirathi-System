import { AggregateRoot } from '../../../base/aggregate-root';
import { UniqueEntityID } from '../../../base/entity';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';
import { Currency, Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';
import { AssetAddedToEstateEvent } from '../events/asset-added.event';
import { AssetEncumberedEvent } from '../events/asset-encumbered.event';
import { AssetLifeInterestCreatedEvent } from '../events/asset-life-interest-created.event';
import { AssetValueUpdatedEvent } from '../events/asset-value-updated.event';
import {
  AssetDetails,
  AssetType,
  BusinessAssetDetails,
  FinancialAssetDetails,
  LandAssetDetails,
  VehicleAssetDetails,
  isBusinessAssetDetails,
  isFinancialAssetDetails,
  isLandAssetDetails,
  isVehicleAssetDetails,
} from '../value-objects/asset-details.vo';
import { Valuation } from '../value-objects/valuation.vo';

export enum AssetOwnershipType {
  SOLE = 'SOLE',
  JOINT_TENANCY = 'JOINT_TENANCY',
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON',
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY',
}

export enum AssetVerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  DISPUTED = 'DISPUTED',
}

export enum AssetEncumbranceType {
  MORTGAGE = 'MORTGAGE',
  CHARGE = 'CHARGE',
  LIEN = 'LIEN',
  COURT_ORDER = 'COURT_ORDER',
  FAMILY_CLAIM = 'FAMILY_CLAIM',
  OTHER = 'OTHER',
}

interface AssetProps {
  estateId: UniqueEntityID;
  ownerId: UniqueEntityID;

  // Core Asset Data
  name: string;
  description: string | null;
  type: AssetType;

  // Ownership Details
  ownershipType: AssetOwnershipType;
  ownershipShare: Percentage;

  // Legal Status
  isMatrimonialProperty: boolean;
  acquiredDuringMarriage: boolean;
  spouseConsentObtained: boolean;
  spouseConsentDate: Date | null;

  // Life Interest (S. 35(1)(b) LSA)
  hasLifeInterest: boolean;
  lifeInterestHolderId: UniqueEntityID | null;
  lifeInterestEndsAt: Date | null;

  // Encumbrance
  isEncumbered: boolean;
  encumbranceType: AssetEncumbranceType | null;
  encumbranceAmount: Money | null;
  encumbranceDetails: string | null;

  // Probate Requirements
  requiresProbate: boolean;

  // Verification
  verificationStatus: AssetVerificationStatus;
  verifiedBy: UniqueEntityID | null;
  verifiedAt: Date | null;
  rejectionReason: string | null;

  // Kenyan Identification
  titleDeedNumber: string | null;
  registrationNumber: string | null;
  kraPin: KenyanId | null;
  identificationDetails: Record<string, any> | null;

  // Location
  location: KenyanLocation | null;

  // Polymorphic Details
  details: AssetDetails | null;

  // Valuation
  currentValuation: Valuation | null;
  valuationHistory: Valuation[];

  // Co-owners (stored as IDs, managed by separate aggregate)
  coOwnerIds: UniqueEntityID[];

  // Management
  isActive: boolean;
  deletedAt: Date | null;
}

export class Asset extends AggregateRoot<AssetProps> {
  private constructor(props: AssetProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: {
      estateId: string;
      ownerId: string;
      name: string;
      description?: string;
      type: AssetType;
      ownershipType?: AssetOwnershipType;
      ownershipShare?: number;
      isMatrimonialProperty?: boolean;
      acquiredDuringMarriage?: boolean;
      details?: AssetDetails;
      location?: KenyanLocation;
      titleDeedNumber?: string;
      registrationNumber?: string;
      kraPin?: KenyanId;
      requiresProbate?: boolean;
    },
    id?: string,
  ): Result<Asset> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.estateId, argumentName: 'estateId' },
      { argument: props.ownerId, argumentName: 'ownerId' },
      { argument: props.name, argumentName: 'name' },
      { argument: props.type, argumentName: 'type' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<Asset>(guardResult.message);
    }

    // Validate name
    if (props.name.trim().length < 2) {
      return Result.fail<Asset>('Asset name must be at least 2 characters');
    }

    // Create ownership share percentage
    const ownershipShareResult = Percentage.create(props.ownershipShare || 100);
    if (ownershipShareResult.isFailure) {
      return Result.fail<Asset>(ownershipShareResult.errorValue());
    }

    // Validate details match type
    if (props.details && props.details.type !== props.type) {
      return Result.fail<Asset>(
        `Asset details type (${props.details.type}) must match asset type (${props.type})`,
      );
    }

    const assetId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const ownerId = new UniqueEntityID(props.ownerId);

    const defaultProps: AssetProps = {
      estateId,
      ownerId,
      name: props.name.trim(),
      description: props.description?.trim() || null,
      type: props.type,
      ownershipType: props.ownershipType || AssetOwnershipType.SOLE,
      ownershipShare: ownershipShareResult.getValue(),
      isMatrimonialProperty: props.isMatrimonialProperty || false,
      acquiredDuringMarriage: props.acquiredDuringMarriage || false,
      spouseConsentObtained: false,
      spouseConsentDate: null,
      hasLifeInterest: false,
      lifeInterestHolderId: null,
      lifeInterestEndsAt: null,
      isEncumbered: false,
      encumbranceType: null,
      encumbranceAmount: null,
      encumbranceDetails: null,
      requiresProbate: props.requiresProbate !== undefined ? props.requiresProbate : true,
      verificationStatus: AssetVerificationStatus.UNVERIFIED,
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
      titleDeedNumber: props.titleDeedNumber || null,
      registrationNumber: props.registrationNumber || null,
      kraPin: props.kraPin || null,
      identificationDetails: null,
      location: props.location || null,
      details: props.details || null,
      currentValuation: null,
      valuationHistory: [],
      coOwnerIds: [],
      isActive: true,
      deletedAt: null,
    };

    const asset = new Asset(defaultProps, assetId);

    // Add domain event for asset creation
    asset.addDomainEvent(
      new AssetAddedToEstateEvent({
        assetId: asset.id.toString(),
        estateId: asset.props.estateId.toString(),
        assetType: asset.props.type,
        assetName: asset.props.name,
        createdAt: new Date(),
      }),
    );

    return Result.ok<Asset>(asset);
  }

  // ==================== BUSINESS METHODS ====================

  // Valuation Management
  public addValuation(valuation: Valuation): Result<void> {
    // Validate valuation
    if (!valuation) {
      return Result.fail('Valuation cannot be null');
    }

    // For Kenyan probate, land valuations must be by registered valuer
    if (this.props.type === AssetType.LAND_PARCEL && this.props.requiresProbate) {
      if (!valuation.props.isRegisteredValuer) {
        return Result.fail('Land assets for probate require valuation by registered valuer');
      }
    }

    this.props.currentValuation = valuation;
    this.props.valuationHistory.push(valuation);

    this.addDomainEvent(
      new AssetValueUpdatedEvent({
        assetId: this.id.toString(),
        newValue: valuation.props.value.amount,
        currency: valuation.props.value.currency,
        valuedBy: valuation.props.valuedBy,
        valuationDate: valuation.props.valuationDate,
        valuationPurpose: valuation.props.purpose,
      }),
    );

    return Result.ok();
  }

  public getCurrentValue(): Money | null {
    return this.props.currentValuation?.props.value || null;
  }

  // Encumbrance Management
  public addEncumbrance(
    encumbranceType: AssetEncumbranceType,
    amount: Money,
    details: string,
  ): Result<void> {
    // Validate
    if (this.props.isEncumbered) {
      return Result.fail('Asset is already encumbered');
    }

    if (amount.amount <= 0) {
      return Result.fail('Encumbrance amount must be positive');
    }

    // For Kenyan law: Mortgage must be registered
    if (
      encumbranceType === AssetEncumbranceType.MORTGAGE &&
      this.props.type === AssetType.LAND_PARCEL
    ) {
      if (!this.props.titleDeedNumber) {
        return Result.fail('Land assets require title deed number for mortgage registration');
      }
    }

    this.props.isEncumbered = true;
    this.props.encumbranceType = encumbranceType;
    this.props.encumbranceAmount = amount;
    this.props.encumbranceDetails = details;

    this.addDomainEvent(
      new AssetEncumberedEvent({
        assetId: this.id.toString(),
        encumbranceType,
        amount: amount.amount,
        currency: amount.currency,
        details,
        encumberedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  public removeEncumbrance(): Result<void> {
    if (!this.props.isEncumbered) {
      return Result.fail('Asset is not encumbered');
    }

    this.props.isEncumbered = false;
    this.props.encumbranceType = null;
    this.props.encumbranceAmount = null;
    this.props.encumbranceDetails = null;

    return Result.ok();
  }

  // Life Interest Management (S. 35(1)(b) LSA)
  public addLifeInterest(
    holderId: string,
    endsAt: Date,
    reason: string = 'Surviving spouse life interest under S.35(1)(b) LSA',
  ): Result<void> {
    // Validate
    if (this.props.hasLifeInterest) {
      return Result.fail('Asset already has a life interest');
    }

    if (endsAt <= new Date()) {
      return Result.fail('Life interest end date must be in the future');
    }

    // Only certain assets can have life interests under Kenyan law
    if (![AssetType.LAND_PARCEL, AssetType.PROPERTY].includes(this.props.type)) {
      return Result.fail('Life interests can only be created on land or property assets');
    }

    // Must be matrimonial property for spouse life interest
    if (!this.props.isMatrimonialProperty) {
      return Result.warn('Creating life interest on non-matrimonial property');
    }

    this.props.hasLifeInterest = true;
    this.props.lifeInterestHolderId = new UniqueEntityID(holderId);
    this.props.lifeInterestEndsAt = endsAt;

    this.addDomainEvent(
      new AssetLifeInterestCreatedEvent({
        assetId: this.id.toString(),
        holderId,
        endsAt,
        reason,
        createdAt: new Date(),
      }),
    );

    return Result.ok();
  }

  public terminateLifeInterest(): Result<void> {
    if (!this.props.hasLifeInterest) {
      return Result.fail('Asset does not have a life interest');
    }

    this.props.hasLifeInterest = false;
    this.props.lifeInterestHolderId = null;
    this.props.lifeInterestEndsAt = null;

    return Result.ok();
  }

  // Matrimonial Property Management (Matrimonial Property Act 2013)
  public markAsMatrimonialProperty(
    acquiredDuringMarriage: boolean,
    spouseConsentObtained: boolean,
    spouseConsentDate?: Date,
  ): Result<void> {
    // Only certain assets can be matrimonial property
    if (
      [
        AssetType.LAND_PARCEL,
        AssetType.PROPERTY,
        AssetType.FINANCIAL_ASSET,
        AssetType.BUSINESS_INTEREST,
      ].includes(this.props.type)
    ) {
      this.props.isMatrimonialProperty = true;
      this.props.acquiredDuringMarriage = acquiredDuringMarriage;
      this.props.spouseConsentObtained = spouseConsentObtained;
      this.props.spouseConsentDate = spouseConsentDate || null;
      return Result.ok();
    }

    return Result.fail('This asset type cannot be classified as matrimonial property');
  }

  // Verification Workflow
  public markAsVerified(verifiedBy: string, notes?: string): Result<void> {
    if (this.props.verificationStatus === AssetVerificationStatus.VERIFIED) {
      return Result.fail('Asset is already verified');
    }

    // Land assets require title deed verification
    if (this.props.type === AssetType.LAND_PARCEL && !this.props.titleDeedNumber) {
      return Result.fail('Land assets require title deed number for verification');
    }

    this.props.verificationStatus = AssetVerificationStatus.VERIFIED;
    this.props.verifiedBy = new UniqueEntityID(verifiedBy);
    this.props.verifiedAt = new Date();

    return Result.ok();
  }

  public rejectVerification(rejectedBy: string, reason: string): Result<void> {
    if (this.props.verificationStatus === AssetVerificationStatus.REJECTED) {
      return Result.fail('Asset is already rejected');
    }

    this.props.verificationStatus = AssetVerificationStatus.REJECTED;
    this.props.verifiedBy = new UniqueEntityID(rejectedBy);
    this.props.verifiedAt = new Date();
    this.props.rejectionReason = reason;

    return Result.ok();
  }

  // Co-owner Management
  public addCoOwner(coOwnerId: string, sharePercentage: number): Result<void> {
    // Validate share percentage
    const shareResult = Percentage.create(sharePercentage);
    if (shareResult.isFailure) {
      return Result.fail(shareResult.errorValue());
    }

    const totalShare = this.props.coOwnerIds.length * 100 + sharePercentage;
    if (totalShare > 100) {
      return Result.fail('Total co-owner shares cannot exceed 100%');
    }

    const ownerId = new UniqueEntityID(coOwnerId);

    // Check if already a co-owner
    if (this.props.coOwnerIds.some((id) => id.equals(ownerId))) {
      return Result.fail('User is already a co-owner of this asset');
    }

    this.props.coOwnerIds.push(ownerId);

    // Update ownership type if needed
    if (this.props.coOwnerIds.length > 0 && this.props.ownershipType === AssetOwnershipType.SOLE) {
      this.props.ownershipType = AssetOwnershipType.TENANCY_IN_COMMON;
    }

    return Result.ok();
  }

  public removeCoOwner(coOwnerId: string): Result<void> {
    const ownerId = new UniqueEntityID(coOwnerId);
    const index = this.props.coOwnerIds.findIndex((id) => id.equals(ownerId));

    if (index === -1) {
      return Result.fail('User is not a co-owner of this asset');
    }

    this.props.coOwnerIds.splice(index, 1);

    // Revert to sole ownership if no co-owners left
    if (this.props.coOwnerIds.length === 0) {
      this.props.ownershipType = AssetOwnershipType.SOLE;
    }

    return Result.ok();
  }

  // Kenyan Legal Compliance Methods
  public getProbateRequirements(): string[] {
    const requirements: string[] = [];

    if (this.props.requiresProbate) {
      requirements.push('Requires inclusion in probate inventory');

      if (this.props.type === AssetType.LAND_PARCEL) {
        requirements.push('Original title deed or certified copy');
        requirements.push('Land rates clearance certificate');
        requirements.push('Survey map from Survey of Kenya');
      }

      if (this.props.type === AssetType.FINANCIAL_ASSET) {
        requirements.push('Bank statements as at date of death');
        requirements.push('Death certificate notification to bank');
      }

      if (this.props.type === AssetType.VEHICLE) {
        requirements.push('Original logbook');
        requirements.push('NTSA transfer forms');
      }

      if (this.props.type === AssetType.BUSINESS_INTEREST) {
        requirements.push('Company registry search certificate');
        requirements.push('Share certificate');
      }
    }

    return requirements;
  }

  public calculateNetValue(): Money | null {
    const currentValue = this.getCurrentValue();
    if (!currentValue) return null;

    if (this.props.isEncumbered && this.props.encumbranceAmount) {
      return currentValue.subtract(this.props.encumbranceAmount);
    }

    return currentValue;
  }

  public getTransferRequirements(): string[] {
    const requirements: string[] = [
      'Grant of representation (probate or letters of administration)',
    ];

    if (this.props.isEncumbered) {
      requirements.push('Encumbrance clearance from lender');
    }

    if (this.props.hasLifeInterest) {
      requirements.push('Life interest termination or consent');
    }

    if (this.props.isMatrimonialProperty) {
      requirements.push('Spouse consent if not the surviving spouse');
    }

    if (this.props.coOwnerIds.length > 0) {
      requirements.push('Co-owner consent for transfer');
    }

    // Type-specific requirements
    if (isLandAssetDetails(this.props.details)) {
      requirements.push('Stamp duty payment (KRA)');
      requirements.push('Capital Gains Tax clearance if applicable');
      requirements.push('Land control board consent for agricultural land');
    }

    if (isVehicleAssetDetails(this.props.details)) {
      requirements.push('NTSA transfer fee payment');
      requirements.push('Insurance transfer');
    }

    return requirements;
  }

  // Soft Delete
  public delete(deletedBy: string, reason: string): Result<void> {
    if (this.props.deletedAt) {
      return Result.fail('Asset is already deleted');
    }

    // Cannot delete assets with encumbrances
    if (this.props.isEncumbered) {
      return Result.fail('Cannot delete encumbered asset');
    }

    // Cannot delete verified assets without proper authorization
    if (this.props.verificationStatus === AssetVerificationStatus.VERIFIED) {
      return Result.warn('Deleting verified asset requires audit trail');
    }

    this.props.deletedAt = new Date();
    this.props.isActive = false;

    return Result.ok();
  }

  public restore(): Result<void> {
    if (!this.props.deletedAt) {
      return Result.fail('Asset is not deleted');
    }

    this.props.deletedAt = null;
    this.props.isActive = true;

    return Result.ok();
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): AssetType {
    return this.props.type;
  }

  get ownershipType(): AssetOwnershipType {
    return this.props.ownershipType;
  }

  get ownershipShare(): Percentage {
    return this.props.ownershipShare;
  }

  get isMatrimonialProperty(): boolean {
    return this.props.isMatrimonialProperty;
  }

  get hasLifeInterest(): boolean {
    return this.props.hasLifeInterest;
  }

  get isEncumbered(): boolean {
    return this.props.isEncumbered;
  }

  get requiresProbate(): boolean {
    return this.props.requiresProbate;
  }

  get verificationStatus(): AssetVerificationStatus {
    return this.props.verificationStatus;
  }

  get currentValuation(): Valuation | null {
    return this.props.currentValuation;
  }

  get details(): AssetDetails | null {
    return this.props.details;
  }

  get location(): KenyanLocation | null {
    return this.props.location;
  }

  get coOwnerIds(): UniqueEntityID[] {
    return [...this.props.coOwnerIds];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Computed properties
  get canBeTransferred(): boolean {
    return (
      this.props.isActive &&
      this.props.verificationStatus === AssetVerificationStatus.VERIFIED &&
      !this.props.deletedAt
    );
  }

  get isJointTenancy(): boolean {
    return this.props.ownershipType === AssetOwnershipType.JOINT_TENANCY;
  }

  get hasRightOfSurvivorship(): boolean {
    // Joint tenancy assets pass automatically to surviving owners
    return this.isJointTenancy;
  }

  get isSubjectToHotchpot(): boolean {
    // Gifts inter vivos are subject to hotchpot under S.35(3)
    return false; // This would be determined by GiftInterVivos entity
  }

  // Static factory for specific asset types
  public static createLandAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    landDetails: LandAssetDetails;
    titleDeedNumber: string;
    location: KenyanLocation;
    description?: string;
    ownershipShare?: number;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.LAND_PARCEL,
      details: props.landDetails,
      titleDeedNumber: props.titleDeedNumber,
      location: props.location,
    });
  }

  public static createFinancialAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    financialDetails: FinancialAssetDetails;
    description?: string;
    ownershipShare?: number;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.FINANCIAL_ASSET,
      details: props.financialDetails,
      requiresProbate: false, // Some financial assets may not require probate
    });
  }

  public static createVehicleAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    vehicleDetails: VehicleAssetDetails;
    description?: string;
    ownershipShare?: number;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.VEHICLE,
      details: props.vehicleDetails,
    });
  }

  public static createBusinessAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    businessDetails: BusinessAssetDetails;
    description?: string;
    ownershipShare?: number;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.BUSINESS_INTEREST,
      details: props.businessDetails,
    });
  }
}
