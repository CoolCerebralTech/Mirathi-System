import { AggregateRoot } from '../../../base/aggregate-root';
import { UniqueEntityID } from '../../../base/entity';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';
import { GiftConditionMetEvent } from '../events/gift-condition-met.event';
import { GiftHotchpotAppliedEvent } from '../events/gift-hotchpot-applied.event';
import { GiftReclaimedEvent } from '../events/gift-reclaimed.event';
import { GiftRecordedEvent } from '../events/gift-recorded.event';
import { AssetType } from '../value-objects/asset-details.vo';
import { GiftInterVivosDetails } from '../value-objects/gift-inter-vivos-details.vo';

export enum GiftHotchpotStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE', // Not subject to hotchpot
  PENDING = 'PENDING', // Awaiting hotchpot calculation
  INCLUDED = 'INCLUDED', // Included in hotchpot calculation
  EXCLUDED = 'EXCLUDED', // Excluded from hotchpot
  RECLAIMED = 'RECLAIMED', // Gift returned to estate
}

export enum GiftConditionStatus {
  NONE = 'NONE', // No conditions
  PENDING = 'PENDING', // Condition not yet met
  MET = 'MET', // Condition fulfilled
  FAILED = 'FAILED', // Condition failed
  WAIVED = 'WAIVED', // Condition waived by testator
}

export enum GiftLegalStatus {
  VALID = 'VALID', // Legally valid gift
  VOIDABLE = 'VOIDABLE', // Potentially voidable
  CONTESTED = 'CONTESTED', // Being contested
  SETTLED = 'SETTLED', // Legally settled
}

interface GiftInterVivosProps {
  estateId: UniqueEntityID;

  // Recipient Information
  recipientId: UniqueEntityID;
  relationshipToDeceased: string;

  // Gift Details
  description: string;
  assetType: AssetType;
  valueAtGiftTime: Money;
  dateOfGift: Date;

  // Hotchpot Details (S.35(3) LSA)
  details: GiftInterVivosDetails;
  hotchpotStatus: GiftHotchpotStatus;

  // Condition Tracking
  conditionStatus: GiftConditionStatus;
  conditionDescription: string | null;
  conditionMetDate: Date | null;

  // Reconciliation Details
  reconciliationDate: Date | null;
  inflationAdjustedValue: Money | null;

  // Legal Status
  legalStatus: GiftLegalStatus;
  isContested: boolean;
  contestationReason: string | null;

  // Documentation
  giftDeedReference: string | null;
  witnessDetails: string | null;
  supportingDocumentIds: string[];

  // Customary Law Context
  customaryLawExemptionClaimed: boolean;
  customaryLawExemptionReason: string | null;

  // Reversion to Estate
  revertsToEstate: boolean;
  reversionDate: Date | null;
  reversionReason: string | null;

  // Management
  isActive: boolean;
  deletedAt: Date | null;
}

export class GiftInterVivos extends AggregateRoot<GiftInterVivosProps> {
  private constructor(props: GiftInterVivosProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: {
      estateId: string;
      recipientId: string;
      relationshipToDeceased: string;
      description: string;
      assetType: AssetType;
      valueAtGiftTime: Money;
      dateOfGift: Date;
      details: GiftInterVivosDetails;
      giftDeedReference?: string;
      witnessDetails?: string;
      conditionDescription?: string;
      customaryLawExemptionClaimed?: boolean;
      customaryLawExemptionReason?: string;
    },
    id?: string,
  ): Result<GiftInterVivos> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.estateId, argumentName: 'estateId' },
      { argument: props.recipientId, argumentName: 'recipientId' },
      { argument: props.relationshipToDeceased, argumentName: 'relationshipToDeceased' },
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

    // Determine initial hotchpot status
    let hotchpotStatus = GiftHotchpotStatus.PENDING;
    if (!props.details.isSubjectToHotchpot || props.details.customaryLawExemption) {
      hotchpotStatus = GiftHotchpotStatus.NOT_APPLICABLE;
    }

    // Determine condition status
    let conditionStatus = GiftConditionStatus.NONE;
    if (props.conditionDescription) {
      conditionStatus = GiftConditionStatus.PENDING;
    }

    // Customary law exemption validation
    if (props.customaryLawExemptionClaimed && !props.customaryLawExemptionReason) {
      return Result.warn<GiftInterVivos>('Customary law exemption should have a reason');
    }

    const giftId = id ? new UniqueEntityID(id) : new UniqueEntityID();
    const estateId = new UniqueEntityID(props.estateId);
    const recipientId = new UniqueEntityID(props.recipientId);

    const defaultProps: GiftInterVivosProps = {
      estateId,
      recipientId,
      relationshipToDeceased: props.relationshipToDeceased.trim(),
      description: props.description.trim(),
      assetType: props.assetType,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      details: props.details,
      hotchpotStatus,
      conditionStatus,
      conditionDescription: props.conditionDescription?.trim() || null,
      conditionMetDate: null,
      reconciliationDate: null,
      inflationAdjustedValue: null,
      legalStatus: GiftLegalStatus.VALID,
      isContested: false,
      contestationReason: null,
      giftDeedReference: props.giftDeedReference?.trim() || null,
      witnessDetails: props.witnessDetails?.trim() || null,
      supportingDocumentIds: [],
      customaryLawExemptionClaimed: props.customaryLawExemptionClaimed || false,
      customaryLawExemptionReason: props.customaryLawExemptionReason?.trim() || null,
      revertsToEstate: props.details.revertsToEstate,
      reversionDate: null,
      reversionReason: null,
      isActive: true,
      deletedAt: null,
    };

    const gift = new GiftInterVivos(defaultProps, giftId);

    // Add domain event for gift creation
    gift.addDomainEvent(
      new GiftRecordedEvent({
        giftId: gift.id.toString(),
        estateId: gift.props.estateId.toString(),
        recipientId: gift.props.recipientId.toString(),
        relationship: gift.props.relationshipToDeceased,
        description: gift.props.description,
        value: gift.props.valueAtGiftTime.amount,
        currency: gift.props.valueAtGiftTime.currency,
        dateOfGift: gift.props.dateOfGift,
        isSubjectToHotchpot: gift.props.details.isSubjectToHotchpot,
        createdAt: new Date(),
      }),
    );

    return Result.ok<GiftInterVivos>(gift);
  }

  // ==================== BUSINESS METHODS ====================

  // Hotchpot Calculation (S.35(3) LSA)
  public applyHotchpot(reconciliationDate: Date = new Date()): Result<void> {
    // Validate
    if (this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE) {
      return Result.fail('Gift is not subject to hotchpot');
    }

    if (this.props.hotchpotStatus === GiftHotchpotStatus.INCLUDED) {
      return Result.fail('Hotchpot already applied to this gift');
    }

    if (reconciliationDate < this.props.dateOfGift) {
      return Result.fail('Reconciliation date cannot be before gift date');
    }

    // Calculate inflation-adjusted value
    const hotchpotValue = this.props.details.calculateHotchpotValue(reconciliationDate);

    this.props.inflationAdjustedValue = hotchpotValue;
    this.props.reconciliationDate = reconciliationDate;
    this.props.hotchpotStatus = GiftHotchpotStatus.INCLUDED;

    this.addDomainEvent(
      new GiftHotchpotAppliedEvent({
        giftId: this.id.toString(),
        estateId: this.props.estateId.toString(),
        originalValue: this.props.valueAtGiftTime.amount,
        hotchpotValue: hotchpotValue.amount,
        currency: hotchpotValue.currency,
        reconciliationDate,
        inflationRate: 0.05, // 5% annual inflation assumption
        calculatedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  public excludeFromHotchpot(reason: string): Result<void> {
    if (this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE) {
      return Result.fail('Gift is already not applicable for hotchpot');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Exclusion reason must be at least 10 characters');
    }

    this.props.hotchpotStatus = GiftHotchpotStatus.EXCLUDED;

    return Result.ok();
  }

  // Condition Management
  public markConditionAsMet(metDate: Date = new Date(), notes?: string): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (this.props.conditionStatus === GiftConditionStatus.MET) {
      return Result.fail('Condition already marked as met');
    }

    this.props.conditionStatus = GiftConditionStatus.MET;
    this.props.conditionMetDate = metDate;

    this.addDomainEvent(
      new GiftConditionMetEvent({
        giftId: this.id.toString(),
        conditionDescription: this.props.conditionDescription || 'Unknown condition',
        metDate,
        notes: notes || 'Condition fulfilled',
        recordedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  public markConditionAsFailed(failureReason: string): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (!failureReason || failureReason.trim().length < 10) {
      return Result.fail('Failure reason must be at least 10 characters');
    }

    this.props.conditionStatus = GiftConditionStatus.FAILED;

    // Check if gift reverts to estate
    if (this.props.details.revertsToEstate) {
      this.reclaimToEstate(`Condition failed: ${failureReason}`);
    }

    return Result.ok();
  }

  public waiveCondition(waivedBy: string, reason: string): Result<void> {
    if (this.props.conditionStatus === GiftConditionStatus.NONE) {
      return Result.fail('Gift has no conditions');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Waiver reason must be at least 10 characters');
    }

    this.props.conditionStatus = GiftConditionStatus.WAIVED;
    this.props.conditionDescription = `${this.props.conditionDescription} (Waived by ${waivedBy}: ${reason})`;

    return Result.ok();
  }

  // Reversion to Estate
  public reclaimToEstate(reason: string): Result<void> {
    if (this.props.revertsToEstate) {
      return Result.fail('Gift already reverts to estate automatically');
    }

    if (this.props.hotchpotStatus === GiftHotchpotStatus.RECLAIMED) {
      return Result.fail('Gift already reclaimed to estate');
    }

    if (!reason || reason.trim().length < 10) {
      return Result.fail('Reclamation reason must be at least 10 characters');
    }

    this.props.hotchpotStatus = GiftHotchpotStatus.RECLAIMED;
    this.props.reversionDate = new Date();
    this.props.reversionReason = reason;

    this.addDomainEvent(
      new GiftReclaimedEvent({
        giftId: this.id.toString(),
        estateId: this.props.estateId.toString(),
        recipientId: this.props.recipientId.toString(),
        originalValue: this.props.valueAtGiftTime.amount,
        currency: this.props.valueAtGiftTime.currency,
        reason,
        reclaimedAt: new Date(),
      }),
    );

    return Result.ok();
  }

  // Legal Status Management
  public contestGift(reason: string, contestedBy: string): Result<void> {
    if (this.props.isContested) {
      return Result.fail('Gift is already contested');
    }

    if (!reason || reason.trim().length < 20) {
      return Result.fail('Contestation reason must be at least 20 characters');
    }

    this.props.isContested = true;
    this.props.contestationReason = reason;
    this.props.legalStatus = GiftLegalStatus.CONTESTED;

    return Result.ok();
  }

  public resolveContestation(
    resolution: string,
    newStatus: GiftLegalStatus = GiftLegalStatus.SETTLED,
  ): Result<void> {
    if (!this.props.isContested) {
      return Result.fail('Gift is not contested');
    }

    if (!resolution || resolution.trim().length < 10) {
      return Result.fail('Resolution details must be at least 10 characters');
    }

    this.props.isContested = false;
    this.props.legalStatus = newStatus;
    this.props.contestationReason = `${this.props.contestationReason} - RESOLVED: ${resolution}`;

    return Result.ok();
  }

  public declareVoidable(reason: string): Result<void> {
    if (this.props.legalStatus !== GiftLegalStatus.VALID) {
      return Result.fail('Only valid gifts can be declared voidable');
    }

    this.props.legalStatus = GiftLegalStatus.VOIDABLE;
    this.props.contestationReason = reason;

    return Result.ok();
  }

  // Documentation Management
  public addSupportingDocument(documentId: string): Result<void> {
    if (!documentId || documentId.trim().length === 0) {
      return Result.fail('Document ID cannot be empty');
    }

    if (this.props.supportingDocumentIds.includes(documentId)) {
      return Result.fail('Document already added');
    }

    this.props.supportingDocumentIds.push(documentId);
    return Result.ok();
  }

  public removeSupportingDocument(documentId: string): Result<void> {
    const index = this.props.supportingDocumentIds.indexOf(documentId);

    if (index === -1) {
      return Result.fail('Document not found');
    }

    this.props.supportingDocumentIds.splice(index, 1);
    return Result.ok();
  }

  // Kenyan Legal Compliance Methods
  public getHotchpotCompliance(): {
    isSubjectToHotchpot: boolean;
    requirements: string[];
    exemptions: string[];
    status: string;
  } {
    const requirements: string[] = [];
    const exemptions: string[] = [];

    if (this.props.details.isSubjectToHotchpot) {
      requirements.push('Must be included in hotchpot calculation under S.35(3) LSA');
      requirements.push('Value must be adjusted for inflation from gift date to date of death');
      requirements.push('Must be disclosed in affidavit of assets');
    }

    if (this.props.details.customaryLawExemption) {
      exemptions.push('Exempt under customary law');
      const exemptionDetail = this.props.details.getCustomaryExemptionDetails();
      if (exemptionDetail) {
        exemptions.push(exemptionDetail);
      }
    }

    if (this.props.customaryLawExemptionClaimed) {
      exemptions.push('Customary law exemption claimed by donor');
      if (this.props.customaryLawExemptionReason) {
        exemptions.push(`Reason: ${this.props.customaryLawExemptionReason}`);
      }
    }

    return {
      isSubjectToHotchpot: this.props.details.isSubjectToHotchpot,
      requirements,
      exemptions,
      status: this.props.hotchpotStatus,
    };
  }

  public getLegalValidity(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check gift date vs death date (if known)
    const currentDate = new Date();
    if (this.props.dateOfGift > currentDate) {
      issues.push('Gift date is in the future');
    }

    // Check for documentation
    if (!this.props.giftDeedReference && this.props.valueAtGiftTime.amount > 1000000) {
      issues.push('Large gift (> 1M KES) without gift deed reference');
      recommendations.push('Obtain gift deed or written acknowledgment');
    }

    // Check condition status
    if (this.props.conditionStatus === GiftConditionStatus.FAILED && !this.props.revertsToEstate) {
      issues.push('Condition failed but gift does not revert to estate');
    }

    // Check contestation
    if (this.props.isContested) {
      issues.push('Gift is under legal contestation');
      recommendations.push('Resolve legal dispute before distribution');
    }

    // Check customary law compliance
    if (this.props.customaryLawExemptionClaimed && !this.props.customaryLawExemptionReason) {
      issues.push('Customary law exemption claimed without reason');
      recommendations.push('Document customary law basis for exemption');
    }

    const isValid = issues.length === 0 && this.props.legalStatus === GiftLegalStatus.VALID;

    return {
      isValid,
      issues,
      recommendations,
    };
  }

  public calculateCurrentHotchpotValue(asOfDate: Date = new Date()): Money | null {
    if (
      !this.props.details.isSubjectToHotchpot ||
      this.props.hotchpotStatus === GiftHotchpotStatus.NOT_APPLICABLE
    ) {
      return null;
    }

    return this.props.details.calculateHotchpotValue(asOfDate);
  }

  public isAdvancement(): boolean {
    return this.props.details.isAdvancement;
  }

  // Soft Delete
  public delete(deletedBy: string, reason: string): Result<void> {
    if (this.props.deletedAt) {
      return Result.fail('Gift is already deleted');
    }

    // Cannot delete gifts that have been included in hotchpot
    if (this.props.hotchpotStatus === GiftHotchpotStatus.INCLUDED) {
      return Result.fail('Cannot delete gift that has been included in hotchpot calculation');
    }

    // Cannot delete contested gifts
    if (this.props.isContested) {
      return Result.fail('Cannot delete gift under legal contestation');
    }

    this.props.deletedAt = new Date();
    this.props.isActive = false;

    return Result.ok();
  }

  public restore(): Result<void> {
    if (!this.props.deletedAt) {
      return Result.fail('Gift is not deleted');
    }

    this.props.deletedAt = null;
    this.props.isActive = true;

    return Result.ok();
  }

  // Factory methods for common gift types
  public static createBridePriceGift(props: {
    estateId: string;
    recipientId: string;
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    witnessDetails: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: false, // Bride price traditionally exempt
      customaryLawExemption: true,
      giftDeedReference: 'Bride Price (Lobola)',
      witnessDetails: props.witnessDetails,
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      relationshipToDeceased: 'Bride/Spouse Family',
      assetType: AssetType.OTHER,
      details,
      customaryLawExemptionClaimed: true,
      customaryLawExemptionReason: 'Bride price (lobola) under customary law',
    });
  }

  public static createEducationalGift(props: {
    estateId: string;
    recipientId: string;
    relationshipToDeceased: string;
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    conditionDescription?: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: true, // Educational gifts may be subject to hotchpot
      isAdvancement: true,
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      assetType: AssetType.FINANCIAL_ASSET,
      details,
      conditionDescription: props.conditionDescription || 'For educational purposes',
    });
  }

  public static createPropertyGift(props: {
    estateId: string;
    recipientId: string;
    relationshipToDeceased: string;
    description: string;
    valueAtGiftTime: Money;
    dateOfGift: Date;
    giftDeedReference: string;
    witnessDetails: string;
  }): Result<GiftInterVivos> {
    const details = GiftInterVivosDetails.create({
      description: props.description,
      valueAtGiftTime: props.valueAtGiftTime,
      dateOfGift: props.dateOfGift,
      isSubjectToHotchpot: true,
      giftDeedReference: props.giftDeedReference,
      witnessDetails: props.witnessDetails,
    }).getValue();

    return GiftInterVivos.create({
      ...props,
      assetType: AssetType.LAND_PARCEL,
      details,
    });
  }

  // ==================== GETTERS ====================

  get id(): UniqueEntityID {
    return this._id;
  }

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get recipientId(): UniqueEntityID {
    return this.props.recipientId;
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
    return this.props.details.isSubjectToHotchpot;
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

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  // Computed properties
  get currentHotchpotValue(): Money | null {
    return this.calculateCurrentHotchpotValue();
  }

  get isCustomaryExemption(): boolean {
    return this.props.details.customaryLawExemption || this.props.customaryLawExemptionClaimed;
  }

  get requiresHotchpotCalculation(): boolean {
    return (
      this.props.details.isSubjectToHotchpot &&
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
      this.props.details.revertsToEstate ||
      (this.hasFailedCondition && this.props.details.revertsToEstate) ||
      this.props.hotchpotStatus === GiftHotchpotStatus.RECLAIMED
    );
  }

  get isLegallyValidForDistribution(): boolean {
    return (
      this.props.legalStatus === GiftLegalStatus.VALID &&
      !this.props.isContested &&
      this.props.conditionStatus !== GiftConditionStatus.FAILED
    );
  }
}
