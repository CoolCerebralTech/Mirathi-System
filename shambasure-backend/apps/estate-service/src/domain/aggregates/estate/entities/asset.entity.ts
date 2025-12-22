import { Entity } from '../../../../domain/base/entity';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
// Exceptions
import {
  AssetEncumbranceException,
  AssetLegalViolationException,
  AssetVerificationException,
  InvalidAssetConfigurationException,
  LifeInterestException,
} from '../../../exceptions/estate.exception';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';
import { Money } from '../../../shared/money.vo';
import { OwnershipPercentage, OwnershipType } from '../../../shared/ownership-percentage.vo';
import { Percentage } from '../../../shared/percentage.vo';
import { AssetDetails, AssetType } from '../value-objects/asset-details.vo';
import { Valuation } from '../value-objects/valuation.vo';

// --- Enums ---

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
  FROZEN = 'FROZEN',
  TRANSFERRED = 'TRANSFERRED',
  LIQUIDATED = 'LIQUIDATED',
}

// --- Props Interface ---

export interface AssetProps {
  // Core Identifiers
  estateId: UniqueEntityID;
  ownerId: UniqueEntityID;

  // Core Asset Data
  name: string;
  description: string | null;
  type: AssetType;

  // Ownership Structure
  ownershipPercentage: OwnershipPercentage;

  // Legal Status (Matrimonial Property Act 2013)
  isMatrimonialProperty: boolean;
  acquiredDuringMarriage: boolean;
  spouseConsentObtained: boolean;
  spouseConsentDate: Date | null;
  spouseConsentDocumentId: string | null;

  // Life Interest (S. 35(1)(b) Law of Succession Act)
  hasLifeInterest: boolean;
  lifeInterestHolderId: UniqueEntityID | null;
  lifeInterestHolderName: string | null;
  lifeInterestStartDate: Date | null;
  lifeInterestEndDate: Date | null;
  lifeInterestRegistered: boolean;

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
  verificationMethod: string | null;
  rejectionReason: string | null;
  verificationDocumentId: string | null;

  // Identification
  titleDeedNumber: string | null;
  registrationNumber: string | null;
  kraPin: KenyanId | null;

  // Location
  location: KenyanLocation | null;
  gpsCoordinates: string | null;
  physicalAddress: string | null;

  // Polymorphic Asset Details
  details: AssetDetails<any> | null;

  // Valuation & Financial
  currentValuation: Valuation | null;
  valuationHistory: Valuation[];
  purchasePrice: Money | null;
  purchaseDate: Date | null;

  // Co-ownership
  coOwnerIds: UniqueEntityID[];
  coOwnerShares: Map<string, Percentage>;

  // Management & Status
  status: AssetStatus;
  isManagedByExecutor: boolean;
  executorManagementStartDate: Date | null;

  // Tax
  stampDutyPaid: boolean;
  stampDutyAmount: Money | null;
  stampDutyReceiptNumber: string | null;
  capitalGainsTaxLiability: Money | null;
  cgtPaid: boolean;
  cgtReceiptNumber: string | null;

  // Transfer Restrictions
  transferRestrictions: string | null;
  transmissionRequirements: string[];

  // Audit
  createdBy: UniqueEntityID | null;
  lastModifiedBy: UniqueEntityID | null;
  notes: string | null;
}

// --- Entity Implementation ---

export class Asset extends Entity<AssetProps> {
  private constructor(props: AssetProps, id?: UniqueEntityID) {
    super(id ?? new UniqueEntityID(), props);
  }

  // Helper to bypass strict Readonly<T> from Base Entity
  private get mutableProps(): AssetProps {
    return this._props;
  }

  // --- Factory Method ---

  public static create(
    props: {
      estateId: string;
      ownerId: string;
      name: string;
      type: AssetType;
      // Optionals
      description?: string;
      ownershipType?: OwnershipType;
      ownershipShare?: number;
      details?: AssetDetails<any>;
      location?: KenyanLocation;
      titleDeedNumber?: string;
      registrationNumber?: string;
      kraPin?: KenyanId;
      requiresProbate?: boolean;
      createdBy?: string;
    },
    id?: string,
  ): Asset {
    // 1. Basic Validation
    if (!props.estateId || !props.ownerId || !props.name || !props.type) {
      throw new InvalidAssetConfigurationException(
        'Missing required asset fields (estateId, ownerId, name, type)',
      );
    }

    if (props.name.trim().length < 2) {
      throw new InvalidAssetConfigurationException('Asset name must be at least 2 characters');
    }

    // 2. Ownership Validation
    const ownershipShare = props.ownershipShare ?? 100;

    // Handling potential Result or Exception based VO
    const ownershipPercentage = OwnershipPercentage.create(
      ownershipShare,
      props.ownershipType || OwnershipType.SOLE,
    );

    // Unwrap if it's a Result (compatibility check)
    if ('isFailure' in (ownershipPercentage as any)) {
      const result = ownershipPercentage as any;
      if (result.isFailure) throw new InvalidAssetConfigurationException(result.errorValue());
    }

    // 3. Polymorphic Details Validation
    if (props.details) {
      if (props.details.type !== props.type) {
        throw new InvalidAssetConfigurationException(
          `Asset details type (${props.details.type}) must match asset type (${props.type})`,
        );
      }
    }

    // 4. Kenyan Context Validation (Warnings treated as notes)
    let initialNotes: string | null = null;
    const addWarning = (msg: string) => {
      initialNotes = initialNotes ? `${initialNotes}\nWARN: ${msg}` : `WARN: ${msg}`;
    };

    if (props.type === AssetType.LAND_PARCEL && !props.titleDeedNumber) {
      addWarning('Land asset created without Title Deed Number.');
    }
    if (props.type === AssetType.FINANCIAL_ASSET && !props.registrationNumber) {
      addWarning('Financial asset created without Account Number.');
    }

    const assetId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    // Resolve ownership value
    const finalOwnership =
      'getValue' in (ownershipPercentage as any)
        ? (ownershipPercentage as any).getValue()
        : ownershipPercentage;

    const defaultProps: AssetProps = {
      estateId: new UniqueEntityID(props.estateId),
      ownerId: new UniqueEntityID(props.ownerId),
      name: props.name.trim(),
      description: props.description?.trim() || null,
      type: props.type,
      ownershipPercentage: finalOwnership,

      // Default Legal Status
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
      lifeInterestRegistered: false,

      // Default Encumbrance
      isEncumbered: false,
      encumbranceType: null,
      encumbranceAmount: null,
      encumbranceDate: null,
      encumbranceDetails: null,
      encumbranceDocumentId: null,

      // Probate
      requiresProbate: props.requiresProbate ?? true,
      probateRequirementNotes: null,
      includedInEstateInventory: false,
      inventoryDate: null,

      // Verification
      verificationStatus: AssetVerificationStatus.UNVERIFIED,
      verifiedBy: null,
      verifiedAt: null,
      verificationMethod: null,
      rejectionReason: null,
      verificationDocumentId: null,

      // Identifiers
      titleDeedNumber: props.titleDeedNumber || null,
      registrationNumber: props.registrationNumber || null,
      kraPin: props.kraPin || null,
      location: props.location || null,
      gpsCoordinates: null,
      physicalAddress: null,

      details: props.details || null,

      // Financials
      currentValuation: null,
      valuationHistory: [],
      purchasePrice: null,
      purchaseDate: null,

      // Co-ownership
      coOwnerIds: [],
      coOwnerShares: new Map(),

      // Status
      status: AssetStatus.ACTIVE,
      isManagedByExecutor: false,
      executorManagementStartDate: null,

      // Tax
      stampDutyPaid: false,
      stampDutyAmount: null,
      stampDutyReceiptNumber: null,
      capitalGainsTaxLiability: null,
      cgtPaid: false,
      cgtReceiptNumber: null,

      transferRestrictions: null,
      transmissionRequirements: [],

      // Metadata
      createdBy,
      lastModifiedBy: createdBy,
      notes: initialNotes,
    };

    return new Asset(defaultProps, assetId);
  }

  // ==================== DOMAIN BEHAVIORS ====================

  /**
   * Updates or sets the valuation.
   * Handles Kenyan requirement: Land valuations for probate MUST be by registered valuer.
   */
  public addValuation(valuation: Valuation, valuedBy: string): void {
    if (!valuation) {
      throw new InvalidAssetConfigurationException('Valuation cannot be null');
    }

    // Business Rule: Land requires registered valuer for Probate
    if (this.props.type === AssetType.LAND_PARCEL && this.props.requiresProbate) {
      if (!valuation.props.isRegisteredValuer) {
        throw new AssetLegalViolationException(
          'Land assets for probate require valuation by a VRB registered valuer.',
        );
      }
      if (!valuation.props.valuerRegistrationNumber) {
        throw new AssetLegalViolationException(
          'Registered valuer number is required for land valuation.',
        );
      }
    }

    this.mutableProps.currentValuation = valuation;
    this.mutableProps.valuationHistory.push(valuation);
    this.mutableProps.lastModifiedBy = new UniqueEntityID(valuedBy);

    // Auto-calculate CGT if significant gain (Simplistic rule: >10% gain)
    if (
      this.props.purchasePrice &&
      valuation.value.amount > this.props.purchasePrice.amount * 1.1
    ) {
      this.calculateCapitalGainsTax();
    }
  }

  /**
   * Calculates CGT liability (5% of Net Gain in Kenya).
   */
  private calculateCapitalGainsTax(): void {
    if (!this.props.purchasePrice || !this.props.currentValuation) return;

    const gain = this.props.currentValuation.value.amount - this.props.purchasePrice.amount;

    if (gain > 0) {
      const cgt = gain * 0.05;
      this.mutableProps.capitalGainsTaxLiability = Money.createKES(cgt);
    }
  }

  /**
   * Encumber the asset (Mortgage, Court Order, etc.).
   */
  public addEncumbrance(
    type: AssetEncumbranceType,
    amount: Money,
    details: string,
    documentId?: string,
  ): void {
    if (this.props.isEncumbered) {
      throw new AssetEncumbranceException('Asset is already encumbered.');
    }
    if (amount.amount <= 0) {
      throw new AssetEncumbranceException('Encumbrance amount must be positive.');
    }

    // Business Rule: Mortgage on Land requires Title Deed
    if (type === AssetEncumbranceType.MORTGAGE && this.props.type === AssetType.LAND_PARCEL) {
      if (!this.props.titleDeedNumber) {
        throw new AssetLegalViolationException(
          'Cannot register mortgage on Land without Title Deed Number.',
        );
      }
    }

    this.mutableProps.isEncumbered = true;
    this.mutableProps.encumbranceType = type;
    this.mutableProps.encumbranceAmount = amount;
    this.mutableProps.encumbranceDetails = details;
    this.mutableProps.encumbranceDocumentId = documentId || null;
    this.mutableProps.encumbranceDate = new Date();

    this.addTransferRestriction('Subject to encumbrance - Transfer requires lender/court consent');
  }

  /**
   * Apply Life Interest (S. 35 LSA).
   */
  public createLifeInterest(holderId: string, holderName: string, endDate: Date): void {
    if (this.props.hasLifeInterest) {
      throw new LifeInterestException('Asset already has a life interest assigned.');
    }

    const eligibleTypes = [AssetType.LAND_PARCEL, AssetType.PROPERTY, AssetType.BUSINESS_INTEREST];
    if (!eligibleTypes.includes(this.props.type)) {
      throw new LifeInterestException('Life interest is not applicable to this asset type.');
    }

    this.mutableProps.hasLifeInterest = true;
    this.mutableProps.lifeInterestHolderId = new UniqueEntityID(holderId);
    this.mutableProps.lifeInterestHolderName = holderName;
    this.mutableProps.lifeInterestStartDate = new Date();
    this.mutableProps.lifeInterestEndDate = endDate;

    // Logic: If land, it should be registered as a restriction
    this.mutableProps.lifeInterestRegistered = this.props.type === AssetType.LAND_PARCEL;

    this.addTransferRestriction(
      'Subject to Life Interest (S.35 LSA) - Cannot be sold without court approval',
    );
  }

  /**
   * Enforce Matrimonial Property Act 2013.
   */
  public classifyAsMatrimonialProperty(
    acquiredDuringMarriage: boolean,
    spouseConsentDetails?: { obtained: boolean; date?: Date; docId?: string },
  ): void {
    this.mutableProps.isMatrimonialProperty = true;
    this.mutableProps.acquiredDuringMarriage = acquiredDuringMarriage;

    if (spouseConsentDetails) {
      this.mutableProps.spouseConsentObtained = spouseConsentDetails.obtained;
      this.mutableProps.spouseConsentDate = spouseConsentDetails.date || null;
      this.mutableProps.spouseConsentDocumentId = spouseConsentDetails.docId || null;
    }

    if (!this.props.spouseConsentObtained) {
      this.addTransferRestriction('Matrimonial Property - Spousal Consent Required');
    }
  }

  /**
   * Verify Asset (KYC/Due Diligence).
   */
  public markAsVerified(verifierId: string, method: string, documentId?: string): void {
    if (this.props.verificationStatus === AssetVerificationStatus.VERIFIED) {
      throw new AssetVerificationException('Asset is already verified.');
    }

    // Specific Checks
    if (this.props.type === AssetType.LAND_PARCEL && !this.props.titleDeedNumber) {
      throw new AssetVerificationException('Cannot verify Land Asset without Title Deed Number.');
    }

    this.mutableProps.verificationStatus = AssetVerificationStatus.VERIFIED;
    this.mutableProps.verifiedBy = new UniqueEntityID(verifierId);
    this.mutableProps.verifiedAt = new Date();
    this.mutableProps.verificationMethod = method;
    this.mutableProps.verificationDocumentId = documentId || null;
    this.mutableProps.rejectionReason = null;
  }

  // --- Helper Methods ---

  private addTransferRestriction(text: string): void {
    const current = this.props.transferRestrictions;
    this.mutableProps.transferRestrictions = current ? `${current}; ${text}` : text;
  }

  // --- Getters ---

  public getNetValue(): Money | null {
    const val = this.props.currentValuation?.value;
    if (!val) return null;

    if (this.props.isEncumbered && this.props.encumbranceAmount) {
      return val.subtract(this.props.encumbranceAmount);
    }
    return val;
  }

  get id(): UniqueEntityID {
    return this._id;
  }
  get type(): AssetType {
    return this.props.type;
  }
  get name(): string {
    return this.props.name;
  }
  get details(): AssetDetails<any> | null {
    return this.props.details;
  }
  get status(): AssetStatus {
    return this.props.status;
  }
  get verificationStatus(): AssetVerificationStatus {
    return this.props.verificationStatus;
  }

  get canBeTransferred(): boolean {
    return (
      this.props.status === AssetStatus.ACTIVE &&
      this.props.verificationStatus === AssetVerificationStatus.VERIFIED &&
      !this.props.isEncumbered &&
      (!this.props.isMatrimonialProperty || this.props.spouseConsentObtained)
    );
  }
}
