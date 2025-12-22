// src/domain/aggregates/estate/entities/gift-inter-vivos.entity.ts
import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/unique-entity-id';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';
import { Money } from '../../../shared/money.vo';
import { AssetType } from '../value-objects/asset-details.vo';
import { GiftInterVivosDetails } from '../value-objects/gift-inter-vivos-details.vo';

export enum GiftHotchpotStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE', // Not subject to hotchpot
  PENDING = 'PENDING', // Awaiting hotchpot calculation
  INCLUDED = 'INCLUDED', // Included in hotchpot calculation
  EXCLUDED = 'EXCLUDED', // Excluded from hotchpot
  RECLAIMED = 'RECLAIMED', // Gift returned to estate
  CALCULATION_PENDING = 'CALCULATION_PENDING', // Awaiting inflation adjustment
}

export enum GiftConditionStatus {
  NONE = 'NONE', // No conditions
  PENDING = 'PENDING', // Condition not yet met
  MET = 'MET', // Condition fulfilled
  FAILED = 'FAILED', // Condition failed
  WAIVED = 'WAIVED', // Condition waived by testator
  TIME_EXPIRED = 'TIME_EXPIRED', // Condition deadline passed
}

export enum GiftLegalStatus {
  VALID = 'VALID', // Legally valid gift
  VOIDABLE = 'VOIDABLE', // Potentially voidable
  CONTESTED = 'CONTESTED', // Being contested
  SETTLED = 'SETTLED', // Legally settled
  INVALID = 'INVALID', // Legally invalid
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION', // Being investigated
}

export enum GiftType {
  CUSTOMARY_BRIDE_PRICE = 'CUSTOMARY_BRIDE_PRICE',
  EDUCATIONAL_SUPPORT = 'EDUCATIONAL_SUPPORT',
  MARRIAGE_GIFT = 'MARRIAGE_GIFT',
  BUSINESS_STARTUP = 'BUSINESS_STARTUP',
  PROPERTY_TRANSFER = 'PROPERTY_TRANSFER',
  CASH_GIFT = 'CASH_GIFT',
  VEHICLE_GIFT = 'VEHICLE_GIFT',
  LAND_GIFT = 'LAND_GIFT',
  LIVESTOCK_GIFT = 'LIVESTOCK_GIFT',
  FAMILY_HEIRLOOM = 'FAMILY_HEIRLOOM',
  TRADITIONAL_RITE = 'TRADITIONAL_RITE',
  OTHER = 'OTHER',
}

interface GiftInterVivosProps {
  estateId: UniqueEntityID;
  deceasedId: UniqueEntityID; // Reference to deceased family member

  // Recipient Information
  recipientId: UniqueEntityID;
  recipientName: string; // Denormalized for reports
  relationshipToDeceased: string;
  relationshipCategory:
    | 'CHILD'
    | 'SPOUSE'
    | 'PARENT'
    | 'SIBLING'
    | 'EXTENDED_FAMILY'
    | 'NON_FAMILY';

  // Gift Details
  giftType: GiftType;
  description: string;
  assetType: AssetType;
  valueAtGiftTime: Money;
  dateOfGift: Date;

  // Gift Details (Polymorphic)
  details: GiftInterVivosDetails;

  // Kenyan Cultural Context
  customaryContext: {
    tribe: string | null;
    clan: string | null;
    ceremonyType: string | null;
    elderWitnesses: string[]; // Names of elders who witnessed
    customaryDocumentation: string | null; // Reference to customary document
    communityAcknowledged: boolean;
    registeredWithClan: boolean;
  };

  // Hotchpot Details (S.35(3) LSA)
  hotchpotStatus: GiftHotchpotStatus;
  isSubjectToHotchpot: boolean;
  hotchpotInclusionReason: string | null;
  hotchpotExclusionReason: string | null;

  // Inflation Adjustment (Kenyan CPI)
  inflationAdjustedValue: Money | null;
  inflationRateUsed: number | null; // Annual CPI rate
  inflationAdjustmentMethod: 'KENYA_CPI' | 'FIXED_RATE' | 'CUSTOM' | null;
  reconciliationDate: Date | null;
  reconciliationNotes: string | null;

  // Condition Tracking
  conditionStatus: GiftConditionStatus;
  conditionDescription: string | null;
  conditionDetails: {
    type: 'AGE' | 'EDUCATION' | 'MARRIAGE' | 'BUSINESS_SUCCESS' | 'CUSTOMARY_RITE' | 'OTHER';
    deadline: Date | null;
    verificationRequired: boolean;
    verificationMethod: string | null;
    verificationDocumentId: string | null;
  } | null;
  conditionMetDate: Date | null;
  conditionFailedDate: Date | null;
  conditionWaivedBy: string | null;
  conditionWaivedDate: Date | null;

  // Legal Status & Disputes
  legalStatus: GiftLegalStatus;
  isContested: boolean;
  contestationDetails: {
    contestedBy: string | null;
    contestationDate: Date | null;
    contestationReason: string | null;
    courtCaseNumber: string | null;
    courtStation: string | null;
  } | null;
  legalValidityAssessment: {
    assessedBy: string | null;
    assessmentDate: Date | null;
    validityScore: number | null; // 0-100
    riskFactors: string[];
    recommendations: string[];
  } | null;

  // Documentation & Evidence
  giftDeedReference: string | null;
  giftDeedDocumentId: string | null;
  witnessDetails: string[];
  supportingDocumentIds: string[];
  photographicEvidence: string[]; // Photo IDs
  videoEvidence: string | null; // Video recording reference
  elderTestimonies: Array<{
    elderName: string;
    elderPosition: string;
    testimony: string;
    date: Date;
  }>;

  // Location Context
  giftLocation: KenyanLocation | null;
  ceremonyLocation: string | null;

  // Reversion to Estate
  revertsToEstate: boolean;
  reversionTrigger:
    | 'CONDITION_FAILED'
    | 'DEATH_OF_RECIPIENT'
    | 'FRAUD'
    | 'COURT_ORDER'
    | 'OTHER'
    | null;
  reversionDate: Date | null;
  reversionReason: string | null;
  reversionDocumentId: string | null;
  reversionCompleted: boolean;

  // Beneficiary Acknowledgment
  beneficiaryAcknowledged: boolean;
  beneficiaryAcknowledgmentDate: Date | null;
  beneficiaryAcknowledgmentMethod:
    | 'SIGNED_DOCUMENT'
    | 'WITNESSED_ORAL'
    | 'CUSTOMARY_RITE'
    | 'OTHER';
  beneficiaryDisputed: boolean;
  beneficiaryDisputeReason: string | null;

  // Tax Implications (Kenyan)
  stampDutyPaid: boolean;
  stampDutyAmount: Money | null;
  stampDutyReceiptNumber: string | null;
  capitalGainsTaxImplication: {
    applicable: boolean;
    amount: Money | null;
    paid: boolean;
    receiptNumber: string | null;
  } | null;

  // Management & Audit
  isActive: boolean;
  requiresExecutorAttention: boolean;
  executorNotes: string | null;
  lastModifiedBy: UniqueEntityID | null;
  notes: string; // Comprehensive audit trail
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verifiedBy: UniqueEntityID | null;
  verifiedAt: Date | null;
}

export class GiftInterVivos extends Entity<GiftInterVivosProps> {
  private constructor(props: GiftInterVivosProps, id?: UniqueEntityID) {
    super(id, props);
  }

  public static create(
    props: {
      estateId: string;
      deceasedId: string;
      recipientId: string;
      recipientName: string;
      relationshipToDeceased: string;
      relationshipCategory:
        | 'CHILD'
        | 'SPOUSE'
        | 'PARENT'
        | 'SIBLING'
        | 'EXTENDED_FAMILY'
        | 'NON_FAMILY';
      giftType: GiftType;
      description: string;
      assetType: AssetType;
      valueAtGiftTime: Money;
      dateOfGift: Date;
      details: GiftInterVivosDetails;
      giftDeedReference?: string;
      witnessDetails?: string[];
      conditionDescription?: string;
      customaryContext?: {
        tribe?: string;
        clan?: string;
        ceremonyType?: string;
        elderWitnesses?: string[];
        customaryDocumentation?: string;
        communityAcknowledged?: boolean;
        registeredWithClan?: boolean;
      };
      giftLocation?: KenyanLocation;
      ceremonyLocation?: string;
      createdBy?: string;
    },
    id?: string,
  ): Result<GiftInterVivos> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.estateId, argumentName: 'estateId' },
      { argument: props.deceasedId, argumentName: 'deceasedId' },
      { argument: props.recipientId, argumentName: 'recipientId' },
      { argument: props.recipientName, argumentName: 'recipientName' },
      { argument: props.relationshipToDeceased, argumentName: 'relationshipToDeceased' },
      { argument: props.giftType, argumentName: 'giftType' },
      { argument: props.description, argumentName: 'description' },
      { argument: props.assetType, argumentName: 'assetType' },
      { argument: props.valueAtGiftTime, argumentName: 'valueAtGiftTime' },
      { argument: props.dateOfGift, argumentName: 'dateOfGift' },
      { argument: props.details, argumentName: 'details' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail<GiftInterVivos>(guardResult.message);
    }

    // Validate description
    if (props.description.trim().length < 10) {
      return Result.fail<GiftInterVivos>('Gift description must be at least 10 characters');
    }

    // Validate date of gift is not in the future
    if (props.dateOfGift > new Date()) {
      return Result.fail<GiftInterVivos>('Date of gift cannot be in the future');
    }

    // Validate relationship
    if (props.relationshipToDeceased.trim().length < 2) {
      return Result.fail<GiftInterVivos>('Relationship to deceased must be specified');
    }

    // Validate gift value
    if (props.valueAtGiftTime.amount <= 0) {
      return Result.fail<GiftInterVivos>('Gift value must be positive');
    }

    // Customary law exemption validation
    const customaryContext = props.customaryContext || {};
    if (customaryContext.registeredWithClan && !customaryContext.clan) {
      return Result.warn<GiftInterVivos>('Gift registered with clan should specify clan name');
    }

    // Determine initial hotchpot status
    let hotchpotStatus = GiftHotchpotStatus.PENDING;
    if (!props.details.isSubjectToHotchpot) {
      hotchpotStatus = GiftHotchpotStatus.NOT_APPLICABLE;
    } else if (props.details.customaryLawExemption) {
      hotchpotStatus = GiftHotchpotStatus.EXCLUDED;
    }

    // Determine condition status
    let conditionStatus = GiftConditionStatus.NONE;
    if (props.conditionDescription) {
      conditionStatus = GiftConditionStatus.PENDING;
    }

    const giftId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const deceasedId = new UniqueEntityID(props.deceasedId);
    const recipientId = new UniqueEntityID(props.recipientId);
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    const defaultProps: GiftInterVivosProps = {
      estateId,
      deceasedId,
      recipientId,
      recipientName: props.recipientName.trim(),
      relationshipToDeceased: props.relationshipToDeceased.trim(),
      relationshipCategory: props.relationshipCategory,
      giftType: props.giftType,
      description: props.description.trim(),
      assetType: props.assetType,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      details: props.details,
      customaryContext: {
        tribe: customaryContext.tribe || null,
        clan: customaryContext.clan || null,
        ceremonyType: customaryContext.ceremonyType || null,
        elderWitnesses: customaryContext.elderWitnesses || [],
        customaryDocumentation: customaryContext.customaryDocumentation || null,
        communityAcknowledged: customaryContext.communityAcknowledged || false,
        registeredWithClan: customaryContext.registeredWithClan || false,
      },
      hotchpotStatus,
      isSubjectToHotchpot: props.details.isSubjectToHotchpot,
      hotchpotInclusionReason: null,
      hotchpotExclusionReason: props.details.customaryLawExemption
        ? 'Customary law exemption'
        : null,
      inflationAdjustedValue: null,
      inflationRateUsed: null,
      inflationAdjustmentMethod: null,
      reconciliationDate: null,
      reconciliationNotes: null,
      conditionStatus,
      conditionDescription: props.conditionDescription?.trim() || null,
      conditionDetails: null,
      conditionMetDate: null,
      conditionFailedDate: null,
      conditionWaivedBy: null,
      conditionWaivedDate: null,
      legalStatus: GiftLegalStatus.VALID,
      isContested: false,
      contestationDetails: null,
      legalValidityAssessment: null,
      giftDeedReference: props.giftDeedReference?.trim() || null,
      giftDeedDocumentId: null,
      witnessDetails: props.witnessDetails || [],
      supportingDocumentIds: [],
      photographicEvidence: [],
      videoEvidence: null,
      elderTestimonies: [],
      giftLocation: props.giftLocation || null,
      ceremonyLocation: props.ceremonyLocation || null,
      revertsToEstate: props.details.revertsToEstate,
      reversionTrigger: null,
      reversionDate: null,
      reversionReason: null,
      reversionDocumentId: null,
      reversionCompleted: false,
      beneficiaryAcknowledged: false,
      beneficiaryAcknowledgmentDate: null,
      beneficiaryAcknowledgmentMethod: 'OTHER',
      beneficiaryDisputed: false,
      beneficiaryDisputeReason: null,
      stampDutyPaid: false,
      stampDutyAmount: null,
      stampDutyReceiptNumber: null,
      capitalGainsTaxImplication: {
        applicable: false,
        amount: null,
        paid: false,
        receiptNumber: null,
      },
      isActive: true,
      requiresExecutorAttention: false,
      executorNotes: null,
      lastModifiedBy: createdBy,
      notes: `Gift created on ${new Date().toISOString()}. Type: ${props.giftType}, Value: ${props.valueAtGiftTime.amount} ${props.valueAtGiftTime.currency}`,
      verificationStatus: 'UNVERIFIED',
      verifiedBy: null,
      verifiedAt: null,
    };

    const gift = new GiftInterVivos(defaultProps, giftId);
    return Result.ok<GiftInterVivos>(gift);
  }

  // ==================== BUSINESS METHODS ====================

  // HOTCHPOT CALCULATION (S.35(3) LSA)
  public calculateHotchpotValue(
    dateOfDeath: Date,
    inflationRate: number = 0.05, // 5% annual inflation (Kenyan average)
    method: 'KENYA_CPI' | 'FIXED_RATE' | 'CUSTOM' = 'FIXED_RATE',
  ): Result<Money> {
    if (!this.props.isSubjectToHotchpot) {
      return Result.fail('Gift is not subject to hotchpot calculation');
    }

    if (dateOfDeath <= this.props.dateOfGift) {
      return Result.fail('Date of death must be after date of gift');
    }

    // Calculate years between gift and death
    const yearsDifference = this.calculateYearsDifference(this.props.dateOfGift, dateOfDeath);

    // Apply inflation adjustment
    const adjustedValue =
      this.props.valueAtGiftTime.amount * Math.pow(1 + inflationRate, yearsDifference);

    const hotchpotValue = Money.create(adjustedValue, this.props.valueAtGiftTime.currency);

    // Update gift with hotchpot calculation
    this.props.inflationAdjustedValue = hotchpotValue;
    this.props.inflationRateUsed = inflationRate;
    this.props.inflationAdjustmentMethod = method;
    this.props.reconciliationDate = dateOfDeath;
    this.props.hotchpotStatus = GiftHotchpotStatus.CALCULATION_PENDING;

    this.addNote(
      `Hotchpot value calculated: ${adjustedValue.toFixed(2)} ${this.props.valueAtGiftTime.currency} (${inflationRate * 100}% annual inflation for ${yearsDifference.toFixed(1)} years)`,
    );

    return Result.ok(hotchpotValue);
  }

  public includeInHotchpot(
    includedBy: string,
    reason?: string,
    effectiveDate: Date = new Date(),
  ): Result<void> {
    if (this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE) {
      return Result.fail('Gift is not subject to hotchpot');
    }

    if (this.props.hotchpotStatus === GiftHotchpotStatus.INCLUDED) {
      return Result.fail('Hotchpot already applied to this gift');
    }

    if (!this.props.inflationAdjustedValue) {
      return Result.fail('Hotchpot value must be calculated before inclusion');
    }

    this.props.hotchpotStatus = GiftHotchpotStatus.INCLUDED;
    this.props.hotchpotInclusionReason = reason || null;
    this.props.lastModifiedBy = new UniqueEntityID(includedBy);

    this.addNote(
      `Included in hotchpot calculation by ${includedBy} on ${effectiveDate.toISOString()}. ${reason ? `Reason: ${reason}` : ''}`,
    );

    return Result.ok();
  }

  public excludeFromHotchpot(
    excludedBy: string,
    reason: string,
    requiresCourtOrder: boolean = false,
    courtOrderReference?: string,
  ): Result<void> {
    if (!reason || reason.trim().length < 10) {
      return Result.fail('Exclusion reason must be at least 10 characters');
    }

    if (this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE) {
      return Result.fail('Gift is already not applicable for hotchpot');
    }

    this.props.hotchpotStatus = GiftHotchpotStatus.EXCLUDED;
    this.props.hotchpotExclusionReason = reason;
    this.props.lastModifiedBy = new UniqueEntityID(excludedBy);

    let exclusionNote = `Excluded from hotchpot by ${excludedBy}: ${reason}`;
    if (requiresCourtOrder && courtOrderReference) {
      exclusionNote += ` (Court Order: ${courtOrderReference})`;
    }

    this.addNote(exclusionNote);

    return Result.ok();
  }

  // CONDITION MANAGEMENT
  public setCondition(
    conditionDetails: {
      type: 'AGE' | 'EDUCATION' | 'MARRIAGE' | 'BUSINESS_SUCCESS' | 'CUSTOMARY_RITE' | 'OTHER';
      description: string;
      deadline?: Date;
      verificationRequired?: boolean;
      verificationMethod?: string;
    },
    setBy: string,
  ): Result<void> {
    if (this.props.conditionStatus !== GiftConditionStatus.NONE) {
      return Result.fail('Gift already has a condition');
    }

    if (!conditionDetails.description || conditionDetails.description.trim().length < 10) {
      return Result.fail('Condition description must be at least 10 characters');
    }

    this.props.conditionStatus = GiftConditionStatus.PENDING;
    this.props.conditionDescription = conditionDetails.description;
    this.props.conditionDetails = {
      type: conditionDetails.type,
      deadline: conditionDetails.deadline || null,
      verificationRequired: conditionDetails.verificationRequired || false,
      verificationMethod: conditionDetails.verificationMethod || null,
      verificationDocumentId: null,
    };
    this.props.lastModifiedBy = new UniqueEntityID(setBy);

    let conditionNote = `Condition set by ${setBy}: ${conditionDetails.description} (Type: ${conditionDetails.type})`;
    if (conditionDetails.deadline) {
      conditionNote += `, Deadline: ${conditionDetails.deadline.toISOString()}`;
    }

    this.addNote(conditionNote);

    return Result.ok();
  }

  public markConditionAsMet(
    metBy: string,
    verificationDocumentId?: string,
    verificationNotes?: string,
    metDate: Date = new Date(),
  ): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (this.props.conditionStatus === GiftConditionStatus.MET) {
      return Result.fail('Condition already marked as met');
    }

    // Check if deadline has passed
    if (this.props.conditionDetails?.deadline && metDate > this.props.conditionDetails.deadline) {
      this.addNote(
        `Warning: Condition met after deadline (${this.props.conditionDetails.deadline.toISOString()})`,
      );
    }

    this.props.conditionStatus = GiftConditionStatus.MET;
    this.props.conditionMetDate = metDate;
    this.props.lastModifiedBy = new UniqueEntityID(metBy);

    if (verificationDocumentId && this.props.conditionDetails) {
      this.props.conditionDetails.verificationDocumentId = verificationDocumentId;
    }

    let metNote = `Condition marked as met by ${metBy} on ${metDate.toISOString()}`;
    if (verificationNotes) {
      metNote += `. Verification notes: ${verificationNotes}`;
    }

    this.addNote(metNote);

    return Result.ok();
  }

  public markConditionAsFailed(
    failedBy: string,
    failureReason: string,
    failureDate: Date = new Date(),
  ): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (!failureReason || failureReason.trim().length < 10) {
      return Result.fail('Failure reason must be at least 10 characters');
    }

    this.props.conditionStatus = GiftConditionStatus.FAILED;
    this.props.conditionFailedDate = failureDate;
    this.props.lastModifiedBy = new UniqueEntityID(failedBy);

    this.addNote(`Condition marked as failed by ${failedBy}: ${failureReason}`);

    // Check if gift reverts to estate
    if (this.props.revertsToEstate) {
      this.reclaimToEstate(failedBy, `Condition failed: ${failureReason}`);
    }

    return Result.ok();
  }

  public waiveCondition(
    waivedBy: string,
    reason: string,
    requiresBeneficiaryConsent: boolean = true,
    beneficiaryConsentObtained?: boolean,
  ): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Waiver reason must be at least 10 characters');
    }

    if (requiresBeneficiaryConsent && !beneficiaryConsentObtained) {
      return Result.fail('Beneficiary consent is required to waive condition');
    }

    this.props.conditionStatus = GiftConditionStatus.WAIVED;
    this.props.conditionWaivedBy = waivedBy;
    this.props.conditionWaivedDate = new Date();
    this.props.lastModifiedBy = new UniqueEntityID(waivedBy);

    let waiverNote = `Condition waived by ${waivedBy}: ${reason}`;
    if (beneficiaryConsentObtained) {
      waiverNote += ' (with beneficiary consent)';
    }

    this.addNote(waiverNote);

    return Result.ok();
  }

  // REVERSION TO ESTATE
  public reclaimToEstate(
    reclaimedBy: string,
    reason: string,
    reversionDocumentId?: string,
    reversionDate: Date = new Date(),
  ): Result<void> {
    if (this.props.reversionCompleted) {
      return Result.fail('Gift already reclaimed to estate');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Reclamation reason must be at least 10 characters');
    }

    this.props.reversionCompleted = true;
    this.props.reversionDate = reversionDate;
    this.props.reversionReason = reason;
    this.props.reversionDocumentId = reversionDocumentId || null;
    this.props.hotchpotStatus = GiftHotchpotStatus.RECLAIMED;
    this.props.lastModifiedBy = new UniqueEntityID(reclaimedBy);

    this.addNote(
      `Gift reclaimed to estate by ${reclaimedBy} on ${reversionDate.toISOString()}: ${reason}`,
    );

    return Result.ok();
  }

  // LEGAL STATUS MANAGEMENT
  public contestGift(
    contestedBy: string,
    reason: string,
    courtDetails?: {
      caseNumber: string;
      courtStation: string;
      filingDate: Date;
    },
  ): Result<void> {
    if (this.props.isContested) {
      return Result.fail('Gift is already contested');
    }

    if (!reason || reason.trim().length < 20) {
      return Result.fail('Contestation reason must be at least 20 characters');
    }

    this.props.isContested = true;
    this.props.legalStatus = GiftLegalStatus.CONTESTED;
    this.props.contestationDetails = {
      contestedBy,
      contestationDate: new Date(),
      contestationReason: reason,
      courtCaseNumber: courtDetails?.caseNumber || null,
      courtStation: courtDetails?.courtStation || null,
    };

    this.addNote(`Gift contested by ${contestedBy}: ${reason}`);

    return Result.ok();
  }

  public resolveContestation(
    resolvedBy: string,
    resolution: string,
    outcome: 'UPHELD' | 'DISMISSED' | 'SETTLED' | 'COMPROMISE',
    courtOrderReference?: string,
    resolutionDate: Date = new Date(),
  ): Result<void> {
    if (!this.props.isContested) {
      return Result.fail('Gift is not contested');
    }

    if (!resolution || resolution.trim().length < 10) {
      return Result.fail('Resolution details must be at least 10 characters');
    }

    this.props.isContested = false;

    // Update legal status based on outcome
    switch (outcome) {
      case 'UPHELD':
        this.props.legalStatus = GiftLegalStatus.VALID;
        break;
      case 'DISMISSED':
        this.props.legalStatus = GiftLegalStatus.VALID;
        break;
      case 'SETTLED':
        this.props.legalStatus = GiftLegalStatus.SETTLED;
        break;
      case 'COMPROMISE':
        this.props.legalStatus = GiftLegalStatus.SETTLED;
        break;
    }

    if (this.props.contestationDetails) {
      this.props.contestationDetails.contestationReason += ` - RESOLVED (${outcome}): ${resolution}`;
    }

    this.props.lastModifiedBy = new UniqueEntityID(resolvedBy);

    let resolutionNote = `Contestation resolved by ${resolvedBy}: ${outcome}. ${resolution}`;
    if (courtOrderReference) {
      resolutionNote += ` (Court Order: ${courtOrderReference})`;
    }

    this.addNote(resolutionNote);

    return Result.ok();
  }

  // DOCUMENTATION MANAGEMENT
  public addSupportingDocument(
    documentId: string,
    documentType: string,
    addedBy: string,
  ): Result<void> {
    if (!documentId || documentId.trim().length === 0) {
      return Result.fail('Document ID cannot be empty');
    }

    if (this.props.supportingDocumentIds.includes(documentId)) {
      return Result.fail('Document already added');
    }

    this.props.supportingDocumentIds.push(documentId);
    this.props.lastModifiedBy = new UniqueEntityID(addedBy);

    this.addNote(`Supporting document added: ${documentType} (ID: ${documentId}) by ${addedBy}`);

    return Result.ok();
  }

  public addElderTestimony(
    elderName: string,
    elderPosition: string,
    testimony: string,
    recordedBy: string,
    testimonyDate: Date = new Date(),
  ): Result<void> {
    if (!elderName || elderName.trim().length === 0) {
      return Result.fail('Elder name is required');
    }

    if (!testimony || testimony.trim().length < 10) {
      return Result.fail('Testimony must be at least 10 characters');
    }

    this.props.elderTestimonies.push({
      elderName: elderName.trim(),
      elderPosition: elderPosition.trim(),
      testimony: testimony.trim(),
      date: testimonyDate,
    });

    this.props.lastModifiedBy = new UniqueEntityID(recordedBy);

    this.addNote(
      `Elder testimony recorded: ${elderName} (${elderPosition}) on ${testimonyDate.toISOString()}`,
    );

    return Result.ok();
  }

  // BENEFICIARY ACKNOWLEDGMENT
  public recordBeneficiaryAcknowledgment(
    acknowledgmentMethod: 'SIGNED_DOCUMENT' | 'WITNESSED_ORAL' | 'CUSTOMARY_RITE' | 'OTHER',
    acknowledgedBy: string,
    documentId?: string,
    acknowledgmentDate: Date = new Date(),
  ): Result<void> {
    if (this.props.beneficiaryAcknowledged) {
      return Result.fail('Beneficiary already acknowledged gift');
    }

    this.props.beneficiaryAcknowledged = true;
    this.props.beneficiaryAcknowledgmentDate = acknowledgmentDate;
    this.props.beneficiaryAcknowledgmentMethod = acknowledgmentMethod;
    this.props.lastModifiedBy = new UniqueEntityID(acknowledgedBy);

    if (documentId) {
      this.props.giftDeedDocumentId = documentId;
    }

    this.addNote(
      `Beneficiary acknowledgment recorded via ${acknowledgmentMethod} by ${acknowledgedBy}`,
    );

    return Result.ok();
  }

  // TAX COMPLIANCE
  public recordStampDutyPayment(
    amount: Money,
    receiptNumber: string,
    paymentDate: Date = new Date(),
    recordedBy: string,
  ): Result<void> {
    if (amount.amount <= 0) {
      return Result.fail('Stamp duty amount must be positive');
    }

    this.props.stampDutyPaid = true;
    this.props.stampDutyAmount = amount;
    this.props.stampDutyReceiptNumber = receiptNumber;
    this.props.lastModifiedBy = new UniqueEntityID(recordedBy);

    this.addNote(
      `Stamp duty paid: ${amount.amount} ${amount.currency}, Receipt: ${receiptNumber}, Date: ${paymentDate.toISOString()}`,
    );

    return Result.ok();
  }

  // VERIFICATION WORKFLOW
  public verifyGift(
    verifiedBy: string,
    verificationMethod: string,
    notes?: string,
    documentId?: string,
    verificationDate: Date = new Date(),
  ): Result<void> {
    if (this.props.verificationStatus === 'VERIFIED') {
      return Result.fail('Gift is already verified');
    }

    // Special verification for customary gifts
    if (
      this.props.customaryContext.communityAcknowledged &&
      !this.props.customaryContext.registeredWithClan
    ) {
      this.addNote('Warning: Gift community acknowledged but not registered with clan');
    }

    this.props.verificationStatus = 'VERIFIED';
    this.props.verifiedBy = new UniqueEntityID(verifiedBy);
    this.props.verifiedAt = verificationDate;
    this.props.lastModifiedBy = new UniqueEntityID(verifiedBy);

    if (documentId) {
      this.props.supportingDocumentIds.push(documentId);
    }

    let verificationNote = `Gift verified by ${verifiedBy} using ${verificationMethod}`;
    if (notes) {
      verificationNote += `. Notes: ${notes}`;
    }

    this.addNote(verificationNote);

    return Result.ok();
  }

  // VALIDATION METHODS
  public validateForHotchpot(): Result<{
    canInclude: boolean;
    requirements: string[];
    warnings: string[];
    recommendedAction: string[];
  }> {
    const requirements: string[] = [];
    const warnings: string[] = [];
    const recommendedAction: string[] = [];

    if (!this.props.isSubjectToHotchpot) {
      requirements.push('Gift is not subject to hotchpot');
      return Result.ok({
        canInclude: false,
        requirements,
        warnings,
        recommendedAction: ['No hotchpot calculation needed'],
      });
    }

    // Check documentation
    if (!this.props.giftDeedReference && this.props.valueAtGiftTime.amount > 1000000) {
      warnings.push('Large gift (> 1M KES) without gift deed reference');
      recommendedAction.push('Obtain gift deed or written acknowledgment');
    }

    // Check verification
    if (this.props.verificationStatus !== 'VERIFIED') {
      requirements.push('Gift must be verified before hotchpot calculation');
      recommendedAction.push('Verify gift documentation');
    }

    // Check condition status
    if (this.props.conditionStatus === GiftConditionStatus.PENDING) {
      requirements.push('Pending conditions must be resolved');
      recommendedAction.push('Resolve gift conditions');
    }

    // Check contestation
    if (this.props.isContested) {
      requirements.push('Contested gift cannot be included in hotchpot');
      recommendedAction.push('Resolve legal dispute');
    }

    // Check beneficiary acknowledgment
    if (!this.props.beneficiaryAcknowledged && this.props.relationshipCategory !== 'NON_FAMILY') {
      warnings.push('Beneficiary has not acknowledged gift');
      recommendedAction.push('Obtain beneficiary acknowledgment');
    }

    const canInclude = requirements.length === 0;

    return Result.ok({
      canInclude,
      requirements,
      warnings,
      recommendedAction,
    });
  }

  public getHotchpotCompliance(): {
    isSubjectToHotchpot: boolean;
    status: GiftHotchpotStatus;
    inflationAdjustedValue: Money | null;
    requirements: string[];
    exemptions: string[];
  } {
    const requirements: string[] = [];
    const exemptions: string[] = [];

    if (this.props.isSubjectToHotchpot) {
      requirements.push('Must be included in hotchpot calculation under S.35(3) LSA');
      requirements.push('Value must be adjusted for inflation from gift date to date of death');
      requirements.push('Must be disclosed in affidavit of assets');

      if (!this.props.inflationAdjustedValue) {
        requirements.push('Hotchpot value calculation pending');
      }
    }

    if (this.props.details.customaryLawExemption) {
      exemptions.push('Exempt under customary law');
      const exemptionDetail = this.props.details.getCustomaryExemptionDetails();
      if (exemptionDetail) {
        exemptions.push(exemptionDetail);
      }
    }

    if (this.props.customaryContext.communityAcknowledged) {
      exemptions.push('Community acknowledged customary gift');
    }

    return {
      isSubjectToHotchpot: this.props.isSubjectToHotchpot,
      status: this.props.hotchpotStatus,
      inflationAdjustedValue: this.props.inflationAdjustedValue,
      requirements,
      exemptions,
    };
  }

  // HELPER METHODS
  private addNote(note: string): void {
    if (this.props.notes) {
      this.props.notes += `\n${new Date().toISOString()}: ${note}`;
    } else {
      this.props.notes = `${new Date().toISOString()}: ${note}`;
    }
  }

  private calculateYearsDifference(startDate: Date, endDate: Date): number {
    const diffInMilliseconds = endDate.getTime() - startDate.getTime();
    const diffInYears = diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return diffInYears;
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }

  get recipientId(): UniqueEntityID {
    return this.props.recipientId;
  }

  get recipientName(): string {
    return this.props.recipientName;
  }

  get description(): string {
    return this.props.description;
  }

  get valueAtGiftTime(): Money {
    return this.props.valueAtGiftTime;
  }

  get dateOfGift(): Date {
    return this.props.dateOfGift;
  }

  get details(): GiftInterVivosDetails {
    return this.props.details;
  }

  get hotchpotStatus(): GiftHotchpotStatus {
    return this.props.hotchpotStatus;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  get conditionStatus(): GiftConditionStatus {
    return this.props.conditionStatus;
  }

  get legalStatus(): GiftLegalStatus {
    return this.props.legalStatus;
  }

  get isContested(): boolean {
    return this.props.isContested;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get inflationAdjustedValue(): Money | null {
    return this.props.inflationAdjustedValue;
  }

  get verificationStatus(): string {
    return this.props.verificationStatus;
  }

  get beneficiaryAcknowledged(): boolean {
    return this.props.beneficiaryAcknowledged;
  }

  get customaryContext() {
    return this.props.customaryContext;
  }

  // COMPUTED PROPERTIES
  get requiresHotchpotCalculation(): boolean {
    return (
      this.props.isSubjectToHotchpot &&
      !this.props.details.customaryLawExemption &&
      this.props.hotchpotStatus === GiftHotchpotStatus.PENDING
    );
  }

  get isConditionPending(): boolean {
    return this.props.conditionStatus === GiftConditionStatus.PENDING;
  }

  get hasFailedCondition(): boolean {
    return this.props.conditionStatus === GiftConditionStatus.FAILED;
  }

  get shouldRevertToEstate(): boolean {
    return (
      this.props.revertsToEstate ||
      (this.hasFailedCondition && this.props.details.revertsToEstate) ||
      this.props.reversionCompleted
    );
  }

  get isLegallyValid(): boolean {
    return (
      this.props.legalStatus === GiftLegalStatus.VALID &&
      !this.props.isContested &&
      this.props.conditionStatus !== GiftConditionStatus.FAILED
    );
  }

  get isCustomaryGift(): boolean {
    return (
      this.props.giftType === GiftType.CUSTOMARY_BRIDE_PRICE ||
      this.props.giftType === GiftType.TRADITIONAL_RITE ||
      this.props.customaryContext.communityAcknowledged
    );
  }

  get hotchpotValue(): Money {
    return this.props.inflationAdjustedValue || this.props.valueAtGiftTime;
  }

  // STATIC FACTORY METHODS
  public static createBridePriceGift(props: {
    estateId: string;
    deceasedId: string;
    recipientId: string;
    recipientName: string;
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    witnessDetails: string[];
    tribe: string;
    clan: string;
    elderWitnesses: string[];
    createdBy?: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: false, // Bride price traditionally exempt
      customaryLawExemption: true,
      giftDeedReference: 'Bride Price (Lobola)',
      witnessDetails: props.witnessDetails.join(', '),
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      relationshipToDeceased: 'Bride/Spouse Family',
      relationshipCategory: 'NON_FAMILY',
      giftType: GiftType.CUSTOMARY_BRIDE_PRICE,
      assetType: AssetType.OTHER,
      details,
      customaryContext: {
        tribe: props.tribe,
        clan: props.clan,
        ceremonyType: 'Bride Price Payment',
        elderWitnesses: props.elderWitnesses,
        communityAcknowledged: true,
        registeredWithClan: true,
      },
    });
  }

  public static createEducationalGift(props: {
    estateId: string;
    deceasedId: string;
    recipientId: string;
    recipientName: string;
    relationshipToDeceased: string;
    relationshipCategory: 'CHILD' | 'SIBLING' | 'EXTENDED_FAMILY';
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    conditionDescription: string;
    deadline?: Date;
    createdBy?: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: true,
      isAdvancement: true,
      revertsToEstate: true,
    }).getValue();

    const gift = GiftInterVivos.create({
      ...props,
      giftType: GiftType.EDUCATIONAL_SUPPORT,
      assetType: AssetType.FINANCIAL_ASSET,
      details,
      conditionDescription: props.conditionDescription,
    });

    if (gift.isSuccess) {
      gift.getValue().setCondition(
        {
          type: 'EDUCATION',
          description: props.conditionDescription,
          deadline: props.deadline,
          verificationRequired: true,
          verificationMethod: 'EDUCATION_CERTIFICATE',
        },
        props.createdBy || 'system',
      );
    }

    return gift;
  }

  public static createPropertyGift(props: {
    estateId: string;
    deceasedId: string;
    recipientId: string;
    recipientName: string;
    relationshipToDeceased: string;
    relationshipCategory: 'CHILD' | 'SPOUSE' | 'PARENT' | 'SIBLING';
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    giftDeedReference: string;
    witnessDetails: string[];
    giftLocation: KenyanLocation;
    createdBy?: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: true,
      giftDeedReference: props.giftDeedReference,
      witnessDetails: props.witnessDetails.join(', '),
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      giftType: GiftType.PROPERTY_TRANSFER,
      assetType: AssetType.LAND_PARCEL,
      details,
      giftLocation: props.giftLocation,
    });
  }

  public static createTraditionalRiteGift(props: {
    estateId: string;
    deceasedId: string;
    recipientId: string;
    recipientName: string;
    relationshipToDeceased: string;
    relationshipCategory: 'EXTENDED_FAMILY';
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    tribe: string;
    clan: string;
    ceremonyType: string;
    elderWitnesses: string[];
    ceremonyLocation: string;
    createdBy?: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: false,
      customaryLawExemption: true,
      witnessDetails: props.elderWitnesses.join(', '),
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      giftType: GiftType.TRADITIONAL_RITE,
      assetType: AssetType.OTHER,
      details,
      customaryContext: {
        tribe: props.tribe,
        clan: props.clan,
        ceremonyType: props.ceremonyType,
        elderWitnesses: props.elderWitnesses,
        communityAcknowledged: true,
        registeredWithClan: true,
      },
      ceremonyLocation: props.ceremonyLocation,
    });
  }
}
