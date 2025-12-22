// src/domain/aggregates/estate/entities/asset.entity.ts
import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/unique-entity-id';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';
import { Money } from '../../../shared/money.vo';
import { OwnershipPercentage, OwnershipType } from '../../../shared/ownership-percentage.vo';
import { Percentage } from '../../../shared/percentage.vo';
import {
  AssetDetails,
  AssetType,
  BusinessAssetDetails,
  FinancialAssetDetails,
  LandAssetDetails,
  VehicleAssetDetails,
  isLandAssetDetails,
  isVehicleAssetDetails,
} from '../value-objects/asset-details.vo';
import { Valuation } from '../value-objects/valuation.vo';

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

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FROZEN = 'FROZEN', // Court order or dispute
  TRANSFERRED = 'TRANSFERRED',
  LIQUIDATED = 'LIQUIDATED',
}

interface AssetProps {
  // Core Identifiers
  estateId: UniqueEntityID;
  ownerId: UniqueEntityID;

  // Core Asset Data
  name: string;
  description: string | null;
  type: AssetType;

  // Ownership Structure (Kenyan Law)
  ownershipPercentage: OwnershipPercentage;

  // Legal Status (Matrimonial Property Act 2013)
  isMatrimonialProperty: boolean;
  acquiredDuringMarriage: boolean;
  spouseConsentObtained: boolean;
  spouseConsentDate: Date | null;
  spouseConsentDocumentId: string | null;

  // Life Interest (S. 35(1)(b) LSA)
  hasLifeInterest: boolean;
  lifeInterestHolderId: UniqueEntityID | null;
  lifeInterestHolderName: string | null;
  lifeInterestStartDate: Date | null;
  lifeInterestEndDate: Date | null;
  lifeInterestPurpose: string | null;
  lifeInterestRegistered: boolean; // Registered with Lands Registry

  // Encumbrance & Security
  isEncumbered: boolean;
  encumbranceType: AssetEncumbranceType | null;
  encumbranceAmount: Money | null;
  encumbranceDate: Date | null;
  encumbranceDetails: string | null;
  encumbranceDocumentId: string | null;

  // Probate & Succession Requirements
  requiresProbate: boolean;
  probateRequirementNotes: string | null;
  includedInEstateInventory: boolean;
  inventoryDate: Date | null;

  // Verification & Compliance
  verificationStatus: AssetVerificationStatus;
  verifiedBy: UniqueEntityID | null;
  verifiedAt: Date | null;
  verificationMethod: string | null; // "TITLE_DEED_VERIFICATION", "BANK_CONFIRMATION", etc.
  rejectionReason: string | null;
  verificationDocumentId: string | null;

  // Kenyan Registration & Identification
  titleDeedNumber: string | null;
  registrationNumber: string | null;
  kraPin: KenyanId | null;
  landReferenceNumber: string | null; // For agricultural land
  parcelNumber: string | null;
  identificationDetails: Record<string, any> | null;

  // Location & Physical Details
  location: KenyanLocation | null;
  gpsCoordinates: string | null;
  physicalAddress: string | null;

  // Polymorphic Asset Details
  details: AssetDetails | null;

  // Valuation & Financial Tracking
  currentValuation: Valuation | null;
  valuationHistory: Valuation[];
  purchasePrice: Money | null;
  purchaseDate: Date | null;
  acquisitionMethod: string | null; // "PURCHASE", "INHERITANCE", "GIFT", "SETTLEMENT"

  // Co-ownership Structure
  coOwnerIds: UniqueEntityID[];
  coOwnerShares: Map<string, Percentage>; // coOwnerId -> percentage

  // Management & Status
  status: AssetStatus;
  isManagedByExecutor: boolean;
  executorManagementStartDate: Date | null;

  // Kenyan Tax Compliance
  stampDutyPaid: boolean;
  stampDutyAmount: Money | null;
  stampDutyReceiptNumber: string | null;
  capitalGainsTaxLiability: Money | null;
  cgtPaid: boolean;
  cgtReceiptNumber: string | null;

  // Transfer & Transmission
  transferRestrictions: string | null;
  transmissionRequirements: string[];

  // Audit & Metadata
  createdBy: UniqueEntityID | null;
  lastModifiedBy: UniqueEntityID | null;
  notes: string | null;
}

export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps, id?: UniqueEntityID) {
    super(id, props);
  }

  public static create(
    props: {
      estateId: string;
      ownerId: string;
      name: string;
      description?: string;
      type: AssetType;
      ownershipType?: OwnershipType;
      ownershipShare?: number;
      details?: AssetDetails;
      location?: KenyanLocation;
      titleDeedNumber?: string;
      registrationNumber?: string;
      kraPin?: KenyanId;
      requiresProbate?: boolean;
      createdBy?: string;
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

    // Validate ownership share percentage
    const ownershipShare = props.ownershipShare || 100;
    const ownershipPercentageResult = OwnershipPercentage.create(
      ownershipShare,
      props.ownershipType || OwnershipType.SOLE,
    );

    if (ownershipPercentageResult.isFailure) {
      return Result.fail<Asset>(ownershipPercentageResult.errorValue());
    }

    // Validate details match type
    if (props.details && props.details.type !== props.type) {
      return Result.fail<Asset>(
        `Asset details type (${props.details.type}) must match asset type (${props.type})`,
      );
    }

    // Kenyan-specific validations
    if (props.type === AssetType.LAND_PARCEL && !props.titleDeedNumber) {
      return Result.warn<Asset>(
        'Land assets should have a title deed number for proper registration',
      );
    }

    if (props.type === AssetType.FINANCIAL_ASSET && !props.registrationNumber) {
      return Result.warn<Asset>('Financial assets should have account/registration numbers');
    }

    const assetId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const ownerId = new UniqueEntityID(props.ownerId);
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    const defaultProps: AssetProps = {
      estateId,
      ownerId,
      name: props.name.trim(),
      description: props.description?.trim() || null,
      type: props.type,
      ownershipPercentage: ownershipPercentageResult.getValue(),
      isMatrimonialProperty: false,
      acquiredDuringMarriage: false,
      spouseConsentObtained: false,
      spouseConsentDate: null,
      spouseConsentDocumentId: null,
      hasLifeInterest: false,
      lifeInterestHolderId: null,
      lifeInterestHolderName: null,
      lifeInterestStartDate: null,
      lifeInterestEndDate: null,
      lifeInterestPurpose: null,
      lifeInterestRegistered: false,
      isEncumbered: false,
      encumbranceType: null,
      encumbranceAmount: null,
      encumbranceDate: null,
      encumbranceDetails: null,
      encumbranceDocumentId: null,
      requiresProbate: props.requiresProbate !== undefined ? props.requiresProbate : true,
      probateRequirementNotes: null,
      includedInEstateInventory: false,
      inventoryDate: null,
      verificationStatus: AssetVerificationStatus.UNVERIFIED,
      verifiedBy: null,
      verifiedAt: null,
      verificationMethod: null,
      rejectionReason: null,
      verificationDocumentId: null,
      titleDeedNumber: props.titleDeedNumber || null,
      registrationNumber: props.registrationNumber || null,
      kraPin: props.kraPin || null,
      landReferenceNumber: null,
      parcelNumber: null,
      identificationDetails: null,
      location: props.location || null,
      gpsCoordinates: null,
      physicalAddress: null,
      details: props.details || null,
      currentValuation: null,
      valuationHistory: [],
      purchasePrice: null,
      purchaseDate: null,
      acquisitionMethod: null,
      coOwnerIds: [],
      coOwnerShares: new Map(),
      status: AssetStatus.ACTIVE,
      isManagedByExecutor: false,
      executorManagementStartDate: null,
      stampDutyPaid: false,
      stampDutyAmount: null,
      stampDutyReceiptNumber: null,
      capitalGainsTaxLiability: null,
      cgtPaid: false,
      cgtReceiptNumber: null,
      transferRestrictions: null,
      transmissionRequirements: [],
      createdBy,
      lastModifiedBy: createdBy,
      notes: null,
    };

    const asset = new Asset(defaultProps, assetId);
    return Result.ok<Asset>(asset);
  }

  // ==================== BUSINESS METHODS ====================

  // VALUATION MANAGEMENT
  public addValuation(valuation: Valuation, valuedBy: string): Result<void> {
    if (!valuation) {
      return Result.fail('Valuation cannot be null');
    }

    // Kenyan legal requirement: Land valuations for probate must be by registered valuer
    if (this.props.type === AssetType.LAND_PARCEL && this.props.requiresProbate) {
      if (!valuation.props.isRegisteredValuer) {
        return Result.fail('Land assets for probate require valuation by registered valuer');
      }

      if (!valuation.props.valuerRegistrationNumber) {
        return Result.fail('Registered valuer registration number is required for land valuation');
      }
    }

    // Update valuation
    this.props.currentValuation = valuation;
    this.props.valuationHistory.push(valuation);
    this.props.lastModifiedBy = new UniqueEntityID(valuedBy);

    // If valuation shows significant increase, check for capital gains tax
    if (
      this.props.purchasePrice &&
      valuation.props.value.amount > this.props.purchasePrice.amount * 1.1
    ) {
      this.props.capitalGainsTaxLiability = this.calculateCapitalGainsTax();
    }

    return Result.ok();
  }

  public getCurrentValue(): Money | null {
    return this.props.currentValuation?.props.value || null;
  }

  public getNetValue(): Money | null {
    const currentValue = this.getCurrentValue();
    if (!currentValue) return null;

    // Subtract encumbrances
    if (this.props.isEncumbered && this.props.encumbranceAmount) {
      return currentValue.subtract(this.props.encumbranceAmount);
    }

    return currentValue;
  }

  private calculateCapitalGainsTax(): Money | null {
    if (!this.props.purchasePrice || !this.props.currentValuation) {
      return null;
    }

    const gain = this.props.currentValuation.props.value.amount - this.props.purchasePrice.amount;
    if (gain <= 0) return null;

    // Kenya CGT rate: 5% of gain (subject to exemptions)
    const cgtAmount = gain * 0.05;
    return Money.createKES(cgtAmount);
  }

  // ENCUMBRANCE MANAGEMENT
  public addEncumbrance(
    encumbranceType: AssetEncumbranceType,
    amount: Money,
    details: string,
    documentId?: string,
    effectiveDate?: Date,
  ): Result<void> {
    if (this.props.isEncumbered) {
      return Result.fail('Asset is already encumbered');
    }

    if (amount.amount <= 0) {
      return Result.fail('Encumbrance amount must be positive');
    }

    // Kenyan law: Mortgage must be registered with Lands Registry
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
    this.props.encumbranceDocumentId = documentId || null;
    this.props.encumbranceDate = effectiveDate || new Date();

    // Encumbered assets may have transfer restrictions
    this.addTransferRestriction('Subject to encumbrance - Transfer requires lender consent');

    return Result.ok();
  }

  public releaseEncumbrance(
    releaseDocumentId: string,
    releasedBy: string,
    releaseDate: Date = new Date(),
  ): Result<void> {
    if (!this.props.isEncumbered) {
      return Result.fail('Asset is not encumbered');
    }

    // Create release note
    const releaseNote = `Encumbrance released on ${releaseDate.toISOString()} by ${releasedBy}. Document: ${releaseDocumentId}`;
    this.addNote(releaseNote);

    this.props.isEncumbered = false;
    this.props.encumbranceType = null;
    this.props.encumbranceAmount = null;
    this.props.encumbranceDetails = null;
    this.props.lastModifiedBy = new UniqueEntityID(releasedBy);

    // Remove encumbrance restriction
    this.removeTransferRestriction('Subject to encumbrance - Transfer requires lender consent');

    return Result.ok();
  }

  // LIFE INTEREST MANAGEMENT (S. 35(1)(b) LSA)
  public createLifeInterest(
    holderId: string,
    holderName: string,
    endDate: Date,
    purpose: string = 'Surviving spouse life interest under S.35(1)(b) LSA',
    startDate?: Date,
  ): Result<void> {
    if (this.props.hasLifeInterest) {
      return Result.fail('Asset already has a life interest');
    }

    if (endDate <= new Date()) {
      return Result.fail('Life interest end date must be in the future');
    }

    // Only certain assets can have life interests under Kenyan law
    if (
      ![AssetType.LAND_PARCEL, AssetType.PROPERTY, AssetType.BUSINESS_INTEREST].includes(
        this.props.type,
      )
    ) {
      return Result.fail(
        'Life interests can only be created on land, property, or business assets',
      );
    }

    // Land assets: Life interest should be registered
    const shouldRegister = this.props.type === AssetType.LAND_PARCEL;

    this.props.hasLifeInterest = true;
    this.props.lifeInterestHolderId = new UniqueEntityID(holderId);
    this.props.lifeInterestHolderName = holderName;
    this.props.lifeInterestStartDate = startDate || new Date();
    this.props.lifeInterestEndDate = endDate;
    this.props.lifeInterestPurpose = purpose;
    this.props.lifeInterestRegistered = shouldRegister;

    // Add transfer restriction
    this.addTransferRestriction(
      'Subject to life interest - Transfer requires life interest holder consent',
    );

    if (shouldRegister) {
      this.addTransferRequirement('Life interest registration with Lands Registry');
    }

    return Result.ok();
  }

  public terminateLifeInterest(
    terminationReason: string,
    terminatedBy: string,
    terminationDate: Date = new Date(),
  ): Result<void> {
    if (!this.props.hasLifeInterest) {
      return Result.fail('Asset does not have a life interest');
    }

    // Check if termination is before end date
    if (this.props.lifeInterestEndDate && terminationDate < this.props.lifeInterestEndDate) {
      this.addNote(`Life interest terminated early: ${terminationReason}`);
    }

    this.props.hasLifeInterest = false;
    this.props.lifeInterestHolderId = null;
    this.props.lifeInterestHolderName = null;
    this.props.lifeInterestEndDate = terminationDate;
    this.props.lastModifiedBy = new UniqueEntityID(terminatedBy);

    // Remove life interest restriction
    this.removeTransferRestriction(
      'Subject to life interest - Transfer requires life interest holder consent',
    );

    return Result.ok();
  }

  // MATRIMONIAL PROPERTY MANAGEMENT (Matrimonial Property Act 2013)
  public classifyAsMatrimonialProperty(
    acquiredDuringMarriage: boolean,
    spouseConsentDetails?: {
      obtained: boolean;
      consentDate?: Date;
      documentId?: string;
    },
  ): Result<void> {
    // Only certain assets can be matrimonial property
    const eligibleTypes = [
      AssetType.LAND_PARCEL,
      AssetType.PROPERTY,
      AssetType.FINANCIAL_ASSET,
      AssetType.BUSINESS_INTEREST,
      AssetType.VEHICLE,
    ];

    if (!eligibleTypes.includes(this.props.type)) {
      return Result.fail(
        'This asset type cannot be classified as matrimonial property under Kenyan law',
      );
    }

    this.props.isMatrimonialProperty = true;
    this.props.acquiredDuringMarriage = acquiredDuringMarriage;

    if (spouseConsentDetails) {
      this.props.spouseConsentObtained = spouseConsentDetails.obtained;
      this.props.spouseConsentDate = spouseConsentDetails.consentDate || null;
      this.props.spouseConsentDocumentId = spouseConsentDetails.documentId || null;
    }

    // Matrimonial property may have special transfer requirements
    if (!acquiredDuringMarriage) {
      this.addTransferRestriction(
        'Non-matrimonial property - May require court order for transfer',
      );
    }

    return Result.ok();
  }

  // CO-OWNERSHIP MANAGEMENT
  public addCoOwner(coOwnerId: string, sharePercentage: number, modifiedBy: string): Result<void> {
    // Validate share percentage
    const shareResult = Percentage.create(sharePercentage);
    if (shareResult.isFailure) {
      return Result.fail(shareResult.errorValue());
    }

    const ownerId = new UniqueEntityID(coOwnerId);

    // Check if already a co-owner
    if (this.props.coOwnerIds.some((id) => id.equals(ownerId))) {
      return Result.fail('User is already a co-owner of this asset');
    }

    // Calculate total shares
    let totalShare = this.props.ownershipPercentage.percentage;
    this.props.coOwnerShares.forEach((share) => {
      totalShare += share.percentage;
    });

    if (totalShare + sharePercentage > 100) {
      return Result.fail('Total co-owner shares cannot exceed 100%');
    }

    // Add co-owner
    this.props.coOwnerIds.push(ownerId);
    this.props.coOwnerShares.set(coOwnerId, shareResult.getValue());
    this.props.lastModifiedBy = new UniqueEntityID(modifiedBy);

    // Update ownership type if needed
    if (this.props.coOwnerIds.length > 0) {
      // If it was sole ownership, change to tenancy in common
      if (this.props.ownershipPercentage.percentage === 100) {
        // Adjust main owner's share
        const newMainShare = 100 - sharePercentage;
        const ownershipResult = OwnershipPercentage.create(
          newMainShare,
          OwnershipType.TENANCY_IN_COMMON,
        );

        if (ownershipResult.isFailure) {
          return Result.fail(ownershipResult.errorValue());
        }

        this.props.ownershipPercentage = ownershipResult.getValue();
      }
    }

    return Result.ok();
  }

  public removeCoOwner(
    coOwnerId: string,
    modifiedBy: string,
    redistributionMethod: 'TO_MAIN_OWNER' | 'TO_OTHER_COOWNERS' = 'TO_MAIN_OWNER',
  ): Result<void> {
    const ownerId = new UniqueEntityID(coOwnerId);
    const index = this.props.coOwnerIds.findIndex((id) => id.equals(ownerId));

    if (index === -1) {
      return Result.fail('User is not a co-owner of this asset');
    }

    // Get the share of the removed co-owner
    const removedShare = this.props.coOwnerShares.get(coOwnerId);
    if (!removedShare) {
      return Result.fail('Co-owner share not found');
    }

    // Remove co-owner
    this.props.coOwnerIds.splice(index, 1);
    this.props.coOwnerShares.delete(coOwnerId);

    // Redistribute the share
    if (redistributionMethod === 'TO_MAIN_OWNER') {
      // Add to main owner's share
      const newMainShare = this.props.ownershipPercentage.percentage + removedShare.percentage;
      const ownershipResult = OwnershipPercentage.create(
        newMainShare,
        this.props.ownershipPercentage.ownershipType,
      );

      if (ownershipResult.isFailure) {
        return Result.fail(ownershipResult.errorValue());
      }

      this.props.ownershipPercentage = ownershipResult.getValue();
    } else {
      // Distribute equally among remaining co-owners
      const remainingCoOwners = this.props.coOwnerIds.length;
      if (remainingCoOwners > 0) {
        const sharePerCoOwner = removedShare.percentage / remainingCoOwners;

        this.props.coOwnerIds.forEach((id) => {
          const currentShare = this.props.coOwnerShares.get(id.toString());
          if (currentShare) {
            const newShare = currentShare.percentage + sharePerCoOwner;
            const newShareResult = Percentage.create(newShare);
            if (newShareResult.isSuccess) {
              this.props.coOwnerShares.set(id.toString(), newShareResult.getValue());
            }
          }
        });
      }
    }

    // If no co-owners left, revert to sole ownership
    if (this.props.coOwnerIds.length === 0) {
      const soleResult = OwnershipPercentage.create(
        this.props.ownershipPercentage.percentage,
        OwnershipType.SOLE,
      );

      if (soleResult.isSuccess) {
        this.props.ownershipPercentage = soleResult.getValue();
      }
    }

    this.props.lastModifiedBy = new UniqueEntityID(modifiedBy);
    return Result.ok();
  }

  // VERIFICATION WORKFLOW
  public markAsVerified(
    verifiedBy: string,
    method: string,
    documentId?: string,
    notes?: string,
  ): Result<void> {
    if (this.props.verificationStatus === AssetVerificationStatus.VERIFIED) {
      return Result.fail('Asset is already verified');
    }

    // Asset-specific verification requirements
    if (this.props.type === AssetType.LAND_PARCEL && !this.props.titleDeedNumber) {
      return Result.fail('Land assets require title deed number for verification');
    }

    if (this.props.type === AssetType.FINANCIAL_ASSET && !this.props.registrationNumber) {
      return Result.warn('Verifying financial asset without registration number');
    }

    this.props.verificationStatus = AssetVerificationStatus.VERIFIED;
    this.props.verifiedBy = new UniqueEntityID(verifiedBy);
    this.props.verifiedAt = new Date();
    this.props.verificationMethod = method;
    this.props.verificationDocumentId = documentId || null;
    this.props.lastModifiedBy = new UniqueEntityID(verifiedBy);

    if (notes) {
      this.addNote(`Verification: ${notes}`);
    }

    return Result.ok();
  }

  public rejectVerification(
    rejectedBy: string,
    reason: string,
    suggestedAction?: string,
  ): Result<void> {
    if (this.props.verificationStatus === AssetVerificationStatus.REJECTED) {
      return Result.fail('Asset is already rejected');
    }

    this.props.verificationStatus = AssetVerificationStatus.REJECTED;
    this.props.verifiedBy = new UniqueEntityID(rejectedBy);
    this.props.verifiedAt = new Date();
    this.props.rejectionReason = reason;
    this.props.lastModifiedBy = new UniqueEntityID(rejectedBy);

    const rejectionNote = `Verification rejected: ${reason}`;
    if (suggestedAction) {
      this.addNote(`${rejectionNote}. Suggested action: ${suggestedAction}`);
    } else {
      this.addNote(rejectionNote);
    }

    return Result.ok();
  }

  public markAsDisputed(
    disputedBy: string,
    disputeReason: string,
    caseReference?: string,
  ): Result<void> {
    this.props.verificationStatus = AssetVerificationStatus.DISPUTED;
    this.props.lastModifiedBy = new UniqueEntityID(disputedBy);

    const disputeNote = `Asset disputed by ${disputedBy}: ${disputeReason}`;
    if (caseReference) {
      this.addNote(`${disputeNote}. Case reference: ${caseReference}`);
    } else {
      this.addNote(disputeNote);
    }

    // Freeze asset during dispute
    this.freezeAsset('Asset under legal dispute');

    return Result.ok();
  }

  // PROBATE & ESTATE MANAGEMENT
  public includeInEstateInventory(inventoryDate: Date = new Date()): Result<void> {
    if (this.props.includedInEstateInventory) {
      return Result.fail('Asset already included in estate inventory');
    }

    this.props.includedInEstateInventory = true;
    this.props.inventoryDate = inventoryDate;

    // If asset requires probate but hasn't been verified, flag for attention
    if (
      this.props.requiresProbate &&
      this.props.verificationStatus !== AssetVerificationStatus.VERIFIED
    ) {
      this.addNote('Asset included in inventory but requires verification for probate');
    }

    return Result.ok();
  }

  public markForProbate(requirements: string[]): Result<void> {
    this.props.requiresProbate = true;
    this.props.probateRequirementNotes = requirements.join('; ');

    return Result.ok();
  }

  // STATUS MANAGEMENT
  public freezeAsset(reason: string): void {
    this.props.status = AssetStatus.FROZEN;
    this.addNote(`Asset frozen: ${reason}`);
  }

  public unfreezeAsset(): void {
    if (this.props.status === AssetStatus.FROZEN) {
      this.props.status = AssetStatus.ACTIVE;
      this.addNote('Asset unfrozen');
    }
  }

  public markAsTransferred(transferredTo: string, transferDate: Date = new Date()): void {
    this.props.status = AssetStatus.TRANSFERRED;
    this.addNote(`Asset transferred to ${transferredTo} on ${transferDate.toISOString()}`);
  }

  public markAsLiquidated(liquidationDetails: string, liquidationDate: Date = new Date()): void {
    this.props.status = AssetStatus.LIQUIDATED;
    this.addNote(`Asset liquidated on ${liquidationDate.toISOString()}: ${liquidationDetails}`);
  }

  public placeUnderExecutorManagement(
    executorId: string,
    startDate: Date = new Date(),
  ): Result<void> {
    if (this.props.isManagedByExecutor) {
      return Result.fail('Asset already under executor management');
    }

    this.props.isManagedByExecutor = true;
    this.props.executorManagementStartDate = startDate;
    this.props.lastModifiedBy = new UniqueEntityID(executorId);

    this.addNote(`Asset placed under executor management by ${executorId}`);

    return Result.ok();
  }

  // TAX COMPLIANCE
  public recordStampDutyPayment(
    amount: Money,
    receiptNumber: string,
    paymentDate: Date = new Date(),
  ): Result<void> {
    if (amount.amount <= 0) {
      return Result.fail('Stamp duty amount must be positive');
    }

    this.props.stampDutyPaid = true;
    this.props.stampDutyAmount = amount;
    this.props.stampDutyReceiptNumber = receiptNumber;

    this.addNote(
      `Stamp duty paid: KES ${amount.amount}, Receipt: ${receiptNumber}, Date: ${paymentDate.toISOString()}`,
    );

    return Result.ok();
  }

  public recordCapitalGainsTaxPayment(
    amount: Money,
    receiptNumber: string,
    paymentDate: Date = new Date(),
  ): Result<void> {
    if (amount.amount <= 0) {
      return Result.fail('CGT amount must be positive');
    }

    this.props.cgtPaid = true;
    this.props.cgtReceiptNumber = receiptNumber;

    this.addNote(
      `Capital Gains Tax paid: KES ${amount.amount}, Receipt: ${receiptNumber}, Date: ${paymentDate.toISOString()}`,
    );

    return Result.ok();
  }

  // TRANSFER REQUIREMENTS MANAGEMENT
  private addTransferRequirement(requirement: string): void {
    if (!this.props.transmissionRequirements.includes(requirement)) {
      this.props.transmissionRequirements.push(requirement);
    }
  }

  private addTransferRestriction(restriction: string): void {
    if (this.props.transferRestrictions) {
      this.props.transferRestrictions += `; ${restriction}`;
    } else {
      this.props.transferRestrictions = restriction;
    }
  }

  private removeTransferRestriction(restriction: string): void {
    if (this.props.transferRestrictions) {
      this.props.transferRestrictions = this.props.transferRestrictions
        .split('; ')
        .filter((r) => r !== restriction)
        .join('; ');
    }
  }

  // HELPER METHODS
  private addNote(note: string): void {
    if (this.props.notes) {
      this.props.notes += `\n${new Date().toISOString()}: ${note}`;
    } else {
      this.props.notes = `${new Date().toISOString()}: ${note}`;
    }
  }

  public updateLocation(
    location: KenyanLocation,
    gpsCoordinates?: string,
    physicalAddress?: string,
    updatedBy: string,
  ): Result<void> {
    this.props.location = location;
    this.props.gpsCoordinates = gpsCoordinates || null;
    this.props.physicalAddress = physicalAddress || null;
    this.props.lastModifiedBy = new UniqueEntityID(updatedBy);

    return Result.ok();
  }

  public updateIdentificationDetails(
    details: Record<string, any>,
    updatedBy: string,
  ): Result<void> {
    this.props.identificationDetails = details;
    this.props.lastModifiedBy = new UniqueEntityID(updatedBy);

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

  get ownershipPercentage(): OwnershipPercentage {
    return this.props.ownershipPercentage;
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

  get status(): AssetStatus {
    return this.props.status;
  }

  get coOwnerIds(): UniqueEntityID[] {
    return [...this.props.coOwnerIds];
  }

  get coOwnerShares(): Map<string, Percentage> {
    return new Map(this.props.coOwnerShares);
  }

  // COMPUTED PROPERTIES
  get canBeTransferred(): boolean {
    return (
      this.props.status === AssetStatus.ACTIVE &&
      this.props.verificationStatus === AssetVerificationStatus.VERIFIED &&
      !this.props.isEncumbered &&
      !this.props.hasLifeInterest
    );
  }

  get hasRightOfSurvivorship(): boolean {
    // Joint tenancy assets pass automatically to surviving owners
    return this.props.ownershipPercentage.ownershipType === OwnershipType.JOINT_TENANCY;
  }

  get isSubjectToHotchpot(): boolean {
    // This would be determined by GiftInterVivos entity
    return false;
  }

  get probateRequirements(): string[] {
    const requirements: string[] = [];

    if (this.props.requiresProbate) {
      requirements.push('Requires inclusion in probate inventory');

      if (this.props.type === AssetType.LAND_PARCEL) {
        requirements.push('Original title deed or certified copy');
        requirements.push('Land rates clearance certificate');
        requirements.push('Survey map from Survey of Kenya');
        requirements.push('Land Control Board consent for agricultural land');
      }

      if (this.props.type === AssetType.FINANCIAL_ASSET) {
        requirements.push('Bank statements as at date of death');
        requirements.push('Death certificate notification to bank');
        requirements.push('KRA PIN certificate for deceased');
      }

      if (this.props.type === AssetType.VEHICLE) {
        requirements.push('Original logbook');
        requirements.push('NTSA transfer forms');
        requirements.push('Insurance clearance');
      }

      if (this.props.type === AssetType.BUSINESS_INTEREST) {
        requirements.push('Company registry search certificate');
        requirements.push('Share certificate');
        requirements.push('Board resolution for transfer');
      }

      // Add custom requirements
      if (this.props.probateRequirementNotes) {
        requirements.push(...this.props.probateRequirementNotes.split('; '));
      }
    }

    return requirements;
  }

  get transferRequirements(): string[] {
    const requirements: string[] = [
      'Grant of representation (probate or letters of administration)',
      'Death certificate',
      'Identification documents of beneficiaries',
    ];

    // Add status-specific requirements
    if (this.props.isEncumbered) {
      requirements.push('Encumbrance clearance from lender');
    }

    if (this.props.hasLifeInterest) {
      requirements.push('Life interest termination or consent');
    }

    if (this.props.isMatrimonialProperty && !this.props.acquiredDuringMarriage) {
      requirements.push('Spouse consent or court order');
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
      requirements.push('Road license clearance');
    }

    // Add any custom transmission requirements
    requirements.push(...this.props.transmissionRequirements);

    return requirements;
  }

  // STATIC FACTORY METHODS FOR SPECIFIC ASSET TYPES
  public static createLandAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    landDetails: LandAssetDetails;
    titleDeedNumber: string;
    location: KenyanLocation;
    description?: string;
    ownershipShare?: number;
    createdBy?: string;
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
    registrationNumber: string;
    createdBy?: string;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.FINANCIAL_ASSET,
      details: props.financialDetails,
      registrationNumber: props.registrationNumber,
      requiresProbate: true,
    });
  }

  public static createVehicleAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    vehicleDetails: VehicleAssetDetails;
    description?: string;
    ownershipShare?: number;
    registrationNumber: string;
    createdBy?: string;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.VEHICLE,
      details: props.vehicleDetails,
      registrationNumber: props.registrationNumber,
    });
  }

  public static createBusinessAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    businessDetails: BusinessAssetDetails;
    description?: string;
    ownershipShare?: number;
    kraPin?: KenyanId;
    createdBy?: string;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.BUSINESS_INTEREST,
      details: props.businessDetails,
      kraPin: props.kraPin,
      requiresProbate: true,
    });
  }

  public static createDigitalAsset(props: {
    estateId: string;
    ownerId: string;
    name: string;
    description?: string;
    ownershipShare?: number;
    accessDetails: Record<string, any>;
    createdBy?: string;
  }): Result<Asset> {
    return Asset.create({
      ...props,
      type: AssetType.DIGITAL_ASSET,
      identificationDetails: props.accessDetails,
      requiresProbate: false, // Digital assets may have different probate requirements
    });
  }
}
