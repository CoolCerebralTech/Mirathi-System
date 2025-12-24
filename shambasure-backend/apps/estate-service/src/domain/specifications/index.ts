// domain/specifications/index.ts

/**
 * Estate Service - Specifications
 *
 * Specification Pattern (DDD):
 * - Encapsulate business rules as objects
 * - Reusable across domain, queries, validation
 * - Composable (AND, OR, NOT operations)
 * - Testable in isolation
 *
 * Benefits:
 * - Business logic in domain layer (not scattered)
 * - Easy to test (single responsibility)
 * - Readable code (named specifications)
 * - Type-safe query building
 *
 * Kenyan Legal Context:
 * - Specifications encode LSA Cap 160 requirements
 * - S.45 debt priority rules
 * - S.26/29 dependant provisions
 * - Distribution readiness checks
 */

// ============================================================================
// BASE SPECIFICATION PATTERN
// ============================================================================

export {
  ISpecification,
  Specification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
  TrueSpecification,
  FalseSpecification,
  SpecificationBuilder,
} from './base/specification';

// ============================================================================
// ESTATE SPECIFICATIONS
// ============================================================================

export {
  // Solvency
  IsSolventSpecification,
  HasSufficientLiquiditySpecification,
  CanCoverCriticalDebtsSpecification,

  // Debts
  HasNoCriticalDebtsSpecification,
  HasNoDisputedDebtsSpecification,

  // Assets
  AllAssetsVerifiedSpecification,
  HasVerifiedAssetsSpecification,
  HasNoDisputedAssetsSpecification,
  HasMinimumEstateValueSpecification,

  // Status
  IsNotFrozenSpecification,
  IsTestateSpecification,
  IsIntestateSpecification,

  // Distribution Readiness
  IsReadyForDistributionSpecification,

  // Dependants
  HasVerifiedDependantClaimsSpecification,
  DependantProvisionsExceedEstateSpecification,

  // Hotchpot
  HasHotchpotGiftsSpecification,
  HasUnverifiedGiftsSpecification,

  // Time-based
  ProbateTimeLimitExceededSpecification,

  // Value-based
  HighValueEstateSpecification,
  SmallEstateSpecification,
} from './estate/estate.specifications';

// ============================================================================
// ASSET SPECIFICATIONS
// ============================================================================

export {
  IsAssetVerifiedSpecification,
  IsAssetReadyForDistributionSpecification,
  IsAssetEncumberedSpecification,
  IsAssetCoOwnedSpecification,
  AssetBypassesEstateSpecification,
  IsLiquidAssetSpecification,
  RequiresRegistryTransferSpecification,
  RequiresProfessionalValuationSpecification,
  IsHighValueAssetSpecification,
  AssetTypeIsSpecification,
  IsDisputedAssetSpecification,
  AssetHasSecuredDebtSpecification,
  AssetValueExceedsDebtSpecification,
} from './asset-debt/asset-debt.specifications';

// ============================================================================
// DEBT SPECIFICATIONS
// ============================================================================

export {
  IsCriticalDebtSpecification,
  IsSecuredDebtSpecification,
  IsDebtSettledSpecification,
  IsDebtOutstandingSpecification,
  IsDebtOverdueSpecification,
  IsDisputedDebtSpecification,
  IsStatuteBarredDebtSpecification,
  DebtBlocksDistributionSpecification,
  CanForceLiquidationSpecification,
  DebtTierIsSpecification,
  IsHighPriorityDebtSpecification,
  RequiresImmediateAttentionSpecification,
} from './asset-debt/asset-debt.specifications';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// =============================================================================
// EXAMPLE 1: Estate Distribution Readiness Check
// =============================================================================

const readinessSpec = new IsReadyForDistributionSpecification();

if (readinessSpec.isSatisfiedBy(estate)) {
  console.log('✅ Estate is ready for distribution');
  // Proceed with distribution calculation
} else {
  const reasons = readinessSpec.getBlockingReasons(estate);
  console.log('❌ Estate not ready:', reasons);
  // Display blockers to executor
}

// Output:
// ❌ Estate not ready: [
//   'Estate is insolvent (shortfall: KES 500,000.00)',
//   '2 critical debt(s) must be settled (S.45 LSA)',
//   'Estate is frozen: Court order - beneficiary dispute'
// ]


// =============================================================================
// EXAMPLE 2: Compose Multiple Specifications (AND)
// =============================================================================

const distributionSpec = new IsSolventSpecification()
  .and(new HasNoCriticalDebtsSpecification())
  .and(new IsNotFrozenSpecification())
  .and(new HasVerifiedAssetsSpecification());

const estates = await estateRepository.findAll();
const readyEstates = estates.filter(estate => distributionSpec.isSatisfiedBy(estate));

console.log(`${readyEstates.length} estates ready for distribution`);


// =============================================================================
// EXAMPLE 3: Fluent Specification Builder
// =============================================================================

const complexSpec = SpecificationBuilder
  .where(new IsSolventSpecification())
  .and(new HasNoCriticalDebtsSpecification())
  .and(
    new IsTestateSpecification()
      .or(new IsIntestateSpecification())
  )
  .and(new IsNotFrozenSpecification().not()) // NOT frozen (actually frozen)
  .build();

// This checks:
// - Solvent AND
// - No critical debts AND
// - (Testate OR Intestate) AND
// - NOT (Not frozen) = Frozen


// =============================================================================
// EXAMPLE 4: Filter Assets by Specification
// =============================================================================

const assets = Array.from(estate.assets.values());

// Get liquid assets
const liquidAssets = assets.filter(
  asset => new IsLiquidAssetSpecification().isSatisfiedBy(asset)
);

// Get verified, distributable assets
const distributableAssets = assets.filter(
  asset => new IsAssetReadyForDistributionSpecification().isSatisfiedBy(asset)
);

// Get high-value land assets
const highValueLandSpec = new AssetTypeIsSpecification(AssetType.landParcel())
  .and(new IsHighValueAssetSpecification(Money.fromKES(5_000_000)));

const highValueLand = assets.filter(asset => highValueLandSpec.isSatisfiedBy(asset));


// =============================================================================
// EXAMPLE 5: Filter Debts by S.45 Priority
// =============================================================================

const debts = Array.from(estate.debts.values());

// Get critical debts (S.45(a)-(c))
const criticalDebts = debts.filter(
  debt => new IsCriticalDebtSpecification().isSatisfiedBy(debt)
);

// Get outstanding secured debts
const outstandingSecuredSpec = new IsSecuredDebtSpecification()
  .and(new IsDebtOutstandingSpecification());

const outstandingSecured = debts.filter(debt => outstandingSecuredSpec.isSatisfiedBy(debt));

// Get urgent debts (overdue + critical + not disputed)
const urgentDebts = debts.filter(
  debt => new RequiresImmediateAttentionSpecification().isSatisfiedBy(debt)
);


// =============================================================================
// EXAMPLE 6: Validation with Specifications
// =============================================================================

class EstateValidator {
  validate(estate: Estate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check solvency
    if (!new IsSolventSpecification().isSatisfiedBy(estate)) {
      errors.push('Estate is insolvent - cannot distribute');
    }

    // Check critical debts
    if (!new HasNoCriticalDebtsSpecification().isSatisfiedBy(estate)) {
      errors.push('Critical debts must be settled before distribution');
    }

    // Check probate time limit (warning only)
    if (new ProbateTimeLimitExceededSpecification().isSatisfiedBy(estate)) {
      warnings.push('Probate filing deadline exceeded (6 months since death)');
    }

    // Check dependant provisions
    if (new DependantProvisionsExceedEstateSpecification().isSatisfiedBy(estate)) {
      warnings.push('Dependant provisions exceed estate value - court intervention may be needed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}


// =============================================================================
// EXAMPLE 7: Repository Query with Specifications
// =============================================================================

// In repository implementation
class PrismaEstateRepository implements IEstateRepository {
  async findReadyForDistribution(): Promise<Estate[]> {
    // Load all estates (or use database-level filtering)
    const estates = await this.findAll();
    
    // Filter in-memory using specification
    const spec = new IsReadyForDistributionSpecification();
    return estates.filter(estate => spec.isSatisfiedBy(estate));
  }
  
  async findInsolventEstates(): Promise<Estate[]> {
    const estates = await this.findAll();
    const spec = new IsSolventSpecification().not();
    return estates.filter(estate => spec.isSatisfiedBy(estate));
  }
}


// =============================================================================
// EXAMPLE 8: Command Handler with Specification Validation
// =============================================================================

@CommandHandler(CalculateDistributionCommand)
export class CalculateDistributionHandler {
  async execute(command: CalculateDistributionCommand): Promise<DistributionResult> {
    const estate = await this.estateRepository.findById(command.estateId);
    
    // Validate using specifications
    const readinessSpec = new IsReadyForDistributionSpecification();
    
    if (!readinessSpec.isSatisfiedBy(estate)) {
      const reasons = readinessSpec.getBlockingReasons(estate);
      throw new EstateNotReadyError(
        `Estate not ready for distribution: ${reasons.join(', ')}`
      );
    }
    
    // Proceed with distribution calculation
    return this.distributionCalculator.calculate(estate, familyStructure);
  }
}


// =============================================================================
// EXAMPLE 9: Domain Event Handler with Specifications
// =============================================================================

@EventsHandler(DebtSettledEvent)
export class DebtSettledEventHandler {
  async handle(event: DebtSettledEvent): Promise<void> {
    const estate = await this.estateRepository.findById(event.aggregateId);
    
    // Check if all critical debts are now settled
    const noCriticalDebtsSpec = new HasNoCriticalDebtsSpecification();
    
    if (noCriticalDebtsSpec.isSatisfiedBy(estate)) {
      // All critical debts settled - check if ready for distribution
      const readinessSpec = new IsReadyForDistributionSpecification();
      
      if (readinessSpec.isSatisfiedBy(estate)) {
        // Emit event: Estate ready for distribution
        await this.eventBus.publish(
          new EstateReadyForDistributionEvent(estate.id.toString())
        );
        
        // Notify executor
        await this.notificationService.notifyEstateReady(estate.id.toString());
      }
    }
  }
}


// =============================================================================
// EXAMPLE 10: Testing Specifications
// =============================================================================

describe('IsSolventSpecification', () => {
  it('should return true for solvent estate', () => {
    // Arrange
    const estate = createMockEstate({
      grossValue: Money.fromKES(5_000_000),
      liabilities: Money.fromKES(2_000_000),
    });
    
    const spec = new IsSolventSpecification();
    
    // Act & Assert
    expect(spec.isSatisfiedBy(estate)).toBe(true);
  });
  
  it('should return false for insolvent estate', () => {
    // Arrange
    const estate = createMockEstate({
      grossValue: Money.fromKES(1_000_000),
      liabilities: Money.fromKES(2_000_000),
    });
    
    const spec = new IsSolventSpecification();
    
    // Act & Assert
    expect(spec.isSatisfiedBy(estate)).toBe(false);
  });
});

describe('Specification Composition', () => {
  it('should compose specifications with AND', () => {
    const estate = createMockEstate({ isSolvent: true, isFrozen: false });
    
    const spec = new IsSolventSpecification()
      .and(new IsNotFrozenSpecification());
    
    expect(spec.isSatisfiedBy(estate)).toBe(true);
  });
  
  it('should compose specifications with OR', () => {
    const estate = createMockEstate({ isTestate: true, isIntestate: false });
    
    const spec = new IsTestateSpecification()
      .or(new IsIntestateSpecification());
    
    expect(spec.isSatisfiedBy(estate)).toBe(true);
  });
});


// =============================================================================
// EXAMPLE 11: Business Rule Documentation
// =============================================================================

// Specifications serve as executable documentation

class EstateBusinessRules {
  // "An estate can be distributed if it is solvent, has no critical debts,
  //  all assets are verified, and it is not frozen"
  static canDistribute(): ISpecification<Estate> {
    return new IsSolventSpecification()
      .and(new HasNoCriticalDebtsSpecification())
      .and(new AllAssetsVerifiedSpecification())
      .and(new IsNotFrozenSpecification());
  }
  
  // "A debt requires immediate attention if it is overdue, critical,
  //  not statute-barred, and not disputed"
  static requiresImmediateAttention(): ISpecification<Debt> {
    return new IsDebtOverdueSpecification()
      .and(new IsCriticalDebtSpecification())
      .and(new IsStatuteBarredDebtSpecification().not())
      .and(new IsDisputedDebtSpecification().not());
  }
}
*/
