// domain/events/estate.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Estate Domain Events
 *
 * These events capture all state changes in the Estate aggregate
 *
 * Legal Compliance:
 * - S.83 LSA: Executor accountability requires audit trail
 * - Events are immutable (can't alter legal history)
 * - Every event has timestamp (statute of limitations)
 * - Events form chain of evidence for court disputes
 *
 * Integration:
 * - Events notify other bounded contexts (Family, Succession, Documents)
 * - Async handlers trigger workflows (recalculation, notifications)
 * - Event store enables temporal queries ("state at date of death")
 *
 * Event Naming Convention: <Aggregate><Action><Past Tense>Event
 * Examples: EstateCreatedEvent, AssetAddedToEstateEvent
 */

// =============================================================================
// ESTATE LIFECYCLE EVENTS
// =============================================================================

/**
 * EstateCreatedEvent
 *
 * Emitted when: Estate aggregate is created (death confirmed)
 *
 * Triggers:
 * - Succession-Service: Create ReadinessAssessment
 * - Notifications-Service: Notify next of kin
 * - Auditing-Service: Log estate opening
 *
 * Business Impact:
 * - Starts the probate clock (6 months to file in Kenya)
 * - Enables asset/debt recording
 */
export interface EstateCreatedEventPayload {
  deceasedId: string;
  deceasedFullName: string;
  dateOfDeath: Date;
  createdBy?: string; // User who created estate
}

export class EstateCreatedEvent extends DomainEvent<EstateCreatedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateCreatedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getDeceasedId(): string {
    return this.payload.deceasedId;
  }

  public getDeceasedFullName(): string {
    return this.payload.deceasedFullName;
  }

  public getDateOfDeath(): Date {
    return this.payload.dateOfDeath;
  }
}

/**
 * EstateMarkedAsTestateEvent
 *
 * Emitted when: Estate confirmed to have valid will
 *
 * Triggers:
 * - Will-Service: Activate will for distribution
 * - Succession-Service: Use testate distribution logic
 */
export interface EstateMarkedAsTestateEventPayload {
  willId?: string;
  markedBy?: string;
  markedAt: Date;
}

export class EstateMarkedAsTestateEvent extends DomainEvent<EstateMarkedAsTestateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateMarkedAsTestateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * EstateMarkedAsIntestateEvent
 *
 * Emitted when: Estate confirmed to have no valid will
 *
 * Triggers:
 * - Succession-Service: Apply S.35 LSA intestate rules
 * - Family-Service: Verify family structure for distribution
 */
export interface EstateMarkedAsIntestateEventPayload {
  reason: string; // "No will found", "Will invalid", etc.
  markedBy?: string;
  markedAt: Date;
}

export class EstateMarkedAsIntestateEvent extends DomainEvent<EstateMarkedAsIntestateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateMarkedAsIntestateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getReason(): string {
    return this.payload.reason;
  }
}

/**
 * EstateFrozenEvent
 *
 * Emitted when: Estate is frozen (dispute, tax hold, court order)
 *
 * Triggers:
 * - Succession-Service: Block distribution workflows
 * - Notifications-Service: Alert executor and beneficiaries
 *
 * Business Impact:
 * - Prevents any modifications to estate
 * - Distribution cannot proceed
 */
export interface EstateFrozenEventPayload {
  reason: string;
  frozenBy?: string;
  frozenAt: Date;
  courtOrderRef?: string;
  expectedUnfreezeDate?: Date;
}

export class EstateFrozenEvent extends DomainEvent<EstateFrozenEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateFrozenEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getReason(): string {
    return this.payload.reason;
  }

  public isCourtOrdered(): boolean {
    return !!this.payload.courtOrderRef;
  }
}

/**
 * EstateUnfrozenEvent
 *
 * Emitted when: Estate freeze is lifted
 *
 * Triggers:
 * - Succession-Service: Resume distribution workflows
 * - Notifications-Service: Alert executor
 */
export interface EstateUnfrozenEventPayload {
  reason: string;
  unfrozenBy?: string;
  unfrozenAt: Date;
}

export class EstateUnfrozenEvent extends DomainEvent<EstateUnfrozenEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateUnfrozenEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

// =============================================================================
// ASSET EVENTS
// =============================================================================

/**
 * AssetAddedToEstateEvent
 *
 * Emitted when: Asset added to estate inventory
 *
 * Triggers:
 * - Documents-Service: Request supporting documents
 * - Estate-Service: Recalculate gross value
 * - Succession-Service: Update readiness assessment
 *
 * Business Impact:
 * - Increases estate value
 * - May require verification before distribution
 */
export interface AssetAddedToEstateEventPayload {
  assetId: string;
  assetName: string;
  assetType: string;
  value: number; // KES
  ownershipType: string;
  deceasedSharePercentage: number;
  addedBy?: string;
  addedAt: Date;
}

export class AssetAddedToEstateEvent extends DomainEvent<AssetAddedToEstateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetAddedToEstateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getAssetId(): string {
    return this.payload.assetId;
  }

  public getAssetValue(): number {
    return this.payload.value;
  }

  public getAssetType(): string {
    return this.payload.assetType;
  }
}

/**
 * AssetRemovedFromEstateEvent
 *
 * Emitted when: Asset removed from estate
 *
 * Triggers:
 * - Estate-Service: Recalculate gross value
 * - Auditing-Service: Log asset removal with reason
 */
export interface AssetRemovedFromEstateEventPayload {
  assetId: string;
  assetName: string;
  reason: string;
  removedBy?: string;
  removedAt: Date;
}

export class AssetRemovedFromEstateEvent extends DomainEvent<AssetRemovedFromEstateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetRemovedFromEstateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getReason(): string {
    return this.payload.reason;
  }
}

/**
 * AssetValueUpdatedEvent
 *
 * Emitted when: Asset value is updated (revaluation)
 *
 * Triggers:
 * - Estate-Service: Recalculate gross value
 * - Succession-Service: Recalculate distribution shares
 *
 * Business Impact:
 * - Changes estate value
 * - May affect beneficiary shares
 */
export interface AssetValueUpdatedEventPayload {
  assetId: string;
  assetName: string;
  oldValue: number;
  newValue: number;
  valuationDate: Date;
  valuationSource?: string;
  updatedBy?: string;
}

export class AssetValueUpdatedEvent extends DomainEvent<AssetValueUpdatedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetValueUpdatedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getValueChange(): number {
    return this.payload.newValue - this.payload.oldValue;
  }

  public getValueChangePercentage(): number {
    if (this.payload.oldValue === 0) return 0;
    return ((this.payload.newValue - this.payload.oldValue) / this.payload.oldValue) * 100;
  }
}

/**
 * AssetVerifiedEvent
 *
 * Emitted when: Asset verification completed successfully
 *
 * Triggers:
 * - Succession-Service: Update readiness score
 * - Notifications-Service: Notify executor
 *
 * Business Impact:
 * - Asset becomes distributable
 * - May unblock distribution if last pending asset
 */
export interface AssetVerifiedEventPayload {
  assetId: string;
  assetName: string;
  verifiedBy: string;
  verifiedAt: Date;
  verificationNotes?: string;
}

export class AssetVerifiedEvent extends DomainEvent<AssetVerifiedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetVerifiedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * AssetVerificationRejectedEvent
 *
 * Emitted when: Asset verification rejected
 *
 * Triggers:
 * - Notifications-Service: Alert executor with reason
 * - Documents-Service: Request additional documents
 */
export interface AssetVerificationRejectedEventPayload {
  assetId: string;
  assetName: string;
  rejectionReason: string;
  rejectedBy: string;
  rejectedAt: Date;
}

export class AssetVerificationRejectedEvent extends DomainEvent<AssetVerificationRejectedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetVerificationRejectedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getRejectionReason(): string {
    return this.payload.rejectionReason;
  }
}

/**
 * AssetDisputedEvent
 *
 * Emitted when: Asset is disputed by beneficiary/creditor
 *
 * Triggers:
 * - Succession-Service: Flag asset as blocking distribution
 * - Notifications-Service: Alert all parties
 * - Auditing-Service: Log dispute for court
 *
 * Business Impact:
 * - Blocks distribution until resolved
 * - May require court intervention
 */
export interface AssetDisputedEventPayload {
  assetId: string;
  assetName: string;
  disputeReason: string;
  disputedBy: string;
  disputedAt: Date;
  disputantType: 'BENEFICIARY' | 'CREDITOR' | 'CO_OWNER' | 'OTHER';
}

export class AssetDisputedEvent extends DomainEvent<AssetDisputedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AssetDisputedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getDisputeReason(): string {
    return this.payload.disputeReason;
  }

  public getDisputantType(): string {
    return this.payload.disputantType;
  }
}

// =============================================================================
// DEBT EVENTS (S.45 LSA Priority)
// =============================================================================

/**
 * DebtAddedToEstateEvent
 *
 * Emitted when: Debt added to estate liabilities
 *
 * Triggers:
 * - Estate-Service: Recalculate net value
 * - Succession-Service: Check solvency
 * - Auditing-Service: Log debt with S.45 priority
 *
 * Business Impact:
 * - Decreases distributable estate
 * - High-priority debts may block distribution
 */
export interface DebtAddedToEstateEventPayload {
  debtId: string;
  debtType: string;
  creditorName: string;
  amount: number;
  priority: string; // S.45 tier
  isSecured: boolean;
  securedAssetId?: string;
  addedBy?: string;
  addedAt: Date;
}

export class DebtAddedToEstateEvent extends DomainEvent<DebtAddedToEstateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DebtAddedToEstateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getDebtId(): string {
    return this.payload.debtId;
  }

  public getAmount(): number {
    return this.payload.amount;
  }

  public getPriority(): string {
    return this.payload.priority;
  }

  public isSecured(): boolean {
    return this.payload.isSecured;
  }
}

/**
 * DebtRemovedFromEstateEvent
 *
 * Emitted when: Debt removed from estate
 *
 * Triggers:
 * - Estate-Service: Recalculate net value
 * - Auditing-Service: Log removal with reason
 */
export interface DebtRemovedFromEstateEventPayload {
  debtId: string;
  reason: string;
  removedBy?: string;
  removedAt: Date;
}

export class DebtRemovedFromEstateEvent extends DomainEvent<DebtRemovedFromEstateEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DebtRemovedFromEstateEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * DebtPaymentRecordedEvent
 *
 * Emitted when: Payment made against debt
 *
 * Triggers:
 * - Estate-Service: Recalculate total liabilities
 * - Succession-Service: Check if distribution unblocked
 * - Notifications-Service: Notify creditor
 *
 * Business Impact:
 * - Reduces liabilities
 * - May unblock distribution if critical debt settled
 */
export interface DebtPaymentRecordedEventPayload {
  debtId: string;
  paymentAmount: number;
  remainingBalance: number;
  paymentDate: Date;
  paymentMethod?: string;
  paidBy?: string;
}

export class DebtPaymentRecordedEvent extends DomainEvent<DebtPaymentRecordedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DebtPaymentRecordedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getPaymentAmount(): number {
    return this.payload.paymentAmount;
  }

  public getRemainingBalance(): number {
    return this.payload.remainingBalance;
  }

  public isFullySettled(): boolean {
    return this.payload.remainingBalance === 0;
  }
}

/**
 * DebtSettledEvent
 *
 * Emitted when: Debt fully paid/settled
 *
 * Triggers:
 * - Succession-Service: Check if all critical debts settled
 * - Notifications-Service: Notify executor and creditor
 * - Auditing-Service: Log settlement for S.45 compliance
 *
 * Business Impact:
 * - May unblock distribution
 * - Reduces estate liabilities to zero for this debt
 */
export interface DebtSettledEventPayload {
  debtId: string;
  debtType: string;
  creditorName: string;
  originalAmount: number;
  settlementDate: Date;
  settlementMethod?: string;
}

export class DebtSettledEvent extends DomainEvent<DebtSettledEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DebtSettledEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * DebtDisputedEvent
 *
 * Emitted when: Debt is disputed (validity, amount, priority)
 *
 * Triggers:
 * - Succession-Service: Flag debt as disputed
 * - Notifications-Service: Alert all parties
 * - Auditing-Service: Log for court
 *
 * Business Impact:
 * - Debt excluded from calculations until resolved
 * - May require court determination
 */
export interface DebtDisputedEventPayload {
  debtId: string;
  disputeReason: string;
  disputedBy: string;
  disputedAt: Date;
  disputeType: 'VALIDITY' | 'AMOUNT' | 'PRIORITY' | 'SECURITY';
}

export class DebtDisputedEvent extends DomainEvent<DebtDisputedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DebtDisputedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getDisputeType(): string {
    return this.payload.disputeType;
  }
}

// =============================================================================
// LEGAL DEPENDANT EVENTS (S.26/S.29 LSA)
// =============================================================================

/**
 * DependantClaimFiledEvent
 *
 * Emitted when: Legal dependant files claim against estate
 *
 * Triggers:
 * - Succession-Service: Update distribution calculations
 * - Documents-Service: Request supporting evidence
 * - Notifications-Service: Alert executor
 *
 * Business Impact:
 * - May reduce beneficiary shares (S.26 provision)
 * - Requires verification before distribution
 */
export interface DependantClaimFiledEventPayload {
  dependantId: string;
  claimantId: string;
  relationshipToDeceased: string;
  dependencyLevel: string;
  monthlyNeeds?: number;
  annualProvision?: number;
  filedAt: Date;
  legalBasis: string; // S.29(a), S.29(b), etc.
}

export class DependantClaimFiledEvent extends DomainEvent<DependantClaimFiledEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DependantClaimFiledEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getClaimantId(): string {
    return this.payload.claimantId;
  }

  public getRelationship(): string {
    return this.payload.relationshipToDeceased;
  }

  public getLegalBasis(): string {
    return this.payload.legalBasis;
  }
}

/**
 * DependantClaimVerifiedEvent
 *
 * Emitted when: Dependant claim verified
 *
 * Triggers:
 * - Succession-Service: Include in distribution calculations
 * - Notifications-Service: Notify dependant and executor
 */
export interface DependantClaimVerifiedEventPayload {
  dependantId: string;
  claimantId: string;
  verifiedBy: string;
  verifiedAt: Date;
  approvedMonthlyProvision?: number;
  verificationNotes?: string;
}

export class DependantClaimVerifiedEvent extends DomainEvent<DependantClaimVerifiedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DependantClaimVerifiedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * DependantClaimRejectedEvent
 *
 * Emitted when: Dependant claim rejected
 *
 * Triggers:
 * - Notifications-Service: Notify dependant with reason
 * - Auditing-Service: Log rejection
 */
export interface DependantClaimRejectedEventPayload {
  dependantId: string;
  claimantId: string;
  rejectionReason: string;
  rejectedBy: string;
  rejectedAt: Date;
}

export class DependantClaimRejectedEvent extends DomainEvent<DependantClaimRejectedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DependantClaimRejectedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getRejectionReason(): string {
    return this.payload.rejectionReason;
  }
}

/**
 * DependantClaimRemovedEvent
 *
 * Emitted when: Dependant claim withdrawn/removed
 *
 * Triggers:
 * - Succession-Service: Recalculate distribution
 * - Auditing-Service: Log removal
 */
export interface DependantClaimRemovedEventPayload {
  dependantId: string;
  reason: string;
  removedBy?: string;
  removedAt: Date;
}

export class DependantClaimRemovedEvent extends DomainEvent<DependantClaimRemovedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DependantClaimRemovedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

// =============================================================================
// GIFT INTER VIVOS EVENTS (S.35(3) Hotchpot)
// =============================================================================

/**
 * GiftInterVivosRecordedEvent
 *
 * Emitted when: Gift made during deceased's lifetime is recorded
 *
 * Triggers:
 * - Estate-Service: Recalculate hotchpot value
 * - Succession-Service: Adjust beneficiary entitlements
 * - Documents-Service: Request proof of gift
 *
 * Business Impact:
 * - Increases hotchpot estate value (S.35(3))
 * - May reduce recipient's final inheritance share
 */
export interface GiftInterVivosRecordedEventPayload {
  giftId: string;
  recipientId: string;
  recipientName: string;
  assetType: string;
  value: number; // Value at time of gift
  dateOfGift: Date;
  isSubjectToHotchpot: boolean;
  hotchpotReason?: string;
  recordedBy?: string;
  recordedAt: Date;
}

export class GiftInterVivosRecordedEvent extends DomainEvent<GiftInterVivosRecordedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: GiftInterVivosRecordedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getGiftValue(): number {
    return this.payload.value;
  }

  public isSubjectToHotchpot(): boolean {
    return this.payload.isSubjectToHotchpot;
  }

  public getRecipientId(): string {
    return this.payload.recipientId;
  }
}

/**
 * GiftInterVivosVerifiedEvent
 *
 * Emitted when: Gift record verified with supporting evidence
 *
 * Triggers:
 * - Succession-Service: Include in hotchpot calculation
 * - Notifications-Service: Notify executor
 */
export interface GiftInterVivosVerifiedEventPayload {
  giftId: string;
  recipientId: string;
  verifiedBy: string;
  verifiedAt: Date;
  verificationNotes?: string;
}

export class GiftInterVivosVerifiedEvent extends DomainEvent<GiftInterVivosVerifiedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: GiftInterVivosVerifiedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

/**
 * GiftInterVivosRemovedEvent
 *
 * Emitted when: Gift record removed from estate
 *
 * Triggers:
 * - Estate-Service: Recalculate hotchpot value
 * - Auditing-Service: Log removal
 */
export interface GiftInterVivosRemovedEventPayload {
  giftId: string;
  reason: string;
  removedBy?: string;
  removedAt: Date;
}

export class GiftInterVivosRemovedEvent extends DomainEvent<GiftInterVivosRemovedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: GiftInterVivosRemovedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }
}

// =============================================================================
// ESTATE CALCULATION EVENTS
// =============================================================================

/**
 * EstateValueRecalculatedEvent
 *
 * Emitted when: Estate financial values recalculated
 *
 * Triggers:
 * - Succession-Service: Recalculate distribution shares
 * - Notifications-Service: Alert executor if significant change
 *
 * Business Impact:
 * - Updated gross, net, and hotchpot values
 * - May affect distribution amounts
 */
export interface EstateValueRecalculatedEventPayload {
  grossValue: number;
  totalLiabilities: number;
  netValue: number;
  hotchpotValue?: number;
  previousGrossValue?: number;
  previousNetValue?: number;
  recalculatedAt: Date;
  recalculationTrigger: string;
}

export class EstateValueRecalculatedEvent extends DomainEvent<EstateValueRecalculatedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateValueRecalculatedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getNetValue(): number {
    return this.payload.netValue;
  }

  public getValueChange(): number {
    if (!this.payload.previousNetValue) return 0;
    return this.payload.netValue - this.payload.previousNetValue;
  }

  public hasSignificantChange(): boolean {
    if (!this.payload.previousNetValue) return false;
    const changePercentage = Math.abs(this.getValueChange() / this.payload.previousNetValue) * 100;
    return changePercentage > 10; // >10% change
  }
}

/**
 * EstateSolvencyChangedEvent
 *
 * Emitted when: Estate solvency status changes
 *
 * Triggers:
 * - Succession-Service: Update distribution strategy
 * - Notifications-Service: Alert executor and beneficiaries
 *
 * Business Impact:
 * - CRITICAL: Insolvent estates cannot distribute
 * - May require asset liquidation
 */
export interface EstateSolvencyChangedEventPayload {
  isSolvent: boolean;
  previousSolvency: boolean;
  insolvencyShortfall?: number;
  changedAt: Date;
  trigger: string;
}

export class EstateSolvencyChangedEvent extends DomainEvent<EstateSolvencyChangedEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateSolvencyChangedEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public isSolvent(): boolean {
    return this.payload.isSolvent;
  }

  public isNowInsolvent(): boolean {
    return !this.payload.isSolvent && this.payload.previousSolvency;
  }

  public getInsolvencyShortfall(): number {
    return this.payload.insolvencyShortfall || 0;
  }
}

/**
 * EstateReadyForDistributionEvent
 *
 * Emitted when: Estate meets all criteria for distribution
 *
 * Triggers:
 * - Succession-Service: Generate distribution plan
 * - Notifications-Service: Notify executor to proceed
 *
 * Business Impact:
 * - Estate can now be distributed
 * - All blockers cleared
 */
export interface EstateReadyForDistributionEventPayload {
  netDistributableValue: number;
  verifiedAssetsCount: number;
  settledCriticalDebtsCount: number;
  readyAt: Date;
}

export class EstateReadyForDistributionEvent extends DomainEvent<EstateReadyForDistributionEventPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateReadyForDistributionEventPayload,
  ) {
    super(aggregateId, aggregateType, version, payload);
  }

  public getNetDistributableValue(): number {
    return this.payload.netDistributableValue;
  }
}
