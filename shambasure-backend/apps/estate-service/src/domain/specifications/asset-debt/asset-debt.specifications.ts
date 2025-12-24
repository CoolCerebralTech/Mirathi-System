// domain/specifications/asset-debt/asset-debt.specifications.ts
import { Asset } from '../../entities/asset.entity';
import { Debt, DebtStatus } from '../../entities/debt.entity';
import { AssetType, DebtTier, Money } from '../../value-objects';
import { Specification } from '../base/specification';

// =============================================================================
// ASSET SPECIFICATIONS
// =============================================================================

/**
 * Is Asset Verified Specification
 *
 * Business Rule:
 * - Asset must be verified before distribution
 * - Verification confirms ownership and value
 */
export class IsAssetVerifiedSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.verificationStatus.isVerified();
  }
}

/**
 * Is Asset Ready For Distribution Specification
 *
 * Business Rule (Composite):
 * - Asset is active
 * - Asset is verified
 * - Asset is not deleted
 * - Asset ownership type allows distribution
 */
export class IsAssetReadyForDistributionSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.isReadyForDistribution();
  }
}

/**
 * Is Asset Encumbered Specification
 *
 * Business Rule:
 * - Asset has mortgages/liens
 * - Net value reduced by encumbrance
 * - May require special handling
 */
export class IsAssetEncumberedSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.isEncumbered;
  }
}

/**
 * Is Asset Co-Owned Specification
 *
 * Business Rule:
 * - Asset has multiple owners
 * - Only deceased's share is distributable
 * - Requires co-owner consent
 */
export class IsAssetCoOwnedSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.coOwners.length > 0;
  }
}

/**
 * Asset Bypasses Estate Specification
 *
 * Business Rule:
 * - Joint tenancy with right of survivorship
 * - Asset doesn't enter estate (goes to survivor)
 * - Not distributable
 */
export class AssetBypassesEstateSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.ownershipType.bypassesEstate();
  }
}

/**
 * Is Liquid Asset Specification
 *
 * Business Rule:
 * - Asset is easily converted to cash
 * - Bank accounts, stocks, bonds
 * - Can pay debts quickly
 */
export class IsLiquidAssetSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.type.isLiquid();
  }
}

/**
 * Requires Registry Transfer Specification
 *
 * Business Rule:
 * - Asset requires government registry update
 * - Land, vehicles, business interests
 * - Additional legal steps needed
 */
export class RequiresRegistryTransferSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.type.requiresRegistryTransfer();
  }
}

/**
 * Requires Professional Valuation Specification
 *
 * Business Rule:
 * - Asset requires professional valuer
 * - Land, property, business interests
 * - High-value or complex assets
 */
export class RequiresProfessionalValuationSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.type.requiresProfessionalValuation();
  }
}

/**
 * Is High Value Asset Specification
 *
 * Business Rule:
 * - Asset value exceeds threshold
 * - May require additional verification
 * - Higher scrutiny in distribution
 */
export class IsHighValueAssetSpecification extends Specification<Asset> {
  constructor(private readonly threshold: Money = Money.fromKES(1_000_000)) {
    super();
  }

  public isSatisfiedBy(asset: Asset): boolean {
    return asset.currentValue.greaterThanOrEqual(this.threshold);
  }
}

/**
 * Asset Type Is Specification
 *
 * Parameterized specification for asset type
 *
 * Usage:
 * const landAssets = assets.filter(new AssetTypeIsSpecification(AssetType.landParcel()));
 */
export class AssetTypeIsSpecification extends Specification<Asset> {
  constructor(private readonly assetType: AssetType) {
    super();
  }

  public isSatisfiedBy(asset: Asset): boolean {
    return asset.type.equals(this.assetType);
  }
}

/**
 * Is Disputed Asset Specification
 *
 * Business Rule:
 * - Asset is under dispute
 * - Requires court resolution
 * - Blocks distribution
 */
export class IsDisputedAssetSpecification extends Specification<Asset> {
  public isSatisfiedBy(asset: Asset): boolean {
    return asset.verificationStatus.isDisputed();
  }
}

// =============================================================================
// DEBT SPECIFICATIONS (S.45 LSA)
// =============================================================================

/**
 * Is Critical Debt Specification
 *
 * Business Rule:
 * - Debt is S.45(a)-(c) priority
 * - Must be paid before distribution
 * - Blocks distribution if outstanding
 *
 * Legal Basis: S.45 LSA priority tiers
 */
export class IsCriticalDebtSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.priority.isCritical();
  }
}

/**
 * Is Secured Debt Specification
 *
 * Business Rule:
 * - Debt has collateral
 * - Can force asset liquidation
 * - S.45(b) priority
 */
export class IsSecuredDebtSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.isSecured;
  }
}

/**
 * Is Debt Settled Specification
 *
 * Business Rule:
 * - Debt is fully paid
 * - No outstanding balance
 */
export class IsDebtSettledSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.isSettled();
  }
}

/**
 * Is Debt Outstanding Specification
 *
 * Business Rule:
 * - Debt has outstanding balance
 * - Not settled, written off, or statute-barred
 */
export class IsDebtOutstandingSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return (
      debt.status !== DebtStatus.SETTLED &&
      debt.status !== DebtStatus.WRITTEN_OFF &&
      !debt.isStatuteBarred
    );
  }
}

/**
 * Is Debt Overdue Specification
 *
 * Business Rule:
 * - Debt is past due date
 * - May accrue penalties/interest
 * - Urgent action required
 */
export class IsDebtOverdueSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.isOverdue();
  }
}

/**
 * Is Disputed Debt Specification
 *
 * Business Rule:
 * - Debt validity/amount disputed
 * - Requires court resolution
 * - Excluded from calculations
 */
export class IsDisputedDebtSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.status === DebtStatus.DISPUTED;
  }
}

/**
 * Is Statute Barred Debt Specification
 *
 * Business Rule:
 * - Debt is time-barred (>6 years typically)
 * - Cannot be legally enforced
 * - Excluded from estate liabilities
 *
 * Legal Basis: Limitation Act
 */
export class IsStatuteBarredDebtSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.isStatuteBarred;
  }
}

/**
 * Debt Blocks Distribution Specification
 *
 * Business Rule:
 * - Debt prevents estate distribution
 * - Critical debt that's outstanding
 * - Must be paid first (S.45 priority)
 */
export class DebtBlocksDistributionSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.blocksDistribution();
  }
}

/**
 * Can Force Liquidation Specification
 *
 * Business Rule:
 * - Secured debt can force asset sale
 * - Creditor has collateral rights
 * - High urgency
 */
export class CanForceLiquidationSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return debt.canForceLiquidation();
  }
}

/**
 * Debt Tier Is Specification
 *
 * Parameterized specification for debt tier
 *
 * Usage:
 * const funeralDebts = debts.filter(new DebtTierIsSpecification(DebtTier.FUNERAL_EXPENSES));
 */
export class DebtTierIsSpecification extends Specification<Debt> {
  constructor(private readonly tier: DebtTier) {
    super();
  }

  public isSatisfiedBy(debt: Debt): boolean {
    return debt.tier === this.tier;
  }
}

/**
 * Is High Priority Debt Specification
 *
 * Business Rule:
 * - Debt is in S.45(a) or S.45(b) tier
 * - Funeral, testamentary, or secured debts
 * - Must be paid early in process
 */
export class IsHighPriorityDebtSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return (
      debt.tier === DebtTier.FUNERAL_EXPENSES ||
      debt.tier === DebtTier.TESTAMENTARY_EXPENSES ||
      debt.tier === DebtTier.SECURED_DEBTS
    );
  }
}

/**
 * Requires Immediate Attention Specification
 *
 * Business Rule (Composite):
 * - Debt is overdue AND
 * - Debt is critical tier AND
 * - Debt is not statute-barred
 *
 * High urgency for payment
 */
export class RequiresImmediateAttentionSpecification extends Specification<Debt> {
  public isSatisfiedBy(debt: Debt): boolean {
    return (
      debt.isOverdue() &&
      debt.priority.isCritical() &&
      !debt.isStatuteBarred &&
      debt.status !== DebtStatus.DISPUTED
    );
  }
}

// =============================================================================
// COMBINED SPECIFICATIONS (Asset + Debt)
// =============================================================================

/**
 * Asset Has Secured Debt Specification
 *
 * Business Rule:
 * - Check if asset has secured debt against it
 * - Requires coordination between Asset and Debt
 *
 * Usage:
 * const spec = new AssetHasSecuredDebtSpecification(debts);
 * const encumberedAssets = assets.filter(spec);
 */
export class AssetHasSecuredDebtSpecification extends Specification<Asset> {
  constructor(private readonly debts: Debt[]) {
    super();
  }

  public isSatisfiedBy(asset: Asset): boolean {
    return this.debts.some(
      (debt) =>
        debt.isSecured &&
        debt.securedAssetId?.equals(asset.id) &&
        debt.status !== DebtStatus.SETTLED,
    );
  }
}

/**
 * Asset Value Exceeds Debt Specification
 *
 * Business Rule:
 * - Asset value must exceed its secured debts
 * - Positive net value after debt
 * - Otherwise, may not be worth distributing
 */
export class AssetValueExceedsDebtSpecification extends Specification<Asset> {
  constructor(private readonly debts: Debt[]) {
    super();
  }

  public isSatisfiedBy(asset: Asset): boolean {
    const securedDebts = this.debts.filter(
      (debt) =>
        debt.isSecured &&
        debt.securedAssetId?.equals(asset.id) &&
        debt.status !== DebtStatus.SETTLED,
    );

    if (securedDebts.length === 0) {
      return true; // No secured debts
    }

    const totalDebt = Money.sum(securedDebts.map((d) => d.outstandingBalance));
    return asset.currentValue.greaterThan(totalDebt);
  }
}
