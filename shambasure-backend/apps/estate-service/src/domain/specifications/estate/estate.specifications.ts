// domain/specifications/estate/estate.specifications.ts
import { Estate } from '../../aggregates/estate.aggregate';
import { Money } from '../../value-objects';
import { Specification } from '../base/specification';

/**
 * Estate Specifications
 *
 * Business rules encoded as specification objects
 * Implements Law of Succession Act (Cap 160) requirements
 *
 * Usage:
 * - Validation: estate.validate() checks specifications
 * - Queries: repository.find(spec) filters by specification
 * - Business logic: if (spec.isSatisfiedBy(estate)) { ... }
 *
 * Composition:
 * const readyForDistribution = new IsSolventSpecification()
 *   .and(new HasNoCriticalDebtsSpecification())
 *   .and(new IsNotFrozenSpecification());
 */

// =============================================================================
// SOLVENCY SPECIFICATIONS (S.45 LSA)
// =============================================================================

/**
 * Is Estate Solvent Specification
 *
 * Business Rule:
 * - Assets must be >= Liabilities
 * - Insolvent estates cannot distribute
 * - Triggers bankruptcy proceedings
 *
 * Legal Basis: S.45 LSA - Debts must be paid before distribution
 */
export class IsSolventSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.isSolvent();
  }
}

/**
 * Has Sufficient Liquidity Specification
 *
 * Business Rule:
 * - Liquid assets must cover critical debts
 * - Prevents forced asset liquidation
 *
 * Threshold: Liquid assets >= Critical debts
 */
export class HasSufficientLiquiditySpecification extends Specification<Estate> {
  constructor(private readonly liquidityRatioThreshold: number = 0.5) {
    super();
  }

  public isSatisfiedBy(estate: Estate): boolean {
    const criticalDebts = estate.getCriticalDebts();
    const criticalDebtAmount = Money.sum(criticalDebts.map((d) => d.outstandingBalance));

    if (criticalDebtAmount.isZero()) {
      return true; // No critical debts
    }

    // Check if liquid assets cover at least threshold % of critical debts
    const liquidAssets = this.calculateLiquidAssets(estate);
    const coverage = liquidAssets.getAmount() / criticalDebtAmount.getAmount();

    return coverage >= this.liquidityRatioThreshold;
  }

  private calculateLiquidAssets(estate: Estate): Money {
    const assets = Array.from(estate.assets.values());
    const liquidAssets = assets
      .filter((asset) => asset.type.isLiquid() && asset.isActive && !asset.isDeleted)
      .map((asset) => asset.getDistributableValue());

    return Money.sum(liquidAssets);
  }
}

/**
 * Can Cover Critical Debts Specification
 *
 * Business Rule:
 * - Estate must be able to pay S.45(a)-(c) debts
 * - Critical debts block distribution
 *
 * Legal Basis: S.45(a)-(c) LSA priority debts
 */
export class CanCoverCriticalDebtsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.canCoverCriticalDebts();
  }
}

// =============================================================================
// DEBT SPECIFICATIONS (S.45 LSA)
// =============================================================================

/**
 * Has No Outstanding Critical Debts Specification
 *
 * Business Rule:
 * - All S.45(a)-(c) debts must be settled
 * - Required for distribution to proceed
 *
 * Critical Debts:
 * - Funeral expenses (S.45(a))
 * - Testamentary expenses (S.45(a))
 * - Secured debts (S.45(b))
 * - Taxes, rates, wages (S.45(c))
 */
export class HasNoCriticalDebtsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.areCriticalDebtsSettled();
  }
}

/**
 * Has No Disputed Debts Specification
 *
 * Business Rule:
 * - Disputed debts must be resolved before distribution
 * - Court intervention required for disputes
 */
export class HasNoDisputedDebtsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    const debts = Array.from(estate.debts.values());
    return !debts.some((debt) => debt.status === 'DISPUTED');
  }
}

// =============================================================================
// ASSET SPECIFICATIONS
// =============================================================================

/**
 * All Assets Verified Specification
 *
 * Business Rule:
 * - All assets must be verified before distribution
 * - Unverified assets block distribution
 *
 * Verification required per S.83 LSA (executor accountability)
 */
export class AllAssetsVerifiedSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    const assets = Array.from(estate.assets.values());
    const activeAssets = assets.filter((asset) => asset.isActive && !asset.isDeleted);

    if (activeAssets.length === 0) {
      return false; // No assets to distribute
    }

    return activeAssets.every((asset) => asset.verificationStatus.isVerified());
  }
}

/**
 * Has Verified Assets Specification
 *
 * Business Rule:
 * - Estate must have at least one verified asset
 * - Required for distribution to have value
 */
export class HasVerifiedAssetsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.getVerifiedAssets().length > 0;
  }
}

/**
 * Has No Disputed Assets Specification
 *
 * Business Rule:
 * - Disputed assets must be resolved before distribution
 * - Court intervention required for disputes
 */
export class HasNoDisputedAssetsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    const assets = Array.from(estate.assets.values());
    return !assets.some((asset) => asset.verificationStatus.isDisputed());
  }
}

/**
 * Has Minimum Estate Value Specification
 *
 * Business Rule:
 * - Estate must meet minimum threshold for distribution
 * - Small estates may qualify for summary administration
 *
 * Legal Context:
 * - Summary administration threshold: ~100,000 KES
 * - High-value estates require court supervision
 */
export class HasMinimumEstateValueSpecification extends Specification<Estate> {
  constructor(private readonly minimumValue: Money) {
    super();
  }

  public isSatisfiedBy(estate: Estate): boolean {
    return estate.netEstateValueKES.greaterThanOrEqual(this.minimumValue);
  }
}

// =============================================================================
// STATUS SPECIFICATIONS
// =============================================================================

/**
 * Is Not Frozen Specification
 *
 * Business Rule:
 * - Frozen estates cannot be modified
 * - Freeze reasons: dispute, tax hold, court order
 */
export class IsNotFrozenSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return !estate.isFrozen;
  }
}

/**
 * Is Testate Specification
 *
 * Business Rule:
 * - Estate has valid will
 * - Distribution follows will instructions
 */
export class IsTestateSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.isTestate;
  }
}

/**
 * Is Intestate Specification
 *
 * Business Rule:
 * - Estate has no valid will
 * - Distribution follows S.35/S.40 LSA rules
 */
export class IsIntestateSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.isIntestate;
  }
}

// =============================================================================
// DISTRIBUTION READINESS SPECIFICATIONS
// =============================================================================

/**
 * Is Ready For Distribution Specification
 *
 * Business Rule (Composite):
 * - Estate is solvent
 * - All critical debts settled
 * - All assets verified
 * - Estate is not frozen
 * - Has at least one verified asset
 *
 * This is the master specification for distribution
 */
export class IsReadyForDistributionSpecification extends Specification<Estate> {
  private readonly compositeSpec: Specification<Estate>;

  constructor() {
    super();

    // Compose all requirements
    this.compositeSpec = new IsSolventSpecification()
      .and(new HasNoCriticalDebtsSpecification())
      .and(new HasVerifiedAssetsSpecification())
      .and(new IsNotFrozenSpecification())
      .and(new HasNoDisputedAssetsSpecification())
      .and(new HasNoDisputedDebtsSpecification()) as Specification<Estate>;
  }

  public isSatisfiedBy(estate: Estate): boolean {
    return this.compositeSpec.isSatisfiedBy(estate);
  }

  /**
   * Get detailed reasons why estate is not ready
   *
   * Useful for user feedback
   */
  public getBlockingReasons(estate: Estate): string[] {
    const reasons: string[] = [];

    if (!new IsSolventSpecification().isSatisfiedBy(estate)) {
      reasons.push(`Estate is insolvent (shortfall: ${estate.getInsolvencyShortfall().format()})`);
    }

    if (!new HasNoCriticalDebtsSpecification().isSatisfiedBy(estate)) {
      const criticalDebts = estate.getCriticalDebts();
      reasons.push(`${criticalDebts.length} critical debt(s) must be settled (S.45 LSA)`);
    }

    if (!new HasVerifiedAssetsSpecification().isSatisfiedBy(estate)) {
      reasons.push('No verified assets available for distribution');
    }

    if (!new IsNotFrozenSpecification().isSatisfiedBy(estate)) {
      reasons.push(`Estate is frozen: ${estate.props.frozenReason || 'Unknown reason'}`);
    }

    if (!new HasNoDisputedAssetsSpecification().isSatisfiedBy(estate)) {
      const disputed = Array.from(estate.assets.values()).filter((a) =>
        a.verificationStatus.isDisputed(),
      );
      reasons.push(`${disputed.length} asset(s) disputed - requires court resolution`);
    }

    if (!new HasNoDisputedDebtsSpecification().isSatisfiedBy(estate)) {
      const disputed = Array.from(estate.debts.values()).filter((d) => d.status === 'DISPUTED');
      reasons.push(`${disputed.length} debt(s) disputed - requires court resolution`);
    }

    return reasons;
  }
}

// =============================================================================
// DEPENDANT SPECIFICATIONS (S.26/29 LSA)
// =============================================================================

/**
 * Has Verified Dependant Claims Specification
 *
 * Business Rule:
 * - Estate has at least one verified dependant claim
 * - Affects distribution calculation (S.26 LSA)
 */
export class HasVerifiedDependantClaimsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.getVerifiedDependants().length > 0;
  }
}

/**
 * Dependant Provisions Exceed Estate Specification
 *
 * Business Rule:
 * - Dependant provisions exceed estate value
 * - Court intervention required (S.26 LSA)
 *
 * Risk: Estate cannot provide for all dependants
 */
export class DependantProvisionsExceedEstateSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    const dependants = estate.getVerifiedDependants();
    const totalProvisions = Money.sum(dependants.map((d) => d.calculateAnnualProvision()));

    return totalProvisions.greaterThan(estate.netEstateValueKES);
  }
}

// =============================================================================
// HOTCHPOT SPECIFICATIONS (S.35(3) LSA)
// =============================================================================

/**
 * Has Hotchpot Gifts Specification
 *
 * Business Rule:
 * - Estate has gifts subject to hotchpot
 * - Affects distribution calculation (S.35(3) LSA)
 */
export class HasHotchpotGiftsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    return estate.getHotchpotGifts().length > 0;
  }
}

/**
 * Has Unverified Gifts Specification
 *
 * Business Rule:
 * - Estate has unverified gifts
 * - May require verification before distribution
 */
export class HasUnverifiedGiftsSpecification extends Specification<Estate> {
  public isSatisfiedBy(estate: Estate): boolean {
    const gifts = Array.from(estate.giftsInterVivos.values());
    return gifts.some((gift) => !gift.isVerified);
  }
}

// =============================================================================
// TIME-BASED SPECIFICATIONS
// =============================================================================

/**
 * Probate Time Limit Exceeded Specification
 *
 * Business Rule:
 * - Probate should be filed within 6 months of death
 * - Kenyan practice (not strict law)
 *
 * Warning: Late filing may attract questions
 */
export class ProbateTimeLimitExceededSpecification extends Specification<Estate> {
  private readonly timeLimitMonths: number = 6;

  public isSatisfiedBy(estate: Estate): boolean {
    if (!estate.deceasedDateOfDeath) {
      return false;
    }

    const monthsSinceDeath = this.calculateMonthsSince(estate.deceasedDateOfDeath);
    return monthsSinceDeath > this.timeLimitMonths;
  }

  private calculateMonthsSince(date: Date): number {
    const now = new Date();
    const months =
      (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    return months;
  }
}

// =============================================================================
// VALUE-BASED SPECIFICATIONS
// =============================================================================

/**
 * High Value Estate Specification
 *
 * Business Rule:
 * - Estate value exceeds threshold
 * - May require additional court supervision
 *
 * Typical threshold: 10M KES+
 */
export class HighValueEstateSpecification extends Specification<Estate> {
  constructor(private readonly threshold: Money = Money.fromKES(10_000_000)) {
    super();
  }

  public isSatisfiedBy(estate: Estate): boolean {
    return estate.grossValueKES.greaterThanOrEqual(this.threshold);
  }
}

/**
 * Small Estate Specification
 *
 * Business Rule:
 * - Estate value below threshold
 * - May qualify for summary administration
 *
 * Typical threshold: 100k KES
 */
export class SmallEstateSpecification extends Specification<Estate> {
  constructor(private readonly threshold: Money = Money.fromKES(100_000)) {
    super();
  }

  public isSatisfiedBy(estate: Estate): boolean {
    return estate.netEstateValueKES.lessThanOrEqual(this.threshold);
  }
}
