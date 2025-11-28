import { Injectable } from '@nestjs/common';
import { EstateAggregate } from '../../../estate-planning/domain/aggregates/estate.aggregate';
import { DebtPriorityPolicy } from '../policies/debt-priority.policy';
import { Distribution } from '../entities/distribution.entity';

@Injectable()
export class DistributionValidatorService {
  constructor(private readonly debtPolicy: DebtPriorityPolicy) {}

  validateDistributionPlan(
    estate: EstateAggregate,
    proposedDistributions: Distribution[],
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Insolvency Check (Section 83)
    // Must pay Funeral & Taxes first.
    const outstandingDebts = estate.getOutstandingDebts();

    // Map Estate Planning Debts to the format expected by Policy if simpler
    // Here we assume they share the Debt entity interface
    const debtCheck = this.debtPolicy.canDistributeAssets(outstandingDebts as any);

    if (!debtCheck.allowed) {
      errors.push(debtCheck.blockingReason!);
    }

    // 2. Math Check (Shares)
    // Check if we are distributing more than we have?
    // For percentages:
    const totalPercent = proposedDistributions.reduce(
      (sum, d) => sum + d.getShare().getPercentage(),
      0,
    );

    if (totalPercent > 100) {
      errors.push(`Total distribution equals ${totalPercent}%, cannot exceed 100%.`);
    }

    // 3. Asset Availability
    // Check if distributed assets actually exist in the Estate Aggregate
    const estateAssets = estate.getAllAssets().map((a) => a.getId());

    for (const dist of proposedDistributions) {
      const assetId = dist.getAssetId();
      if (assetId && assetId !== 'RESIDUARY' && !estateAssets.includes(assetId)) {
        errors.push(`Distribution references unknown Asset ID: ${assetId}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
