import { AggregateRoot } from '@nestjs/cqrs';
import { Distribution } from '../entities/distribution.entity';
import { SharePercentage } from '../../estate-planning/domain/value-objects/share-percentage.vo';

export class DistributionAggregate extends AggregateRoot {
  private estateId: string;
  private distributions: Map<string, Distribution> = new Map();

  private constructor(estateId: string) {
    super();
    this.estateId = estateId;
  }

  static create(estateId: string): DistributionAggregate {
    return new DistributionAggregate(estateId);
  }

  static reconstitute(estateId: string, distributions: Distribution[]): DistributionAggregate {
    const agg = new DistributionAggregate(estateId);
    distributions.forEach((d) => agg.distributions.set(d.getId(), d));
    return agg;
  }

  // --------------------------------------------------------------------------
  // PLAN MANAGEMENT
  // --------------------------------------------------------------------------

  addDistribution(distribution: Distribution): void {
    // 1. Integrity Check: Total Shares
    // If this is a Percentage share, check if we exceed 100% for the Asset?
    // Note: Distribution Entity has 'assetId'.
    // This logic mirrors WillAggregate but applied to the final Court-Approved plan.

    const assetId = distribution.getAssetId();
    if (assetId && distribution.getShare().getType() === 'ABSOLUTE_INTEREST') {
      // Calculate existing total for this asset
      const currentTotal = this.calculateTotalPercentage(assetId);
      const newShare = distribution.getShare().getPercentage();

      if (currentTotal + newShare > 100) {
        throw new Error(`Total distribution for Asset ${assetId} exceeds 100%.`);
      }
    }

    this.distributions.set(distribution.getId(), distribution);
  }

  private calculateTotalPercentage(assetId: string): number {
    return Array.from(this.distributions.values())
      .filter((d) => d.getAssetId() === assetId)
      .reduce((sum, d) => sum + d.getShare().getPercentage(), 0);
  }

  // --------------------------------------------------------------------------
  // EXECUTION
  // --------------------------------------------------------------------------

  /**
   * Marks a specific entitlement as physically transferred.
   */
  executeTransfer(distributionId: string, date: Date, notes?: string): void {
    const dist = this.distributions.get(distributionId);
    if (!dist) throw new Error('Distribution entitlement not found.');

    dist.completeTransfer(date, notes);
  }

  isFullyDistributed(): boolean {
    return Array.from(this.distributions.values()).every((d) => d.getStatus() === 'COMPLETED');
  }

  getDistributions(): Distribution[] {
    return Array.from(this.distributions.values());
  }
}
