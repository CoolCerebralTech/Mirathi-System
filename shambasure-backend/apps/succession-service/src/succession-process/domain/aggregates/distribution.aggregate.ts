import { AggregateRoot } from '@nestjs/cqrs';
import { Distribution } from '../entities/distribution.entity';
import { DistributionPlanCreatedEvent } from '../events/distribution-plan-created.event';
import { DistributionExecutedEvent } from '../events/distribution-executed.event';
import { DistributionPlanAmendedEvent } from '../events/distribution-plan-amended.event';
import { DistributionDisputedEvent } from '../events/distribution-disputed.event';
import { DistributionPlanCompletedEvent } from '../events/distribution-plan-completed.event';

export type DistributionPlanStatus =
  | 'DRAFT'
  | 'COURT_APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'AMENDED';

export interface DistributionPlanSummary {
  totalDistributions: number;
  completedDistributions: number;
  totalValue: number;
  distributedValue: number;
  status: DistributionPlanStatus;
  hasDisputes: boolean;
  hasMinors: boolean;
  hasLifeInterests: boolean;
}

export class DistributionAggregate extends AggregateRoot {
  private estateId: string;
  private grantId: string;
  private planStatus: DistributionPlanStatus;
  private distributions: Map<string, Distribution> = new Map();
  private courtApprovalDate: Date | null;
  private completionDate: Date | null;
  private amendments: {
    amendmentDate: Date;
    reason: string;
    amendedBy: string;
    changes: string[];
  }[] = [];

  private constructor(estateId: string, grantId: string) {
    super();
    this.estateId = estateId;
    this.grantId = grantId;
    this.planStatus = 'DRAFT';
    this.courtApprovalDate = null;
    this.completionDate = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(estateId: string, grantId: string): DistributionAggregate {
    const aggregate = new DistributionAggregate(estateId, grantId);

    aggregate.apply(new DistributionPlanCreatedEvent(estateId, grantId));

    return aggregate;
  }

  static reconstitute(
    estateId: string,
    grantId: string,
    distributions: Distribution[],
    status: DistributionPlanStatus,
    courtApprovalDate?: Date,
    completionDate?: Date,
    amendments: any[] = [],
  ): DistributionAggregate {
    const aggregate = new DistributionAggregate(estateId, grantId);

    aggregate.planStatus = status;
    aggregate.courtApprovalDate = courtApprovalDate || null;
    aggregate.completionDate = completionDate || null;
    aggregate.amendments = amendments;

    distributions.forEach((distribution) =>
      aggregate.distributions.set(distribution.getId(), distribution),
    );

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // PLAN MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Adds a distribution to the plan with comprehensive validation
   */
  addDistribution(distribution: Distribution): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Cannot add distributions to a finalized plan');
    }

    // 1. Asset-specific validation
    const assetId = distribution.getAssetId();
    if (assetId) {
      this.validateAssetDistribution(distribution, assetId);
    } else {
      // Residuary/cash distribution validation
      this.validateResiduaryDistribution(distribution);
    }

    // 2. Beneficiary validation
    this.validateBeneficiaryDistribution(distribution);

    // 3. Legal compliance validation
    this.validateLegalCompliance(distribution);

    this.distributions.set(distribution.getId(), distribution);

    // Update status if this is the first distribution added
    if (this.distributions.size === 1) {
      this.planStatus = 'DRAFT';
    }
  }

  /**
   * Removes a distribution from the plan
   */
  removeDistribution(distributionId: string, reason: string, removedBy: string): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Cannot remove distributions from a finalized plan');
    }

    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution not found');
    }

    this.distributions.delete(distributionId);

    // Record amendment
    this.recordAmendment(`Removed distribution ${distributionId}`, removedBy, [
      `Removed: ${distribution.getShare().getPercentage()}% to ${distribution.getBeneficiaryDisplayName()}`,
    ]);
  }

  /**
   * Court approves the distribution plan
   */
  approvePlan(approvalDate: Date, approvedBy: string, courtOrderNumber?: string): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Plan is not in draft state for approval');
    }

    if (this.distributions.size === 0) {
      throw new Error('Cannot approve empty distribution plan');
    }

    // Validate plan completeness
    const validation = this.validatePlanCompleteness();
    if (!validation.valid) {
      throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);
    }

    this.planStatus = 'COURT_APPROVED';
    this.courtApprovalDate = approvalDate;

    // Record amendment
    this.recordAmendment(
      'Court approval of distribution plan',
      approvedBy,
      ['Plan approved by court'],
      courtOrderNumber,
    );
  }

  /**
   * Starts execution of the distribution plan
   */
  startExecution(startedBy: string): void {
    if (this.planStatus !== 'COURT_APPROVED') {
      throw new Error('Plan must be court approved before execution');
    }

    this.planStatus = 'IN_PROGRESS';

    // Mark all pending distributions as in progress
    Array.from(this.distributions.values())
      .filter((dist) => dist.getStatus() === 'PENDING')
      .forEach((dist) => dist.startTransfer(startedBy));
  }

  // --------------------------------------------------------------------------
  // DISTRIBUTION EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Executes a specific distribution transfer
   */
  executeTransfer(
    distributionId: string,
    date: Date,
    options: {
      transferMethod: string;
      reference?: string;
      value?: number;
      executedBy: string;
      notes?: string;
    },
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution entitlement not found');
    }

    if (distribution.getStatus() === 'COMPLETED') {
      throw new Error('Distribution already completed');
    }

    if (distribution.getStatus() === 'DISPUTED') {
      throw new Error('Cannot execute disputed distribution');
    }

    // Validate transfer conditions
    this.validateTransferConditions(distribution, date);

    distribution.completeTransfer(date, options.transferMethod, {
      notes: options.notes,
      reference: options.reference,
      transferValue: options.value,
      completedBy: options.executedBy,
    });

    this.apply(
      new DistributionExecutedEvent(
        this.estateId,
        distributionId,
        date,
        options.transferMethod,
        options.value,
        options.executedBy,
      ),
    );

    // Check if plan is fully completed
    this.checkPlanCompletion();
  }

  /**
   * Marks a distribution as disputed
   */
  markDistributionDisputed(distributionId: string, reason: string, disputedBy: string): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution not found');
    }

    if (distribution.getStatus() === 'COMPLETED') {
      throw new Error('Cannot dispute completed distribution');
    }

    distribution.markDisputed(reason, disputedBy);
    this.planStatus = 'DISPUTED';

    this.apply(new DistributionDisputedEvent(this.estateId, distributionId, reason, disputedBy));
  }

  /**
   * Resolves a distribution dispute
   */
  resolveDistributionDispute(distributionId: string, resolution: string, resolvedBy: string): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution not found');
    }

    if (distribution.getStatus() !== 'DISPUTED') {
      throw new Error('Distribution is not disputed');
    }

    distribution.resolveDispute(resolution, resolvedBy);

    // Check if all disputes are resolved
    const hasOtherDisputes = Array.from(this.distributions.values()).some(
      (dist) => dist.getStatus() === 'DISPUTED',
    );

    if (!hasOtherDisputes) {
      this.planStatus = 'IN_PROGRESS';
    }
  }

  /**
   * Defers a distribution (for minors, conditions, etc.)
   */
  deferDistribution(
    distributionId: string,
    reason: string,
    untilDate: Date,
    deferredBy: string,
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) {
      throw new Error('Distribution not found');
    }

    distribution.defer(reason, untilDate, deferredBy);
  }

  // --------------------------------------------------------------------------
  // PLAN VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates the entire distribution plan
   */
  validatePlanCompleteness(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Check total distributions equal 100% per asset
    const assetTotals = this.calculateAssetTotals();
    assetTotals.forEach((total, assetId) => {
      if (Math.abs(total - 100) > 0.01) {
        errors.push(`Asset ${assetId} distributions total ${total.toFixed(2)}%, must equal 100%`);
      }
    });

    // 2. Check residuary distributions
    const residuaryTotal = this.calculateResiduaryTotal();
    if (residuaryTotal > 0 && Math.abs(residuaryTotal - 100) > 0.01) {
      warnings.push(
        `Residuary distributions total ${residuaryTotal.toFixed(2)}%, ensure this matches estate residue`,
      );
    }

    // 3. Check for minors without guardians
    const minorDistributions = Array.from(this.distributions.values()).filter(
      (dist) =>
        dist.getShare().getBeneficiaryType() === 'CHILD' &&
        dist.getShare().getCondition()?.includes('ATTAINING_MAJORITY_AGE'),
    );

    if (minorDistributions.length > 0) {
      warnings.push(
        `${minorDistributions.length} distributions to minors - ensure guardians are appointed`,
      );
    }

    // 4. Check life interest distributions
    const lifeInterestDistributions = Array.from(this.distributions.values()).filter((dist) =>
      dist.getShare().isLifeInterest(),
    );

    if (lifeInterestDistributions.length > 0) {
      warnings.push(
        `${lifeInterestDistributions.length} life interest distributions - ensure proper documentation`,
      );
    }

    // 5. Check conditional distributions
    const conditionalDistributions = Array.from(this.distributions.values()).filter((dist) =>
      dist.getShare().hasConditions(),
    );

    if (conditionalDistributions.length > 0) {
      warnings.push(
        `${conditionalDistributions.length} conditional distributions - ensure conditions are clear and enforceable`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets comprehensive plan summary
   */
  getPlanSummary(): DistributionPlanSummary {
    const distributions = Array.from(this.distributions.values());

    return {
      totalDistributions: distributions.length,
      completedDistributions: distributions.filter((d) => d.getStatus() === 'COMPLETED').length,
      totalValue: 0, // Would be calculated from estate valuation
      distributedValue: 0, // Would be calculated from completed distributions
      status: this.planStatus,
      hasDisputes: distributions.some((d) => d.getStatus() === 'DISPUTED'),
      hasMinors: distributions.some(
        (d) =>
          d.getShare().getBeneficiaryType() === 'CHILD' &&
          d.getShare().getCondition()?.includes('ATTAINING_MAJORITY_AGE'),
      ),
      hasLifeInterests: distributions.some((d) => d.getShare().isLifeInterest()),
    };
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  /**
   * Gets distributions by asset
   */
  getDistributionsByAsset(assetId: string): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (distribution) => distribution.getAssetId() === assetId,
    );
  }

  /**
   * Gets distributions by beneficiary
   */
  getDistributionsByBeneficiary(beneficiaryId: string): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (distribution) => distribution.getBeneficiaryId() === beneficiaryId,
    );
  }

  /**
   * Gets pending distributions
   */
  getPendingDistributions(): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (distribution) =>
        distribution.getStatus() === 'PENDING' || distribution.getStatus() === 'IN_PROGRESS',
    );
  }

  /**
   * Gets disputed distributions
   */
  getDisputedDistributions(): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (distribution) => distribution.getStatus() === 'DISPUTED',
    );
  }

  /**
   * Gets deferred distributions
   */
  getDeferredDistributions(): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (distribution) => distribution.getStatus() === 'DEFERRED',
    );
  }

  /**
   * Checks if plan is fully distributed
   */
  isFullyDistributed(): boolean {
    return Array.from(this.distributions.values()).every(
      (distribution) => distribution.getStatus() === 'COMPLETED',
    );
  }

  /**
   * Gets completion percentage
   */
  getCompletionPercentage(): number {
    const distributions = Array.from(this.distributions.values());
    if (distributions.length === 0) return 0;

    const completed = distributions.filter((d) => d.getStatus() === 'COMPLETED').length;
    return (completed / distributions.length) * 100;
  }

  // --------------------------------------------------------------------------
  // PRIVATE VALIDATION METHODS
  // --------------------------------------------------------------------------

  private validateAssetDistribution(distribution: Distribution, assetId: string): void {
    const share = distribution.getShare();

    if (share.getType() === 'ABSOLUTE_INTEREST' || share.getType() === 'LIFE_INTEREST') {
      const currentTotal = this.calculateAssetPercentage(assetId);
      const newShare = share.getPercentage();

      if (currentTotal + newShare > 100.01) {
        // Allow for floating point precision
        throw new Error(
          `Total distribution for Asset ${assetId} would exceed 100%. ` +
            `Current: ${currentTotal.toFixed(2)}%, New: ${newShare.toFixed(2)}%`,
        );
      }
    }
  }

  private validateResiduaryDistribution(distribution: Distribution): void {
    const share = distribution.getShare();

    // For residuary distributions, we might have different validation rules
    // For example, ensuring the total residuary doesn't exceed available residue
    if (share.getPercentage() <= 0) {
      throw new Error('Residuary distribution percentage must be positive');
    }
  }

  private validateBeneficiaryDistribution(distribution: Distribution): void {
    const beneficiaryId = distribution.getBeneficiaryId();
    const assetId = distribution.getAssetId();

    // Check for duplicate distributions to same beneficiary for same asset
    const existingDistribution = Array.from(this.distributions.values()).find(
      (dist) =>
        dist.getBeneficiaryId() === beneficiaryId &&
        dist.getAssetId() === assetId &&
        dist.getId() !== distribution.getId(),
    );

    if (existingDistribution) {
      throw new Error(
        `Beneficiary ${beneficiaryId} already has a distribution for asset ${assetId}`,
      );
    }
  }

  private validateLegalCompliance(distribution: Distribution): void {
    const share = distribution.getShare();

    // Life interest validations
    if (share.isLifeInterest() && share.getBeneficiaryType() !== 'SPOUSE') {
      throw new Error('Life interests are typically only for spouses under Kenyan law');
    }

    // Minor beneficiary validations
    if (share.getBeneficiaryType() === 'CHILD' && share.hasConditions()) {
      // Ensure conditions are appropriate for minors
      const validConditions = ['ATTAINING_MAJORITY_AGE', 'EDUCATION_COMPLETION'];
      const condition = share.getCondition();
      if (condition && !validConditions.some((valid) => condition.includes(valid))) {
        throw new Error(`Invalid condition for minor beneficiary: ${condition}`);
      }
    }
  }

  private validateTransferConditions(distribution: Distribution, transferDate: Date): void {
    const share = distribution.getShare();

    // Check deferral conditions
    if (distribution.getStatus() === 'DEFERRED' && distribution.getDeferredUntil()) {
      if (transferDate < distribution.getDeferredUntil()!) {
        throw new Error(
          `Cannot transfer before deferral period ends on ${distribution.getDeferredUntil()!.toDateString()}`,
        );
      }
    }

    // Check life interest conditions
    if (share.isLifeInterest() && share.terminatesOnRemarriage()) {
      // In a real system, we would check if the spouse has remarried
      // This would require integration with family/marriage records
      console.warn('Life interest transfer - ensure spouse has not remarried');
    }
  }

  private checkPlanCompletion(): void {
    if (this.isFullyDistributed() && this.planStatus !== 'COMPLETED') {
      this.planStatus = 'COMPLETED';
      this.completionDate = new Date();

      this.apply(
        new DistributionPlanCompletedEvent(
          this.estateId,
          this.completionDate,
          this.distributions.size,
        ),
      );
    }
  }

  private recordAmendment(
    reason: string,
    amendedBy: string,
    changes: string[],
    courtOrderNumber?: string,
  ): void {
    this.amendments.push({
      amendmentDate: new Date(),
      reason,
      amendedBy,
      changes,
    });

    this.planStatus = 'AMENDED';

    this.apply(
      new DistributionPlanAmendedEvent(this.estateId, reason, amendedBy, changes, courtOrderNumber),
    );
  }

  private calculateAssetTotals(): Map<string, number> {
    const totals = new Map<string, number>();

    Array.from(this.distributions.values()).forEach((distribution) => {
      const assetId = distribution.getAssetId();
      if (assetId) {
        const current = totals.get(assetId) || 0;
        totals.set(assetId, current + distribution.getShare().getPercentage());
      }
    });

    return totals;
  }

  private calculateAssetPercentage(assetId: string): number {
    return Array.from(this.distributions.values())
      .filter((dist) => dist.getAssetId() === assetId)
      .reduce((sum, dist) => sum + dist.getShare().getPercentage(), 0);
  }

  private calculateResiduaryTotal(): number {
    return Array.from(this.distributions.values())
      .filter((dist) => !dist.getAssetId()) // Residuary distributions have no asset ID
      .reduce((sum, dist) => sum + dist.getShare().getPercentage(), 0);
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getEstateId(): string {
    return this.estateId;
  }
  getGrantId(): string {
    return this.grantId;
  }
  getPlanStatus(): DistributionPlanStatus {
    return this.planStatus;
  }
  getCourtApprovalDate(): Date | null {
    return this.courtApprovalDate;
  }
  getCompletionDate(): Date | null {
    return this.completionDate;
  }
  getDistributions(): Distribution[] {
    return Array.from(this.distributions.values());
  }
  getAmendments(): any[] {
    return [...this.amendments];
  }
  getDistributionCount(): number {
    return this.distributions.size;
  }
}
