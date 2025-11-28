import { AggregateRoot } from '@nestjs/cqrs';
import { EstateInventory } from '../entities/estate-inventory.entity';
import { ExecutorDuty } from '../entities/executor-duties.entity';
import { Distribution, TransferMethod } from '../entities/distribution.entity';
import { CreditorClaim } from '../entities/creditor-claim.entity';
import { DebtPriorityPolicy } from '../policies/debt-priority.policy';
import { DistributionTimingPolicy } from '../policies/distribution-timing.policy';
import { IntestateSuccessionPolicy } from '../policies/intestate-succession.policy';

// Events
import { EstateSettlementInitiatedEvent } from '../events/estate-settlement-initiated.event';
import { EstateDebtsSettledEvent } from '../events/estate-debts-settled.event';
import { EstateDistributionStartedEvent } from '../events/estate-distribution-started.event';
import { EstateSettlementCompletedEvent } from '../events/estate-settlement-completed.event';
import { EstateSettlementStalledEvent } from '../events/estate-settlement-stalled.event';

export type SettlementStatus =
  | 'INITIATED'
  | 'INVENTORY_COMPLETE'
  | 'DEBTS_SETTLED'
  | 'TAXES_PAID'
  | 'DISTRIBUTION_STARTED'
  | 'DISTRIBUTION_COMPLETE'
  | 'SETTLEMENT_COMPLETE'
  | 'STALLED'
  | 'DISPUTED';

export interface SettlementProgress {
  completedSteps: number;
  totalSteps: number;
  percentage: number;
  currentStep: string;
  estimatedCompletion?: Date;
}

export class EstateSettlementAggregate extends AggregateRoot {
  private estateId: string;
  private deceasedName: string;
  private dateOfDeath: Date;
  private status: SettlementStatus;

  // Core Settlement Components
  private inventory: Map<string, EstateInventory> = new Map();
  private claims: Map<string, CreditorClaim> = new Map();
  private duties: Map<string, ExecutorDuty> = new Map();
  private distributions: Map<string, Distribution> = new Map();

  // Financial Tracking
  private grossEstateValue: number = 0;
  private totalLiabilities: number = 0;
  private netEstateValue: number = 0;
  private settlementCosts: number = 0;
  private taxesPaid: number = 0;

  // Timeline Tracking
  private initiationDate: Date;
  private inventoryCompletionDate?: Date;
  private debtsSettlementDate?: Date;
  private distributionStartDate?: Date;
  private completionDate?: Date;

  // Legal Compliance
  private grantConfirmed: boolean = false;
  private taxClearanceObtained: boolean = false;
  private gazetteNoticePublished: boolean = false;
  private courtSupervisionRequired: boolean = false;

  // Policies
  private debtPriorityPolicy: DebtPriorityPolicy;
  private distributionTimingPolicy: DistributionTimingPolicy;
  private intestateSuccessionPolicy: IntestateSuccessionPolicy;

  private constructor(
    estateId: string,
    deceasedName: string,
    dateOfDeath: Date,
    policies: {
      debtPriorityPolicy: DebtPriorityPolicy;
      distributionTimingPolicy: DistributionTimingPolicy;
      intestateSuccessionPolicy: IntestateSuccessionPolicy;
    },
  ) {
    super();
    this.estateId = estateId;
    this.deceasedName = deceasedName;
    this.dateOfDeath = dateOfDeath;
    this.status = 'INITIATED';
    this.initiationDate = new Date();

    this.debtPriorityPolicy = policies.debtPriorityPolicy;
    this.distributionTimingPolicy = policies.distributionTimingPolicy;
    this.intestateSuccessionPolicy = policies.intestateSuccessionPolicy;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    estateId: string,
    deceasedName: string,
    dateOfDeath: Date,
    policies: {
      debtPriorityPolicy: DebtPriorityPolicy;
      distributionTimingPolicy: DistributionTimingPolicy;
      intestateSuccessionPolicy: IntestateSuccessionPolicy;
    },
  ): EstateSettlementAggregate {
    const aggregate = new EstateSettlementAggregate(estateId, deceasedName, dateOfDeath, policies);

    aggregate.apply(
      new EstateSettlementInitiatedEvent(estateId, deceasedName, dateOfDeath, new Date()),
    );

    return aggregate;
  }

  static reconstitute(
    estateId: string,
    deceasedName: string,
    dateOfDeath: Date,
    status: SettlementStatus,
    inventory: EstateInventory[],
    claims: CreditorClaim[],
    duties: ExecutorDuty[],
    distributions: Distribution[],
    financials: {
      grossEstateValue: number;
      totalLiabilities: number;
      netEstateValue: number;
      settlementCosts: number;
      taxesPaid: number;
    },
    timeline: {
      initiationDate: Date;
      inventoryCompletionDate?: Date;
      debtsSettlementDate?: Date;
      distributionStartDate?: Date;
      completionDate?: Date;
    },
    compliance: {
      grantConfirmed: boolean;
      taxClearanceObtained: boolean;
      gazetteNoticePublished: boolean;
      courtSupervisionRequired: boolean;
    },
    policies: {
      debtPriorityPolicy: DebtPriorityPolicy;
      distributionTimingPolicy: DistributionTimingPolicy;
      intestateSuccessionPolicy: IntestateSuccessionPolicy;
    },
  ): EstateSettlementAggregate {
    const aggregate = new EstateSettlementAggregate(estateId, deceasedName, dateOfDeath, policies);

    aggregate.status = status;

    // Restore financials
    aggregate.grossEstateValue = financials.grossEstateValue;
    aggregate.totalLiabilities = financials.totalLiabilities;
    aggregate.netEstateValue = financials.netEstateValue;
    aggregate.settlementCosts = financials.settlementCosts;
    aggregate.taxesPaid = financials.taxesPaid;

    // Restore timeline
    aggregate.initiationDate = timeline.initiationDate;
    aggregate.inventoryCompletionDate = timeline.inventoryCompletionDate;
    aggregate.debtsSettlementDate = timeline.debtsSettlementDate;
    aggregate.distributionStartDate = timeline.distributionStartDate;
    aggregate.completionDate = timeline.completionDate;

    // Restore compliance
    aggregate.grantConfirmed = compliance.grantConfirmed;
    aggregate.taxClearanceObtained = compliance.taxClearanceObtained;
    aggregate.gazetteNoticePublished = compliance.gazetteNoticePublished;
    aggregate.courtSupervisionRequired = compliance.courtSupervisionRequired;

    // Restore entities
    inventory.forEach((item) => aggregate.inventory.set(item.getId(), item));
    claims.forEach((claim) => aggregate.claims.set(claim.getId(), claim));
    duties.forEach((duty) => aggregate.duties.set(duty.getId(), duty));
    distributions.forEach((dist) => aggregate.distributions.set(dist.getId(), dist));

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // INVENTORY MANAGEMENT (Form P&A 5)
  // --------------------------------------------------------------------------

  addInventoryItem(item: EstateInventory): void {
    if (this.inventory.has(item.getId())) {
      throw new Error('Inventory item already exists.');
    }

    this.inventory.set(item.getId(), item);
    this.recalculateEstateValue();

    // Check if inventory is complete
    if (this.isInventoryComplete()) {
      this.markInventoryComplete();
    }
  }

  verifyInventoryItem(itemId: string, verifier: string, method: string, notes?: string): void {
    const item = this.inventory.get(itemId);
    if (!item) throw new Error('Inventory item not found.');

    item.verify(verifier, method, { notes });

    // Recalculate values after verification
    this.recalculateEstateValue();
  }

  updateInventoryValuation(itemId: string): void {
    const item = this.inventory.get(itemId);
    if (!item) throw new Error('Inventory item not found.');

    // This would require creating a new AssetValue - assuming method exists
    // item.updateValuation(new AssetValue(newValue, 'KES'), updatedBy, reason);

    this.recalculateEstateValue();
  }

  removeInventoryItem(itemId: string, reason: string, removedBy: string): void {
    const item = this.inventory.get(itemId);
    if (!item) throw new Error('Inventory item not found.');

    item.remove(reason, removedBy);
    this.recalculateEstateValue();
  }

  private recalculateEstateValue(): void {
    this.grossEstateValue = Array.from(this.inventory.values())
      .filter((item) => item.getIsVerified() && item.getStatus() !== 'REMOVED')
      .reduce((sum, item) => sum + item.getValue().getAmount(), 0);

    this.netEstateValue =
      this.grossEstateValue - this.totalLiabilities - this.settlementCosts - this.taxesPaid;
  }

  private isInventoryComplete(): boolean {
    const unverifiedItems = Array.from(this.inventory.values()).filter(
      (item) => !item.getIsVerified() && item.getStatus() !== 'REMOVED',
    );

    return unverifiedItems.length === 0 && this.inventory.size > 0;
  }

  private markInventoryComplete(): void {
    if (this.status === 'INITIATED') {
      this.status = 'INVENTORY_COMPLETE';
      this.inventoryCompletionDate = new Date();
    }
  }

  // --------------------------------------------------------------------------
  // CREDITOR CLAIMS MANAGEMENT
  // --------------------------------------------------------------------------

  addCreditorClaim(claim: CreditorClaim): void {
    if (this.claims.has(claim.getId())) {
      throw new Error('Creditor claim already exists.');
    }

    this.claims.set(claim.getId(), claim);
    this.recalculateLiabilities();
  }

  approveClaim(claimId: string, approvedBy: string): void {
    const claim = this.claims.get(claimId);
    if (!claim) throw new Error('Creditor claim not found.');

    claim.accept(approvedBy);
    this.recalculateLiabilities();
  }

  rejectClaim(claimId: string, reason: string, rejectedBy: string): void {
    const claim = this.claims.get(claimId);
    if (!claim) throw new Error('Creditor claim not found.');

    claim.reject(reason, rejectedBy);
    this.recalculateLiabilities();
  }

  payClaim(
    claimId: string,
    amount: number,
    paymentMethod: string,
    transactionReference?: string,
  ): void {
    const claim = this.claims.get(claimId);
    if (!claim) throw new Error('Creditor claim not found.');

    claim.markAsPaid(amount, paymentMethod, transactionReference);
    this.recalculateLiabilities();

    // Check if all debts are settled
    if (this.areAllDebtsSettled()) {
      this.markDebtsSettled();
    }
  }

  private recalculateLiabilities(): void {
    this.totalLiabilities = Array.from(this.claims.values())
      .filter((claim) => claim.getStatus() === 'ACCEPTED' || claim.getStatus() === 'PARTIALLY_PAID')
      .reduce((sum, claim) => sum + claim.getOutstandingBalance(), 0);

    this.netEstateValue =
      this.grossEstateValue - this.totalLiabilities - this.settlementCosts - this.taxesPaid;
  }

  private areAllDebtsSettled(): boolean {
    const unsettledClaims = Array.from(this.claims.values()).filter(
      (claim) =>
        (claim.getStatus() === 'ACCEPTED' && claim.getOutstandingBalance() > 0) ||
        claim.getStatus() === 'PARTIALLY_PAID',
    );

    return unsettledClaims.length === 0;
  }

  private markDebtsSettled(): void {
    if (this.status === 'INVENTORY_COMPLETE') {
      this.status = 'DEBTS_SETTLED';
      this.debtsSettlementDate = new Date();

      this.apply(new EstateDebtsSettledEvent(this.estateId, this.totalLiabilities, new Date()));
    }
  }

  // --------------------------------------------------------------------------
  // EXECUTOR DUTIES MANAGEMENT
  // --------------------------------------------------------------------------

  assignExecutorDuty(duty: ExecutorDuty): void {
    if (this.duties.has(duty.getId())) {
      throw new Error('Executor duty already exists.');
    }

    this.duties.set(duty.getId(), duty);
  }

  completeDuty(
    dutyId: string,
    options?: {
      notes?: string;
      supportingDocuments?: string[];
      completedBy?: string;
    },
  ): void {
    const duty = this.duties.get(dutyId);
    if (!duty) throw new Error('Executor duty not found.');

    duty.complete(new Date(), options);

    // Check if we can proceed to next phase
    this.checkSettlementProgress();
  }

  markDutyInProgress(dutyId: string, estimatedCompletion?: Date, progressNotes?: string): void {
    const duty = this.duties.get(dutyId);
    if (!duty) throw new Error('Executor duty not found.');

    duty.markInProgress(estimatedCompletion, progressNotes);
  }

  extendDutyDeadline(dutyId: string, newDeadline: Date, reason: string, extendedBy: string): void {
    const duty = this.duties.get(dutyId);
    if (!duty) throw new Error('Executor duty not found.');

    duty.extendDeadline(newDeadline, reason, extendedBy);
  }

  // --------------------------------------------------------------------------
  // DISTRIBUTION MANAGEMENT
  // --------------------------------------------------------------------------

  addDistribution(distribution: Distribution): void {
    if (this.distributions.has(distribution.getId())) {
      throw new Error('Distribution already exists.');
    }

    this.distributions.set(distribution.getId(), distribution);
  }

  startDistribution(distributionId: string, initiatedBy: string): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found.');

    if (this.status !== 'DEBTS_SETTLED' && this.status !== 'TAXES_PAID') {
      throw new Error('Cannot start distribution before debts and taxes are settled.');
    }

    distribution.startTransfer(initiatedBy);

    if (this.status === 'DEBTS_SETTLED' || this.status === 'TAXES_PAID') {
      this.status = 'DISTRIBUTION_STARTED';
      this.distributionStartDate = new Date();

      this.apply(new EstateDistributionStartedEvent(this.estateId, new Date()));
    }
  }

  completeDistribution(
    distributionId: string,
    transferMethod: TransferMethod,
    options?: {
      notes?: string;
      reference?: string;
      transferValue?: number;
      completedBy?: string;
    },
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found.');

    distribution.completeTransfer(new Date(), transferMethod, options);

    // Check if all distributions are complete
    if (this.areAllDistributionsComplete()) {
      this.markSettlementComplete();
    }
  }

  private areAllDistributionsComplete(): boolean {
    const incompleteDistributions = Array.from(this.distributions.values()).filter(
      (dist) => dist.getStatus() !== 'COMPLETED',
    );

    return incompleteDistributions.length === 0;
  }

  private markSettlementComplete(): void {
    this.status = 'SETTLEMENT_COMPLETE';
    this.completionDate = new Date();

    this.apply(
      new EstateSettlementCompletedEvent(
        this.estateId,
        this.deceasedName,
        this.completionDate,
        this.grossEstateValue,
        this.netEstateValue,
      ),
    );
  }

  // --------------------------------------------------------------------------
  // SETTLEMENT PROGRESS & VALIDATION
  // --------------------------------------------------------------------------

  checkSettlementProgress(): void {
    // Update status based on current state
    if (this.isInventoryComplete() && this.status === 'INITIATED') {
      this.markInventoryComplete();
    }

    if (this.areAllDebtsSettled() && this.status === 'INVENTORY_COMPLETE') {
      this.markDebtsSettled();
    }

    if (this.areAllDistributionsComplete() && this.status === 'DISTRIBUTION_STARTED') {
      this.markSettlementComplete();
    }

    // Check for stalled settlement
    if (this.isSettlementStalled()) {
      this.markSettlementStalled();
    }
  }

  isSettlementStalled(): boolean {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const lastActivityDate = this.getLastActivityDate();
    return lastActivityDate < sixMonthsAgo && this.status !== 'SETTLEMENT_COMPLETE';
  }

  markSettlementStalled(): void {
    this.status = 'STALLED';

    this.apply(
      new EstateSettlementStalledEvent(
        this.estateId,
        this.deceasedName,
        new Date(),
        this.getProgress().currentStep,
      ),
    );
  }

  getProgress(): SettlementProgress {
    const steps = this.getSettlementSteps();
    const completedSteps = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const currentStep = steps.find((step) => !step.completed)?.description || 'Completed';

    return {
      completedSteps,
      totalSteps,
      percentage: Math.round(percentage),
      currentStep,
    };
  }

  private getSettlementSteps(): { description: string; completed: boolean }[] {
    return [
      { description: 'Estate Inventory Complete', completed: this.status !== 'INITIATED' },
      {
        description: 'Creditor Claims Settled',
        completed: [
          'DEBTS_SETTLED',
          'TAXES_PAID',
          'DISTRIBUTION_STARTED',
          'DISTRIBUTION_COMPLETE',
          'SETTLEMENT_COMPLETE',
        ].includes(this.status),
      },
      { description: 'Tax Obligations Paid', completed: this.taxClearanceObtained },
      { description: 'Grant of Representation Confirmed', completed: this.grantConfirmed },
      {
        description: 'Asset Distribution Started',
        completed: [
          'DISTRIBUTION_STARTED',
          'DISTRIBUTION_COMPLETE',
          'SETTLEMENT_COMPLETE',
        ].includes(this.status),
      },
      {
        description: 'All Distributions Complete',
        completed: this.status === 'SETTLEMENT_COMPLETE',
      },
    ];
  }

  // --------------------------------------------------------------------------
  // LEGAL COMPLIANCE METHODS
  // --------------------------------------------------------------------------

  markGrantConfirmed(): void {
    this.grantConfirmed = true;
    this.checkSettlementProgress();
  }

  markTaxClearanceObtained(): void {
    this.taxClearanceObtained = true;

    if (this.status === 'DEBTS_SETTLED') {
      this.status = 'TAXES_PAID';
    }

    this.checkSettlementProgress();
  }

  markGazetteNoticePublished(): void {
    this.gazetteNoticePublished = true;
  }

  requireCourtSupervision(required: boolean): void {
    this.courtSupervisionRequired = required;
  }

  // --------------------------------------------------------------------------
  // FINANCIAL METHODS
  // --------------------------------------------------------------------------

  recordSettlementCost(amount: number): void {
    this.settlementCosts += amount;
    this.recalculateEstateValue();
  }

  recordTaxPayment(amount: number): void {
    this.taxesPaid += amount;
    this.recalculateEstateValue();
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  getSettlementTimeline(): { phase: string; startDate: Date; endDate?: Date }[] {
    const timeline: { phase: string; startDate: Date; endDate?: Date }[] = [
      { phase: 'Initiation', startDate: this.initiationDate },
    ];

    if (this.inventoryCompletionDate) {
      timeline.push({ phase: 'Inventory Complete', startDate: this.inventoryCompletionDate });
    }

    if (this.debtsSettlementDate) {
      timeline.push({ phase: 'Debts Settled', startDate: this.debtsSettlementDate });
    }

    if (this.distributionStartDate) {
      timeline.push({ phase: 'Distribution Started', startDate: this.distributionStartDate });
    }

    if (this.completionDate) {
      timeline.push({
        phase: 'Settlement Complete',
        startDate: this.completionDate,
        endDate: this.completionDate,
      });
    }

    return timeline;
  }

  getOutstandingTasks(): ExecutorDuty[] {
    return Array.from(this.duties.values())
      .filter((duty) => duty.getStatus() !== 'COMPLETED' && duty.getStatus() !== 'WAIVED')
      .sort((a, b) => a.getDeadline().getTime() - b.getDeadline().getTime());
  }

  getCriticalIssues(): string[] {
    const issues: string[] = [];

    if (!this.grantConfirmed && this.status !== 'INITIATED') {
      issues.push('Grant of representation not confirmed');
    }

    if (!this.taxClearanceObtained && this.status === 'DEBTS_SETTLED') {
      issues.push('Tax clearance certificate not obtained');
    }

    if (this.isSettlementStalled()) {
      issues.push('Settlement process appears to be stalled');
    }

    const overdueDuties = this.getOutstandingTasks().filter(
      (duty) => duty.getStatus() === 'OVERDUE',
    );

    if (overdueDuties.length > 0) {
      issues.push(`${overdueDuties.length} executor duties are overdue`);
    }

    return issues;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private getLastActivityDate(): Date {
    const dates = [
      this.initiationDate,
      this.inventoryCompletionDate,
      this.debtsSettlementDate,
      this.distributionStartDate,
      this.completionDate,
      new Date(), // Default to now if no activity
    ].filter((date) => date !== undefined);

    return new Date(Math.max(...dates.map((d) => d.getTime())));
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getEstateId(): string {
    return this.estateId;
  }
  getDeceasedName(): string {
    return this.deceasedName;
  }
  getDateOfDeath(): Date {
    return this.dateOfDeath;
  }
  getStatus(): SettlementStatus {
    return this.status;
  }
  getGrossEstateValue(): number {
    return this.grossEstateValue;
  }
  getTotalLiabilities(): number {
    return this.totalLiabilities;
  }
  getNetEstateValue(): number {
    return this.netEstateValue;
  }
  getSettlementCosts(): number {
    return this.settlementCosts;
  }
  getTaxesPaid(): number {
    return this.taxesPaid;
  }
  getInitiationDate(): Date {
    return this.initiationDate;
  }
  getInventoryCompletionDate(): Date | undefined {
    return this.inventoryCompletionDate;
  }
  getDebtsSettlementDate(): Date | undefined {
    return this.debtsSettlementDate;
  }
  getDistributionStartDate(): Date | undefined {
    return this.distributionStartDate;
  }
  getCompletionDate(): Date | undefined {
    return this.completionDate;
  }
  isGrantConfirmed(): boolean {
    return this.grantConfirmed;
  }
  isTaxClearanceObtained(): boolean {
    return this.taxClearanceObtained;
  }
  isGazetteNoticePublished(): boolean {
    return this.gazetteNoticePublished;
  }
  isCourtSupervisionRequired(): boolean {
    return this.courtSupervisionRequired;
  }
  getDebtPriorityPolicy(): DebtPriorityPolicy {
    return this.debtPriorityPolicy;
  }

  getDistributionTimingPolicy(): DistributionTimingPolicy {
    return this.distributionTimingPolicy;
  }

  getIntestateSuccessionPolicy(): IntestateSuccessionPolicy {
    return this.intestateSuccessionPolicy;
  }

  getInventory(): EstateInventory[] {
    return Array.from(this.inventory.values());
  }
  getClaims(): CreditorClaim[] {
    return Array.from(this.claims.values());
  }
  getDuties(): ExecutorDuty[] {
    return Array.from(this.duties.values());
  }
  getDistributions(): Distribution[] {
    return Array.from(this.distributions.values());
  }

  // Method to get aggregate state for persistence
  getState() {
    return {
      estateId: this.estateId,
      deceasedName: this.deceasedName,
      dateOfDeath: this.dateOfDeath,
      status: this.status,
      financials: {
        grossEstateValue: this.grossEstateValue,
        totalLiabilities: this.totalLiabilities,
        netEstateValue: this.netEstateValue,
        settlementCosts: this.settlementCosts,
        taxesPaid: this.taxesPaid,
      },
      timeline: {
        initiationDate: this.initiationDate,
        inventoryCompletionDate: this.inventoryCompletionDate,
        debtsSettlementDate: this.debtsSettlementDate,
        distributionStartDate: this.distributionStartDate,
        completionDate: this.completionDate,
      },
      compliance: {
        grantConfirmed: this.grantConfirmed,
        taxClearanceObtained: this.taxClearanceObtained,
        gazetteNoticePublished: this.gazetteNoticePublished,
        courtSupervisionRequired: this.courtSupervisionRequired,
      },
      inventory: this.getInventory(),
      claims: this.getClaims(),
      duties: this.getDuties(),
      distributions: this.getDistributions(),
    };
  }
}
