import { AggregateRoot } from '@nestjs/cqrs';

import { Distribution, TransferMethod } from '../entities/distribution.entity';
import { DistributionDisputedEvent } from '../events/distribution-disputed.event';
import { DistributionExecutedEvent } from '../events/distribution-executed.event';
import { DistributionPlanAmendedEvent } from '../events/distribution-plan-amended.event';
import { DistributionPlanCompletedEvent } from '../events/distribution-plan-completed.event';
import { DistributionPlanCreatedEvent } from '../events/distribution-plan-created.event';

export interface DistributionPlanAmendment {
  amendmentDate: Date;
  reason: string;
  amendedBy: string;
  changes: string[];
  courtOrderNumber?: string;
}

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
  private amendments: DistributionPlanAmendment[] = [];

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
    amendments: DistributionPlanAmendment[] = [],
  ): DistributionAggregate {
    const aggregate = new DistributionAggregate(estateId, grantId);

    aggregate.planStatus = status;
    aggregate.courtApprovalDate = courtApprovalDate || null;
    aggregate.completionDate = completionDate || null;

    aggregate.amendments = amendments.map((a) => ({
      amendmentDate: new Date(a.amendmentDate),
      reason: a.reason,
      amendedBy: a.amendedBy,
      changes: [...a.changes],
      courtOrderNumber: a.courtOrderNumber || undefined, // Ensure undefined if null/missing
    }));

    distributions.forEach((distribution) =>
      aggregate.distributions.set(distribution.getId(), distribution),
    );

    return aggregate;
  }

  // --------------------------------------------------------------------------
  // PLAN MANAGEMENT
  // --------------------------------------------------------------------------

  addDistribution(distribution: Distribution): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Cannot add distributions to a finalized plan');
    }

    const assetId = distribution.getAssetId();
    if (assetId) {
      this.validateAssetDistribution(distribution, assetId);
    } else {
      this.validateResiduaryDistribution(distribution);
    }

    this.validateBeneficiaryDistribution(distribution);
    this.validateLegalCompliance(distribution);

    this.distributions.set(distribution.getId(), distribution);

    if (this.distributions.size === 1) {
      this.planStatus = 'DRAFT';
    }
  }

  removeDistribution(distributionId: string, reason: string, removedBy: string): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Cannot remove distributions from a finalized plan');
    }

    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found');

    this.distributions.delete(distributionId);

    this.recordAmendment(`Removed distribution ${distributionId}`, removedBy, [
      `Removed: ${distribution.getShare().getPercentage()}% to ${distribution.getBeneficiaryDisplayName()}`,
    ]);
  }

  approvePlan(approvalDate: Date, approvedBy: string, courtOrderNumber?: string): void {
    if (this.planStatus !== 'DRAFT' && this.planStatus !== 'AMENDED') {
      throw new Error('Plan is not in draft state for approval');
    }
    if (this.distributions.size === 0) throw new Error('Cannot approve empty distribution plan');

    const validation = this.validatePlanCompleteness();
    if (!validation.valid)
      throw new Error(`Plan validation failed: ${validation.errors.join(', ')}`);

    this.planStatus = 'COURT_APPROVED';
    this.courtApprovalDate = approvalDate;

    this.recordAmendment(
      'Court approval of distribution plan',
      approvedBy,
      ['Plan approved by court'],
      courtOrderNumber,
    );
  }

  startExecution(startedBy: string): void {
    if (this.planStatus !== 'COURT_APPROVED')
      throw new Error('Plan must be court approved before execution');

    this.planStatus = 'IN_PROGRESS';

    Array.from(this.distributions.values())
      .filter((dist) => dist.getStatus() === 'PENDING')
      .forEach((dist) => dist.startTransfer(startedBy));
  }

  // --------------------------------------------------------------------------
  // DISTRIBUTION EXECUTION
  // --------------------------------------------------------------------------

  executeTransfer(
    distributionId: string,
    date: Date,
    options: {
      transferMethod: TransferMethod;
      reference?: string;
      value?: number;
      executedBy: string;
      notes?: string;
    },
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution entitlement not found');
    if (distribution.getStatus() === 'COMPLETED') throw new Error('Distribution already completed');
    if (distribution.getStatus() === 'DISPUTED')
      throw new Error('Cannot execute disputed distribution');

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

    this.checkPlanCompletion();
  }

  markDistributionDisputed(distributionId: string, reason: string, disputedBy: string): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found');
    if (distribution.getStatus() === 'COMPLETED')
      throw new Error('Cannot dispute completed distribution');

    distribution.markDisputed(reason, disputedBy);
    this.planStatus = 'DISPUTED';

    this.apply(
      new DistributionDisputedEvent(distributionId, this.estateId, reason, disputedBy, new Date()),
    );
  }

  resolveDistributionDispute(distributionId: string, resolution: string, resolvedBy: string): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found');
    if (distribution.getStatus() !== 'DISPUTED') throw new Error('Distribution is not disputed');

    distribution.resolveDispute(resolution, resolvedBy);

    const hasOtherDisputes = Array.from(this.distributions.values()).some(
      (dist) => dist.getStatus() === 'DISPUTED',
    );
    if (!hasOtherDisputes) {
      this.planStatus = 'IN_PROGRESS';
    }
  }

  deferDistribution(
    distributionId: string,
    reason: string,
    untilDate: Date,
    deferredBy: string,
  ): void {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) throw new Error('Distribution not found');
    distribution.defer(reason, untilDate, deferredBy);
  }

  // --------------------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------------------

  validatePlanCompleteness(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const assetTotals = this.calculateAssetTotals();
    assetTotals.forEach((total, assetId) => {
      if (Math.abs(total - 100) > 0.01) {
        errors.push(`Asset ${assetId} distributions total ${total.toFixed(2)}%, must equal 100%`);
      }
    });

    const residuaryTotal = this.calculateResiduaryTotal();
    if (residuaryTotal > 0 && Math.abs(residuaryTotal - 100) > 0.01) {
      warnings.push(
        `Residuary distributions total ${residuaryTotal.toFixed(2)}%, ensure this matches estate residue`,
      );
    }

    const minorDistributions = Array.from(this.distributions.values()).filter(
      (dist) =>
        dist.getShare().getBeneficiaryType() === 'CHILD' &&
        dist.getShare().getCondition()?.includes('ATTAINING_MAJORITY_AGE'),
    );
    if (minorDistributions.length > 0)
      warnings.push(
        `${minorDistributions.length} distributions to minors - ensure guardians are appointed`,
      );

    const lifeInterestDistributions = Array.from(this.distributions.values()).filter((dist) =>
      dist.getShare().isLifeInterest(),
    );
    if (lifeInterestDistributions.length > 0)
      warnings.push(
        `${lifeInterestDistributions.length} life interest distributions - ensure proper documentation`,
      );

    return { valid: errors.length === 0, errors, warnings };
  }

  getPlanSummary(): DistributionPlanSummary {
    const distributions = Array.from(this.distributions.values());
    return {
      totalDistributions: distributions.length,
      completedDistributions: distributions.filter((d) => d.getStatus() === 'COMPLETED').length,
      totalValue: 0,
      distributedValue: 0,
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
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private validateAssetDistribution(distribution: Distribution, assetId: string): void {
    const share = distribution.getShare();
    if (share.getType() === 'ABSOLUTE_INTEREST' || share.getType() === 'LIFE_INTEREST') {
      const currentTotal = this.calculateAssetPercentage(assetId);
      const newShare = share.getPercentage();
      if (currentTotal + newShare > 100.01) {
        throw new Error(
          `Total distribution for Asset ${assetId} would exceed 100%. Current: ${currentTotal.toFixed(2)}%, New: ${newShare.toFixed(2)}%`,
        );
      }
    }
  }

  private validateResiduaryDistribution(distribution: Distribution): void {
    const share = distribution.getShare();
    if (share.getPercentage() <= 0)
      throw new Error('Residuary distribution percentage must be positive');
  }

  private validateBeneficiaryDistribution(distribution: Distribution): void {
    const beneficiaryId = distribution.getBeneficiaryId();
    const assetId = distribution.getAssetId();
    const existing = Array.from(this.distributions.values()).find(
      (dist) =>
        dist.getBeneficiaryId() === beneficiaryId &&
        dist.getAssetId() === assetId &&
        dist.getId() !== distribution.getId(),
    );
    if (existing)
      throw new Error(
        `Beneficiary ${beneficiaryId} already has a distribution for asset ${assetId}`,
      );
  }

  private validateLegalCompliance(distribution: Distribution): void {
    const share = distribution.getShare();
    if (share.isLifeInterest() && share.getBeneficiaryType() !== 'SPOUSE') {
      throw new Error('Life interests are typically only for spouses under Kenyan law');
    }
    if (share.getBeneficiaryType() === 'CHILD' && share.hasConditions()) {
      const validConditions = ['ATTAINING_MAJORITY_AGE', 'EDUCATION_COMPLETION'];
      const condition = share.getCondition();
      if (condition && !validConditions.some((valid) => condition.includes(valid))) {
        throw new Error(`Invalid condition for minor beneficiary: ${condition}`);
      }
    }
  }

  private validateTransferConditions(distribution: Distribution, transferDate: Date): void {
    if (distribution.getStatus() === 'DEFERRED' && distribution.getDeferredUntil()) {
      if (transferDate < distribution.getDeferredUntil()!) {
        throw new Error(
          `Cannot transfer before deferral period ends on ${distribution.getDeferredUntil()!.toDateString()}`,
        );
      }
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
      courtOrderNumber,
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
      .filter((dist) => !dist.getAssetId())
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
  getAmendments(): DistributionPlanAmendment[] {
    return [...this.amendments];
  }
  getDistributionCount(): number {
    return this.distributions.size;
  }

  getDistributionsByAsset(assetId: string): Distribution[] {
    return Array.from(this.distributions.values()).filter((d) => d.getAssetId() === assetId);
  }

  getDistributionsByBeneficiary(beneficiaryId: string): Distribution[] {
    return Array.from(this.distributions.values()).filter(
      (d) => d.getBeneficiaryId() === beneficiaryId,
    );
  }

  isFullyDistributed(): boolean {
    return Array.from(this.distributions.values()).every((d) => d.getStatus() === 'COMPLETED');
  }

  getCompletionPercentage(): number {
    const ds = Array.from(this.distributions.values());
    if (ds.length === 0) return 0;
    return (ds.filter((d) => d.getStatus() === 'COMPLETED').length / ds.length) * 100;
  }
}
