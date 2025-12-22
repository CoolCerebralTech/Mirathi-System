import { Entity } from '../../../../domain/base/entity';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
// Exceptions
import { EstateDomainException } from '../../../exceptions/estate.exception';
import { KenyanLocation } from '../../../shared/kenyan-location.vo';
import { Money } from '../../../shared/money.vo';
import { AssetType } from '../value-objects/asset-details.vo';
import { GiftInterVivosDetails } from '../value-objects/gift-inter-vivos-details.vo';

export class InvalidGiftConfigurationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidGiftConfigurationException';
  }
}

export class HotchpotCalculationException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'HotchpotCalculationException';
  }
}

export class GiftConditionException extends EstateDomainException {
  constructor(message: string) {
    super(message);
    this.name = 'GiftConditionException';
  }
}

export enum GiftHotchpotStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
  INCLUDED = 'INCLUDED',
  EXCLUDED = 'EXCLUDED',
  RECLAIMED = 'RECLAIMED',
  CALCULATION_PENDING = 'CALCULATION_PENDING',
}

export enum GiftConditionStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  MET = 'MET',
  FAILED = 'FAILED',
  WAIVED = 'WAIVED',
  TIME_EXPIRED = 'TIME_EXPIRED',
}

export enum GiftLegalStatus {
  VALID = 'VALID',
  VOIDABLE = 'VOIDABLE',
  CONTESTED = 'CONTESTED',
  SETTLED = 'SETTLED',
  INVALID = 'INVALID',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
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

export interface GiftInterVivosProps {
  estateId: UniqueEntityID;
  deceasedId: UniqueEntityID;

  // Recipient Information
  recipientId: UniqueEntityID;
  recipientName: string;
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

  // Gift Details (Polymorphic VO)
  details: GiftInterVivosDetails;

  // Kenyan Cultural Context
  customaryContext: {
    tribe: string | null;
    clan: string | null;
    ceremonyType: string | null;
    elderWitnesses: string[];
    customaryDocumentation: string | null;
    communityAcknowledged: boolean;
    registeredWithClan: boolean;
  };

  // Hotchpot Details (S.35(3) LSA)
  hotchpotStatus: GiftHotchpotStatus;
  isSubjectToHotchpot: boolean;
  hotchpotInclusionReason: string | null;
  hotchpotExclusionReason: string | null;

  // Inflation Adjustment
  inflationAdjustedValue: Money | null;
  inflationRateUsed: number | null;
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

  // Legal Status
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
    validityScore: number | null;
    riskFactors: string[];
    recommendations: string[];
  } | null;

  // Documentation
  giftDeedReference: string | null;
  giftDeedDocumentId: string | null;
  witnessDetails: string[];
  supportingDocumentIds: string[];
  photographicEvidence: string[];
  videoEvidence: string | null;
  elderTestimonies: Array<{
    elderName: string;
    elderPosition: string;
    testimony: string;
    date: Date;
  }>;

  // Location
  giftLocation: KenyanLocation | null;
  ceremonyLocation: string | null;

  // Reversion
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

  // Tax
  stampDutyPaid: boolean;
  stampDutyAmount: Money | null;
  stampDutyReceiptNumber: string | null;
  capitalGainsTaxImplication: {
    applicable: boolean;
    amount: Money | null;
    paid: boolean;
    receiptNumber: string | null;
  } | null;

  // Management
  isActive: boolean;
  requiresExecutorAttention: boolean;
  executorNotes: string | null;
  lastModifiedBy: UniqueEntityID | null;
  notes: string;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'PENDING_VERIFICATION' | 'REJECTED';
  verifiedBy: UniqueEntityID | null;
  verifiedAt: Date | null;
}

export class GiftInterVivos extends Entity<GiftInterVivosProps> {
  private constructor(props: GiftInterVivosProps, id?: UniqueEntityID) {
    super(id, props);
  }

  // Bypass readonly for internal mutation
  private get mutableProps(): GiftInterVivosProps {
    return this._props;
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
  ): GiftInterVivos {
    // 1. Validation
    if (
      !props.estateId ||
      !props.deceasedId ||
      !props.recipientId ||
      !props.giftType ||
      !props.valueAtGiftTime
    ) {
      throw new InvalidGiftConfigurationException('Missing required gift fields');
    }

    if (props.description.trim().length < 10) {
      throw new InvalidGiftConfigurationException(
        'Gift description must be at least 10 characters',
      );
    }

    if (props.dateOfGift > new Date()) {
      throw new InvalidGiftConfigurationException('Date of gift cannot be in the future');
    }

    if (props.valueAtGiftTime.amount <= 0) {
      throw new InvalidGiftConfigurationException('Gift value must be positive');
    }

    // Customary law exemption validation (treated as warning/note in aggregate logic if strictness varies)
    const customaryContext = props.customaryContext || {};

    // Determine hotchpot status based on VO logic
    // We assume the VO exposes `isExemptFromHotchpot()` or we derive it from props.
    // Based on the VO provided:
    // isExemptFromHotchpot() = !isSubjectToHotchpot || customaryLawExemption

    let hotchpotStatus = GiftHotchpotStatus.PENDING;
    if (props.details.isExemptFromHotchpot()) {
      // Distinguish why it's exempt
      // Accessing internal props via public getters or public methods of VO
      // Assuming VO has public accessors or we rely on the method.
      // For entity construction, we can map directly:
      hotchpotStatus = GiftHotchpotStatus.EXCLUDED;
      if (!props.details.toJSON().isHotchpot) {
        // Using toJSON workaround if getters missing
        hotchpotStatus = GiftHotchpotStatus.NOT_APPLICABLE;
      }
    }

    let conditionStatus = GiftConditionStatus.NONE;
    if (props.conditionDescription) {
      conditionStatus = GiftConditionStatus.PENDING;
    }

    const giftId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const deceasedId = new UniqueEntityID(props.deceasedId);
    const recipientId = new UniqueEntityID(props.recipientId);
    const createdBy = props.createdBy ? new UniqueEntityID(props.createdBy) : null;

    // Extract exemption reason
    // We need to check if it was customary exemption specifically
    const detailsJson = props.details.toJSON(); // Safe way to inspect VO properties
    const isCustomaryExempt =
      props.details.isExemptFromHotchpot() && detailsJson['isHotchpot'] === false; // Simplified check

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
      isSubjectToHotchpot: !props.details.isExemptFromHotchpot(),
      hotchpotInclusionReason: null,
      hotchpotExclusionReason: props.details.isExemptFromHotchpot()
        ? 'Exempt per gift terms/customary law'
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
      revertsToEstate: props.details.shouldRevertToEstate(),
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

    return new GiftInterVivos(defaultProps, giftId);
  }

  // ==================== BUSINESS METHODS ====================

  public calculateHotchpotValue(
    dateOfDeath: Date,
    inflationRate: number = 0.05,
    method: 'KENYA_CPI' | 'FIXED_RATE' | 'CUSTOM' = 'FIXED_RATE',
  ): Money {
    if (!this.props.isSubjectToHotchpot) {
      throw new HotchpotCalculationException('Gift is not subject to hotchpot calculation');
    }

    if (dateOfDeath <= this.props.dateOfGift) {
      throw new HotchpotCalculationException('Date of death must be after date of gift');
    }

    const yearsDifference = this.calculateYearsDifference(this.props.dateOfGift, dateOfDeath);
    const adjustedValue =
      this.props.valueAtGiftTime.amount * Math.pow(1 + inflationRate, yearsDifference);
    const hotchpotValue = Money.create(adjustedValue, this.props.valueAtGiftTime.currency);

    this.mutableProps.inflationAdjustedValue = hotchpotValue;
    this.mutableProps.inflationRateUsed = inflationRate;
    this.mutableProps.inflationAdjustmentMethod = method;
    this.mutableProps.reconciliationDate = dateOfDeath;
    this.mutableProps.hotchpotStatus = GiftHotchpotStatus.CALCULATION_PENDING;

    this.addNote(
      `Hotchpot value: ${adjustedValue.toFixed(2)} (${inflationRate * 100}% for ${yearsDifference.toFixed(1)} yrs)`,
    );

    return hotchpotValue;
  }

  public includeInHotchpot(
    includedBy: string,
    reason?: string,
    effectiveDate: Date = new Date(),
  ): void {
    if (this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE) {
      throw new HotchpotCalculationException('Gift is not subject to hotchpot');
    }
    if (this.props.hotchpotStatus === GiftHotchpotStatus.INCLUDED) {
      throw new HotchpotCalculationException('Hotchpot already applied');
    }
    if (!this.props.inflationAdjustedValue) {
      throw new HotchpotCalculationException('Hotchpot value must be calculated before inclusion');
    }

    this.mutableProps.hotchpotStatus = GiftHotchpotStatus.INCLUDED;
    this.mutableProps.hotchpotInclusionReason = reason || null;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(includedBy);

    this.addNote(`Included in hotchpot by ${includedBy}. Reason: ${reason}`);
  }

  public excludeFromHotchpot(
    excludedBy: string,
    reason: string,
    requiresCourtOrder: boolean = false,
    courtOrderReference?: string,
  ): void {
    if (!reason || reason.trim().length < 10)
      throw new HotchpotCalculationException('Exclusion reason required (min 10 chars)');

    this.mutableProps.hotchpotStatus = GiftHotchpotStatus.EXCLUDED;
    this.mutableProps.hotchpotExclusionReason = reason;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(excludedBy);

    let exclusionNote = `Excluded from hotchpot by ${excludedBy}: ${reason}`;
    if (requiresCourtOrder && courtOrderReference) {
      exclusionNote += ` (Court Order: ${courtOrderReference})`;
    }
    this.addNote(exclusionNote);
  }

  // --- Condition Management ---

  public setCondition(
    conditionDetails: {
      type: 'AGE' | 'EDUCATION' | 'MARRIAGE' | 'BUSINESS_SUCCESS' | 'CUSTOMARY_RITE' | 'OTHER';
      description: string;
      deadline?: Date;
      verificationRequired?: boolean;
      verificationMethod?: string;
    },
    setBy: string,
  ): void {
    if (this.props.conditionStatus !== GiftConditionStatus.NONE)
      throw new GiftConditionException('Gift already has a condition');
    if (!conditionDetails.description || conditionDetails.description.trim().length < 10)
      throw new GiftConditionException('Condition description required');

    this.mutableProps.conditionStatus = GiftConditionStatus.PENDING;
    this.mutableProps.conditionDescription = conditionDetails.description;
    this.mutableProps.conditionDetails = {
      type: conditionDetails.type,
      deadline: conditionDetails.deadline || null,
      verificationRequired: conditionDetails.verificationRequired || false,
      verificationMethod: conditionDetails.verificationMethod || null,
      verificationDocumentId: null,
    };
    this.mutableProps.lastModifiedBy = new UniqueEntityID(setBy);
    this.addNote(`Condition set by ${setBy}: ${conditionDetails.description}`);
  }

  public markConditionAsMet(
    metBy: string,
    verificationDocumentId?: string,
    verificationNotes?: string,
    metDate: Date = new Date(),
  ): void {
    if (this.props.conditionStatus === GiftConditionStatus.NONE)
      throw new GiftConditionException('Gift has no conditions');
    if (this.props.conditionStatus === GiftConditionStatus.MET)
      throw new GiftConditionException('Condition already met');

    if (this.props.conditionDetails?.deadline && metDate > this.props.conditionDetails.deadline) {
      this.addNote(
        `Warning: Condition met after deadline (${this.props.conditionDetails.deadline.toISOString()})`,
      );
    }

    this.mutableProps.conditionStatus = GiftConditionStatus.MET;
    this.mutableProps.conditionMetDate = metDate;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(metBy);
    if (verificationDocumentId && this.props.conditionDetails) {
      this.mutableProps.conditionDetails.verificationDocumentId = verificationDocumentId;
    }

    this.addNote(
      `Condition met by ${metBy} on ${metDate.toISOString()}. ${verificationNotes || ''}`,
    );
  }

  public markConditionAsFailed(
    failedBy: string,
    failureReason: string,
    failureDate: Date = new Date(),
  ): void {
    if (this.props.conditionStatus === GiftConditionStatus.NONE)
      throw new GiftConditionException('Gift has no conditions');

    this.mutableProps.conditionStatus = GiftConditionStatus.FAILED;
    this.mutableProps.conditionFailedDate = failureDate;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(failedBy);
    this.addNote(`Condition failed: ${failureReason}`);

    if (this.props.revertsToEstate) {
      this.reclaimToEstate(failedBy, `Condition failed: ${failureReason}`);
    }
  }

  // --- Reversion ---

  public reclaimToEstate(
    reclaimedBy: string,
    reason: string,
    reversionDocumentId?: string,
    reversionDate: Date = new Date(),
  ): void {
    if (this.props.reversionCompleted) throw new EstateDomainException('Gift already reclaimed');

    this.mutableProps.reversionCompleted = true;
    this.mutableProps.reversionDate = reversionDate;
    this.mutableProps.reversionReason = reason;
    this.mutableProps.reversionDocumentId = reversionDocumentId || null;
    this.mutableProps.hotchpotStatus = GiftHotchpotStatus.RECLAIMED;
    this.mutableProps.lastModifiedBy = new UniqueEntityID(reclaimedBy);

    this.addNote(`Reclaimed to estate by ${reclaimedBy}: ${reason}`);
  }

  // --- Contestations ---

  public contestGift(
    contestedBy: string,
    reason: string,
    courtDetails?: { caseNumber: string; courtStation: string; filingDate: Date },
  ): void {
    if (this.props.isContested) throw new EstateDomainException('Gift already contested');

    this.mutableProps.isContested = true;
    this.mutableProps.legalStatus = GiftLegalStatus.CONTESTED;
    this.mutableProps.contestationDetails = {
      contestedBy,
      contestationDate: new Date(),
      contestationReason: reason,
      courtCaseNumber: courtDetails?.caseNumber || null,
      courtStation: courtDetails?.courtStation || null,
    };
    this.addNote(`Contested by ${contestedBy}: ${reason}`);
  }

  public resolveContestation(
    resolvedBy: string,
    resolution: string,
    outcome: 'UPHELD' | 'DISMISSED' | 'SETTLED' | 'COMPROMISE',
    courtOrderReference?: string,
  ): void {
    if (!this.props.isContested) throw new EstateDomainException('Gift is not contested');

    this.mutableProps.isContested = false;

    if (outcome === 'UPHELD' || outcome === 'DISMISSED') {
      this.mutableProps.legalStatus = GiftLegalStatus.VALID;
    } else {
      this.mutableProps.legalStatus = GiftLegalStatus.SETTLED;
    }

    if (this.props.contestationDetails) {
      this.mutableProps.contestationDetails.contestationReason += ` - RESOLVED: ${outcome}`;
    }
    this.mutableProps.lastModifiedBy = new UniqueEntityID(resolvedBy);
    this.addNote(
      `Contestation resolved by ${resolvedBy}: ${outcome}. Ref: ${courtOrderReference || 'N/A'}`,
    );
  }

  // --- Helpers ---

  private addNote(note: string): void {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${note}`;
    this.mutableProps.notes = this.props.notes ? `${this.props.notes}\n${entry}` : entry;
  }

  private calculateYearsDifference(startDate: Date, endDate: Date): number {
    const diff = endDate.getTime() - startDate.getTime();
    return diff / (1000 * 60 * 60 * 24 * 365.25);
  }

  // --- Static Factories ---

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
  }): GiftInterVivos {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: false,
      customaryLawExemption: true,
      giftDeedReference: 'Bride Price (Lobola)',
      witnessDetails: props.witnessDetails.join(', '),
    });

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

  // --- Getters ---

  get id(): UniqueEntityID {
    return this._id;
  }
  get recipientId(): UniqueEntityID {
    return this.props.recipientId;
  }
  get valueAtGiftTime(): Money {
    return this.props.valueAtGiftTime;
  }
  get dateOfGift(): Date {
    return this.props.dateOfGift;
  }
  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }
  get hotchpotStatus(): GiftHotchpotStatus {
    return this.props.hotchpotStatus;
  }
  get inflationAdjustedValue(): Money | null {
    return this.props.inflationAdjustedValue;
  }
}
