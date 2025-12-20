import { AggregateRoot, UniqueEntityId } from '../../../core/domain';
import { ValidationError } from '../../../core/exceptions';
import { DateRangeVO, KenyanIdVO, KenyanLocationVO, MoneyVO, PercentageVO } from '../../shared';
import {
  DependencyProvisionCalculatedEvent,
  DistributionScenarioAddedEvent,
  HotchpotAppliedEvent,
  InheritanceCalculationCreatedEvent,
  InheritanceRecalculationTriggeredEvent,
  PolygamousDistributionCalculatedEvent,
  ShareAdjustedEvent,
} from '../events';
import {
  DependencyEntitlementVO,
  HotchpotAdjustmentVO,
  Section35CalculationVO,
  Section40CalculationVO,
} from '../value-objects';
import { ComputedShare } from './entities/computed-share.entity';
import { DistributionScenario } from './entities/distribution-scenario.entity';

export type EstateContext = {
  estateId: string;
  deceasedId: KenyanIdVO;
  deceasedFullName: string;
  deceasedDateOfDeath: Date;
  totalGrossEstate: MoneyVO;
  totalNetEstate: MoneyVO;
  totalLiabilities: MoneyVO;
  isTestate: boolean;
  willExists: boolean;
  willId?: string;
};

export type LegalContext = {
  applicableLaw: 'LSA_2009' | 'CUSTOMARY_LAW' | 'ISLAMIC_LAW' | 'MIXED';
  customaryLawType?: string;
  customaryElderCouncil?: string[];
  courtOrders: Array<{
    orderNumber: string;
    orderDate: Date;
    description: string;
    impact: 'REDISTRIBUTION' | 'PROVISION' | 'RESTRICTION';
  }>;
  pendingLitigation: boolean;
  litigationDetails?: string;
};

export type FamilyContext = {
  survivingSpouse: {
    exists: boolean;
    spouseId?: KenyanIdVO;
    fullName?: string;
    age?: number;
    isRemarried: boolean;
    healthStatus?: string;
  };
  children: Array<{
    childId: KenyanIdVO;
    fullName: string;
    age: number;
    isMinor: boolean;
    hasDisability: boolean;
    requiresGuardian: boolean;
  }>;
  polygamousStructure: {
    isPolygamous: boolean;
    houses: Array<{
      houseId: string;
      houseName: string;
      houseOrder: number;
      spouseId?: KenyanIdVO;
      childrenCount: number;
      isRecognized: boolean;
    }>;
  };
  dependants: Array<{
    dependantId: KenyanIdVO;
    fullName: string;
    relationship: string;
    dependencyLevel: 'FULL' | 'PARTIAL';
    monthlySupport: MoneyVO;
    evidenceDocumented: boolean;
  }>;
};

export type HotchpotContext = {
  giftsInterVivos: Array<{
    giftId: string;
    recipientId: KenyanIdVO;
    recipientName: string;
    value: MoneyVO;
    giftDate: Date;
    isSubjectToHotchpot: boolean;
    exemptionReason?: string;
  }>;
  inflationRate: PercentageVO;
  customaryExemptions: string[];
};

export interface InheritanceCalculationProps {
  // Core identity
  estateContext: EstateContext;
  legalContext: LegalContext;
  familyContext: FamilyContext;
  hotchpotContext: HotchpotContext;

  // Scenarios management
  scenarios: Map<string, DistributionScenario>;
  activeScenarioId?: string;
  defaultScenarioId?: string;

  // Calculation state
  calculationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ERROR' | 'NEEDS_REVIEW';
  calculationErrors?: Array<{ code: string; message: string; severity: 'WARNING' | 'ERROR' }>;

  // Results summary
  summary?: {
    totalScenarios: number;
    mostEquitableScenarioId?: string;
    mostTaxEfficientScenarioId?: string;
    fastestDistributionScenarioId?: string;
    recommendedScenarioId?: string;
    scenariosComparison: Record<
      string,
      {
        fairnessScore: number;
        taxEfficiency: number;
        legalCompliance: number;
        implementationComplexity: number;
      }
    >;
  };

  // Audit trail
  calculationHistory: Array<{
    timestamp: Date;
    action: string;
    scenarioId?: string;
    details: string;
    performedBy?: string;
  }>;

  // Versioning
  version: number;
  lastRecalculationTrigger?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastCalculatedAt?: Date;
}

export class InheritanceCalculation extends AggregateRoot<InheritanceCalculationProps> {
  private constructor(props: InheritanceCalculationProps, id?: UniqueEntityId) {
    super(props, id);
    this.validate();
  }

  static create(
    estateContext: EstateContext,
    legalContext: LegalContext,
    familyContext: FamilyContext,
    hotchpotContext: HotchpotContext,
    id?: UniqueEntityId,
  ): InheritanceCalculation {
    const now = new Date();
    const props: InheritanceCalculationProps = {
      estateContext,
      legalContext,
      familyContext,
      hotchpotContext,
      scenarios: new Map(),
      calculationStatus: 'PENDING',
      calculationHistory: [
        {
          timestamp: now,
          action: 'AGGREGATE_CREATED',
          details: 'Inheritance calculation aggregate initialized',
          performedBy: 'SYSTEM',
        },
      ],
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const aggregate = new InheritanceCalculation(props, id);
    aggregate.addDomainEvent(new InheritanceCalculationCreatedEvent(aggregate.toJSON()));
    return aggregate;
  }

  private validate(): void {
    // Validate estate context
    if (this.props.estateContext.totalGrossEstate.amount <= 0) {
      throw new ValidationError('Gross estate value must be positive');
    }

    if (
      this.props.estateContext.totalNetEstate.amount >
      this.props.estateContext.totalGrossEstate.amount
    ) {
      throw new ValidationError('Net estate value cannot exceed gross value');
    }

    // Validate family context
    if (
      !this.props.familyContext.survivingSpouse.exists &&
      this.props.familyContext.children.length === 0
    ) {
      if (this.props.estateContext.isTestate === false) {
        throw new ValidationError(
          'Intestate estate must have either spouse or children for S.35/S.36 calculations',
        );
      }
    }

    // Validate polygamous context
    if (this.props.familyContext.polygamousStructure.isPolygamous) {
      if (this.props.familyContext.polygamousStructure.houses.length < 2) {
        throw new ValidationError('Polygamous structure must have at least 2 houses');
      }

      const recognizedHouses = this.props.familyContext.polygamousStructure.houses.filter(
        (h) => h.isRecognized,
      );
      if (recognizedHouses.length === 0) {
        throw new ValidationError('At least one house must be recognized under Kenyan law');
      }
    }

    // Validate hotchpot context
    const totalGifts = this.props.hotchpotContext.giftsInterVivos.reduce(
      (sum, gift) => sum + gift.value.amount,
      0,
    );
    if (totalGifts > this.props.estateContext.totalGrossEstate.amount) {
      throw new ValidationError('Total gifts cannot exceed estate value');
    }
  }

  // Domain Methods

  createDistributionScenario(
    name: string,
    scenarioType: DistributionScenario['props']['scenarioType'],
    createdByUserId: string,
    createdByFullName: string,
    parameters: Omit<DistributionScenario['props']['parameters'], 'valuationDate'> & {
      valuationDate?: Date;
    },
  ): DistributionScenario {
    if (this.props.calculationStatus === 'IN_PROGRESS') {
      throw new ValidationError('Cannot create scenario while calculation is in progress');
    }

    const scenario = DistributionScenario.create(
      name,
      scenarioType,
      createdByUserId,
      createdByFullName,
      parameters,
    );

    this.props.scenarios.set(scenario.id.toString(), scenario);
    this.props.calculationStatus = 'NEEDS_REVIEW';
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new DistributionScenarioAddedEvent(
        this.id.toString(),
        scenario.id.toString(),
        scenario.toJSON(),
      ),
    );

    this.recordHistory('SCENARIO_CREATED', `Created scenario "${name}" of type ${scenarioType}`);
    return scenario;
  }

  calculateIntestateScenario(scenarioId: string): void {
    const scenario = this.props.scenarios.get(scenarioId);
    if (!scenario) {
      throw new ValidationError(`Scenario ${scenarioId} not found`);
    }

    this.props.calculationStatus = 'IN_PROGRESS';

    try {
      // Determine calculation method based on scenario type
      if (scenario.props.scenarioType === 'INTESTATE_S35_MONOGAMOUS') {
        this.calculateS35Scenario(scenario);
      } else if (scenario.props.scenarioType === 'INTESTATE_S40_POLYGAMOUS') {
        this.calculateS40Scenario(scenario);
      } else {
        throw new ValidationError(`Unsupported scenario type: ${scenario.props.scenarioType}`);
      }

      this.props.calculationStatus = 'COMPLETED';
      this.props.lastCalculatedAt = new Date();

      this.recordHistory(
        'SCENARIO_CALCULATED',
        `Calculated intestate distribution for scenario ${scenarioId}`,
      );
    } catch (error) {
      this.props.calculationStatus = 'ERROR';
      this.props.calculationErrors = [
        ...(this.props.calculationErrors || []),
        {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'ERROR',
        },
      ];
      throw error;
    }
  }

  private calculateS35Scenario(scenario: DistributionScenario): void {
    const { survivingSpouse, children } = this.props.familyContext;

    if (!survivingSpouse.exists && children.length === 0) {
      throw new ValidationError('S.35 requires either surviving spouse or children');
    }

    // Calculate spouse share
    const spouseShare = this.calculateSpouseShare();

    // Calculate children shares
    const childrenShares = this.calculateChildrenShares();

    // Apply hotchpot if enabled
    const hotchpotAdjustedShares = this.applyHotchpotToShares([spouseShare, ...childrenShares]);

    // Apply dependant provisions
    const finalShares = this.applyDependantProvisions(hotchpotAdjustedShares);

    // Create computed shares
    const computedShares = finalShares.map((share) =>
      ComputedShare.create({
        scenarioId: scenario.id,
        beneficiaryId: share.beneficiaryId,
        beneficiaryName: share.beneficiaryName,
        beneficiaryRelationship: share.relationship,
        grossEntitlementPercent: PercentageVO.create(share.grossPercentage),
        finalSharePercent: PercentageVO.create(share.finalPercentage),
        finalShareValue: share.value,
        shareType: share.shareType,
        lifeInterest: share.lifeInterest,
        conditions: share.conditions,
        breakdown: share.breakdown,
        isMinor: share.isMinor,
        requiresGuardian: share.requiresGuardian,
        distributionStatus: 'PENDING',
        metadata: {
          legalBasis: 'S.35 LSA',
          calculationVersion: 1,
          lastRecalculatedAt: new Date(),
          assumptionsUsed: {
            marriageValid: true,
            childrenLegitimate: true,
            hotchpotApplied: scenario.props.parameters.includeHotchpot,
          },
          auditTrail: [],
        },
      }),
    );

    // Add shares to scenario
    computedShares.forEach((share) => scenario.addComputedShare(share));

    // Calculate scenario results
    scenario.calculateResults(computedShares);

    this.addDomainEvent(
      new DistributionScenarioAddedEvent(
        this.id.toString(),
        scenario.id.toString(),
        scenario.toJSON(),
      ),
    );
  }

  private calculateS40Scenario(scenario: DistributionScenario): void {
    const { polygamousStructure } = this.props.familyContext;

    if (!polygamousStructure.isPolygamous) {
      throw new ValidationError('S.40 scenario requires polygamous family structure');
    }

    // Calculate per-house share
    const recognizedHouses = polygamousStructure.houses.filter((h) => h.isRecognized);
    const perHouseShare = this.props.estateContext.totalNetEstate.amount / recognizedHouses.length;

    const houseShares = recognizedHouses.map((house) => {
      // Calculate distribution within each house (similar to S.35)
      return this.calculateHouseDistribution(house, perHouseShare);
    });

    // Flatten all shares from all houses
    const allShares = houseShares.flat();

    // Apply hotchpot across all shares
    const hotchpotAdjustedShares = this.applyHotchpotToShares(allShares);

    // Apply dependant provisions
    const finalShares = this.applyDependantProvisions(hotchpotAdjustedShares);

    // Create computed shares
    const computedShares = finalShares.map((share) =>
      ComputedShare.create({
        scenarioId: scenario.id,
        beneficiaryId: share.beneficiaryId,
        beneficiaryName: share.beneficiaryName,
        beneficiaryRelationship: share.relationship,
        grossEntitlementPercent: PercentageVO.create(share.grossPercentage),
        finalSharePercent: PercentageVO.create(share.finalPercentage),
        finalShareValue: share.value,
        shareType: share.shareType,
        lifeInterest: share.lifeInterest,
        conditions: share.conditions,
        polygamousContext: {
          isPolygamousHouseShare: true,
          houseId: share.houseId,
          houseName: share.houseName,
          houseOrder: share.houseOrder,
          isHouseHead: share.isHouseHead,
          houseDissolved: false,
        },
        breakdown: share.breakdown,
        isMinor: share.isMinor,
        requiresGuardian: share.requiresGuardian,
        distributionStatus: 'PENDING',
        metadata: {
          legalBasis: 'S.40 LSA',
          calculationVersion: 1,
          lastRecalculatedAt: new Date(),
          assumptionsUsed: {
            housesRecognized: recognizedHouses.map((h) => h.houseName),
            equalHouseShare: true,
            hotchpotApplied: scenario.props.parameters.includeHotchpot,
          },
          auditTrail: [],
        },
      }),
    );

    // Add shares to scenario
    computedShares.forEach((share) => scenario.addComputedShare(share));

    // Calculate scenario results
    scenario.calculateResults(computedShares);

    this.addDomainEvent(
      new PolygamousDistributionCalculatedEvent(this.id.toString(), scenario.id.toString(), {
        houses: recognizedHouses.map((h) => ({ houseId: h.houseId, houseName: h.houseName })),
        perHouseShare: MoneyVO.create(
          perHouseShare,
          this.props.estateContext.totalNetEstate.currency,
        ),
        totalShares: computedShares.length,
      }),
    );
  }

  private calculateSpouseShare(): any {
    const { survivingSpouse } = this.props.familyContext;

    if (!survivingSpouse.exists) {
      return null;
    }

    // S.35(1): Spouse gets personal/household effects + life interest in residue
    const personalEffects = this.calculatePersonalEffectsValue();
    const residue = this.props.estateContext.totalNetEstate.amount - personalEffects;

    return {
      beneficiaryId: survivingSpouse.spouseId!,
      beneficiaryName: survivingSpouse.fullName!,
      relationship: 'SPOUSE',
      grossPercentage: 100, // Of residue as life interest
      finalPercentage: 100,
      value: MoneyVO.create(
        personalEffects + residue,
        this.props.estateContext.totalNetEstate.currency,
      ),
      shareType: 'LIFE_INTEREST',
      lifeInterest: {
        hasLifeInterest: true,
        interestType: 'LIFE_ESTATE',
        terminatesOn: 'DEATH',
        terminationCondition: 'Life interest terminates on spouse death',
      },
      breakdown: {
        statutoryEntitlement: MoneyVO.create(
          personalEffects + residue,
          this.props.estateContext.totalNetEstate.currency,
        ),
        hotchpotAdjustment: MoneyVO.zero(),
        dependantProvision: MoneyVO.zero(),
        customaryAdjustment: MoneyVO.zero(),
        courtOrderAdjustment: MoneyVO.zero(),
        netShare: MoneyVO.create(
          personalEffects + residue,
          this.props.estateContext.totalNetEstate.currency,
        ),
      },
      isMinor: false,
      requiresGuardian: false,
    };
  }

  private calculateChildrenShares(): any[] {
    const { children } = this.props.familyContext;

    if (children.length === 0) return [];

    // Children share residue equally after spouse life interest
    const residue =
      this.props.estateContext.totalNetEstate.amount - this.calculatePersonalEffectsValue();
    const sharePerChild = residue / children.length;

    return children.map((child) => ({
      beneficiaryId: child.childId,
      beneficiaryName: child.fullName,
      relationship: 'CHILD',
      grossPercentage: 100 / children.length,
      finalPercentage: 100 / children.length,
      value: MoneyVO.create(sharePerChild, this.props.estateContext.totalNetEstate.currency),
      shareType: 'ABSOLUTE',
      breakdown: {
        statutoryEntitlement: MoneyVO.create(
          sharePerChild,
          this.props.estateContext.totalNetEstate.currency,
        ),
        hotchpotAdjustment: MoneyVO.zero(),
        dependantProvision: MoneyVO.zero(),
        customaryAdjustment: MoneyVO.zero(),
        courtOrderAdjustment: MoneyVO.zero(),
        netShare: MoneyVO.create(sharePerChild, this.props.estateContext.totalNetEstate.currency),
      },
      isMinor: child.isMinor,
      requiresGuardian: child.requiresGuardian,
    }));
  }

  private calculateHouseDistribution(house: any, perHouseShare: number): any[] {
    // Simplified: Within each house, distribute equally among children
    // In reality, this would use S.35 within each house
    const sharePerChild = perHouseShare / house.childrenCount;

    return Array.from({ length: house.childrenCount }, (_, i) => ({
      beneficiaryId: KenyanIdVO.create(`CHILD_${house.houseId}_${i + 1}`), // Mock ID
      beneficiaryName: `Child ${i + 1} of ${house.houseName}`,
      relationship: 'CHILD',
      grossPercentage: 100 / house.childrenCount,
      finalPercentage: 100 / house.childrenCount,
      value: MoneyVO.create(sharePerChild, this.props.estateContext.totalNetEstate.currency),
      shareType: 'ABSOLUTE',
      houseId: house.houseId,
      houseName: house.houseName,
      houseOrder: house.houseOrder,
      isHouseHead: false,
      breakdown: {
        statutoryEntitlement: MoneyVO.create(
          sharePerChild,
          this.props.estateContext.totalNetEstate.currency,
        ),
        hotchpotAdjustment: MoneyVO.zero(),
        dependantProvision: MoneyVO.zero(),
        customaryAdjustment: MoneyVO.zero(),
        courtOrderAdjustment: MoneyVO.zero(),
        netShare: MoneyVO.create(sharePerChild, this.props.estateContext.totalNetEstate.currency),
      },
      isMinor: true, // Assume children are minors for simplicity
      requiresGuardian: true,
    }));
  }

  applyHotchpotToShares(shares: any[]): any[] {
    if (!shares || shares.length === 0) return shares;

    const { giftsInterVivos, inflationRate } = this.props.hotchpotContext;
    if (giftsInterVivos.length === 0) return shares;

    // Create hotchpot calculation
    const hotchpotAdjustments = giftsInterVivos
      .filter((gift) => gift.isSubjectToHotchpot)
      .map((gift) => ({
        advancementId: gift.giftId,
        recipientId: gift.recipientId,
        description: `Gift to ${gift.recipientName}`,
        valueAtAdvancement: gift.value,
        valueAtDeath: gift.value.multiply(1 + inflationRate.value / 100), // Inflation adjusted
        advancementDate: gift.giftDate,
        isSubjectToHotchpot: true,
        hotchpotStatus: 'NOT_ACCOUNTED' as const,
      }));

    const hotchpotVO = HotchpotAdjustmentVO.create(hotchpotAdjustments, inflationRate, {
      includesAllAdvancements: true,
      customaryExemptionsApplied: false,
    });

    // Apply hotchpot to each recipient's share
    const adjustedShares = shares.map((share) => {
      const recipientGifts = giftsInterVivos.filter(
        (gift) => gift.recipientId.equals(share.beneficiaryId) && gift.isSubjectToHotchpot,
      );

      if (recipientGifts.length === 0) return share;

      const totalGiftsValue = recipientGifts.reduce((sum, gift) => sum + gift.value.amount, 0);

      const adjustedValue = share.value.amount - totalGiftsValue;

      this.addDomainEvent(
        new HotchpotAppliedEvent(
          this.id.toString(),
          share.beneficiaryId.value,
          totalGiftsValue,
          adjustedValue,
        ),
      );

      return {
        ...share,
        value: MoneyVO.create(Math.max(0, adjustedValue), share.value.currency),
        breakdown: {
          ...share.breakdown,
          hotchpotAdjustment: MoneyVO.create(-totalGiftsValue, share.value.currency),
          netShare: MoneyVO.create(Math.max(0, adjustedValue), share.value.currency),
        },
      };
    });

    this.recordHistory(
      'HOTCHPOT_APPLIED',
      `Applied hotchpot adjustments to ${recipientGifts.length} recipients`,
    );
    return adjustedShares;
  }

  applyDependantProvisions(shares: any[]): any[] {
    const { dependants } = this.props.familyContext;
    if (dependants.length === 0) return shares;

    // Calculate dependant provisions
    const dependantShares = dependants.map((dependant) => {
      const provision = this.calculateDependantProvision(dependant);

      this.addDomainEvent(
        new DependencyProvisionCalculatedEvent(
          this.id.toString(),
          dependant.dependantId.value,
          provision.computedEntitlement.amount,
        ),
      );

      return {
        beneficiaryId: dependant.dependantId,
        beneficiaryName: dependant.fullName,
        relationship: 'DEPENDANT',
        grossPercentage: 0,
        finalPercentage:
          (provision.computedEntitlement.amount / this.props.estateContext.totalNetEstate.amount) *
          100,
        value: provision.computedEntitlement,
        shareType: 'ABSOLUTE',
        breakdown: {
          statutoryEntitlement: MoneyVO.zero(),
          hotchpotAdjustment: MoneyVO.zero(),
          dependantProvision: provision.computedEntitlement,
          customaryAdjustment: MoneyVO.zero(),
          courtOrderAdjustment: MoneyVO.zero(),
          netShare: provision.computedEntitlement,
        },
        isMinor: dependant.dependencyLevel === 'FULL',
        requiresGuardian: true,
      };
    });

    // Adjust existing shares to accommodate dependant provisions
    const totalDependantProvision = dependantShares.reduce(
      (sum, share) => sum + share.value.amount,
      0,
    );

    const adjustedShares = shares.map((share) => {
      if (share.relationship === 'SPOUSE') {
        // Spouse life interest may need adjustment
        const adjustedValue = Math.max(0, share.value.amount - totalDependantProvision * 0.3); // 30% from spouse
        return {
          ...share,
          value: MoneyVO.create(adjustedValue, share.value.currency),
          breakdown: {
            ...share.breakdown,
            dependantProvision: MoneyVO.create(
              -(totalDependantProvision * 0.3),
              share.value.currency,
            ),
            netShare: MoneyVO.create(adjustedValue, share.value.currency),
          },
        };
      } else if (share.relationship === 'CHILD') {
        // Children share the remaining adjustment
        const adjustedValue = Math.max(
          0,
          share.value.amount -
            (totalDependantProvision * 0.7) /
              shares.filter((s) => s.relationship === 'CHILD').length,
        );
        return {
          ...share,
          value: MoneyVO.create(adjustedValue, share.value.currency),
          breakdown: {
            ...share.breakdown,
            dependantProvision: MoneyVO.create(
              -(
                (totalDependantProvision * 0.7) /
                shares.filter((s) => s.relationship === 'CHILD').length
              ),
              share.value.currency,
            ),
            netShare: MoneyVO.create(adjustedValue, share.value.currency),
          },
        };
      }
      return share;
    });

    this.recordHistory(
      'DEPENDANT_PROVISIONS_APPLIED',
      `Applied provisions for ${dependants.length} dependants`,
    );
    return [...adjustedShares, ...dependantShares];
  }

  private calculateDependantProvision(dependant: any): DependencyEntitlementVO {
    const deceasedIncome = MoneyVO.create(
      this.props.estateContext.totalNetEstate.amount * 0.05, // Assume 5% annual return
      this.props.estateContext.totalNetEstate.currency,
    );

    return DependencyEntitlementVO.create(
      {
        dependantId: dependant.dependantId,
        fullName: dependant.fullName,
        relationship: dependant.relationship,
        dependencyLevel: dependant.dependencyLevel,
        dependencyBasis: 'Monthly support from deceased',
        age: 35, // Default age
        isMinor: false,
        hasDisability: false,
        monthlySupportProvided: dependant.monthlySupport,
        durationOfDependency: 5, // Years
        evidenceDocumentIds: [],
      },
      deceasedIncome,
      {
        dependencyPercentage: PercentageVO.create(30), // 30% of deceased income
        durationFactor: 1,
        inflationAdjustment: PercentageVO.create(3),
        customaryConsiderations: [],
      },
    );
  }

  recalculateAllScenarios(trigger: string, performedBy?: string): void {
    this.props.calculationStatus = 'IN_PROGRESS';
    this.props.lastRecalculationTrigger = trigger;

    this.props.scenarios.forEach((scenario) => {
      if (scenario.props.scenarioType.includes('INTESTATE')) {
        this.calculateIntestateScenario(scenario.id.toString());
      }
    });

    this.props.calculationStatus = 'COMPLETED';
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new InheritanceRecalculationTriggeredEvent(this.id.toString(), {
        trigger,
        performedBy,
        scenariosRecalculated: this.props.scenarios.size,
        timestamp: new Date(),
      }),
    );

    this.recordHistory('FULL_RECALCULATION', `Full recalculation triggered by: ${trigger}`);
  }

  adjustShareInScenario(
    scenarioId: string,
    shareId: string,
    adjustment: {
      amount: MoneyVO;
      reason: string;
      legalBasis?: string;
      performedBy: string;
    },
  ): void {
    const scenario = this.props.scenarios.get(scenarioId);
    if (!scenario) {
      throw new ValidationError(`Scenario ${scenarioId} not found`);
    }

    // In a real implementation, we'd get the share from the scenario
    // For now, we'll just record the adjustment event

    this.addDomainEvent(
      new ShareAdjustedEvent(this.id.toString(), scenarioId, shareId, adjustment),
    );

    this.recordHistory(
      'SHARE_ADJUSTED',
      `Share ${shareId} adjusted by ${adjustment.amount.amount} ${adjustment.amount.currency}. Reason: ${adjustment.reason}`,
      scenarioId,
      adjustment.performedBy,
    );
  }

  setActiveScenario(scenarioId: string, reason: string): void {
    const scenario = this.props.scenarios.get(scenarioId);
    if (!scenario) {
      throw new ValidationError(`Scenario ${scenarioId} not found`);
    }

    this.props.activeScenarioId = scenarioId;
    this.props.updatedAt = new Date();

    this.recordHistory(
      'ACTIVE_SCENARIO_SET',
      `Set active scenario to "${scenario.props.name}". Reason: ${reason}`,
      scenarioId,
    );
  }

  setDefaultScenario(scenarioId: string): void {
    const scenario = this.props.scenarios.get(scenarioId);
    if (!scenario) {
      throw new ValidationError(`Scenario ${scenarioId} not found`);
    }

    this.props.defaultScenarioId = scenarioId;
    scenario.setAsDefault();
    this.props.updatedAt = new Date();

    this.recordHistory(
      'DEFAULT_SCENARIO_SET',
      `Set default scenario to "${scenario.props.name}"`,
      scenarioId,
    );
  }

  generateComparativeAnalysis(): {
    scenarios: Array<{
      id: string;
      name: string;
      type: string;
      fairnessScore: number;
      taxEfficiency: number;
      legalCompliance: number;
      implementationComplexity: number;
      totalValue: MoneyVO;
      beneficiaryCount: number;
      recommended: boolean;
    }>;
    recommendations: Array<{
      scenarioId: string;
      recommendation: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      rationale: string;
    }>;
    summary: {
      bestFairness: string;
      bestTaxEfficiency: string;
      bestLegalCompliance: string;
      easiestImplementation: string;
      overallRecommendation?: string;
    };
  } {
    const scenarios = Array.from(this.props.scenarios.values())
      .filter((s) => s.props.results)
      .map((scenario) => ({
        id: scenario.id.toString(),
        name: scenario.props.name,
        type: scenario.props.scenarioType,
        fairnessScore: scenario.props.results!.fairnessScore.value,
        taxEfficiency: scenario.props.results!.taxEfficiency.value,
        legalCompliance:
          scenario.props.results!.isS35Compliant &&
          scenario.props.results!.isS40Compliant &&
          scenario.props.results!.isS29Addressed
            ? 100
            : 50,
        implementationComplexity: 100 - scenario.props.results!.distributionEfficiency.value, // Higher efficiency = lower complexity
        totalValue: scenario.props.results!.totalDistributable,
        beneficiaryCount: scenario.props.results!.totalSharesCalculated,
        recommended: scenario.id.toString() === this.props.recommendedScenarioId,
      }));

    // Calculate best in each category
    const bestFairness = scenarios.reduce((best, current) =>
      current.fairnessScore > best.fairnessScore ? current : best,
    );

    const bestTaxEfficiency = scenarios.reduce((best, current) =>
      current.taxEfficiency > best.taxEfficiency ? current : best,
    );

    const bestLegalCompliance = scenarios.reduce((best, current) =>
      current.legalCompliance > best.legalCompliance ? current : best,
    );

    const easiestImplementation = scenarios.reduce((best, current) =>
      current.implementationComplexity < best.implementationComplexity ? current : best,
    );

    // Generate recommendations
    const recommendations: Array<{
      scenarioId: string;
      recommendation: string;
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      rationale: string;
    }> = [];

    scenarios.forEach((scenario) => {
      if (scenario.fairnessScore < 70) {
        recommendations.push({
          scenarioId: scenario.id,
          recommendation: 'Improve distribution fairness',
          priority: 'HIGH',
          rationale: `Fairness score of ${scenario.fairnessScore} indicates potential inequities`,
        });
      }

      if (scenario.taxEfficiency < 60) {
        recommendations.push({
          scenarioId: scenario.id,
          recommendation: 'Optimize for tax efficiency',
          priority: 'MEDIUM',
          rationale: `Tax efficiency score of ${scenario.taxEfficiency} suggests potential tax savings`,
        });
      }

      if (scenario.legalCompliance < 80) {
        recommendations.push({
          scenarioId: scenario.id,
          recommendation: 'Address legal compliance gaps',
          priority: 'HIGH',
          rationale: `Legal compliance score of ${scenario.legalCompliance} indicates potential legal risks`,
        });
      }
    });

    // Determine overall recommendation
    let overallRecommendation: string | undefined;
    const activeScenario = this.props.activeScenarioId
      ? scenarios.find((s) => s.id === this.props.activeScenarioId)
      : undefined;

    if (activeScenario) {
      if (activeScenario.fairnessScore >= 80 && activeScenario.legalCompliance >= 90) {
        overallRecommendation = 'Current active scenario is well-balanced and legally sound';
      } else if (
        bestFairness.id !== activeScenario.id &&
        bestFairness.fairnessScore > activeScenario.fairnessScore + 10
      ) {
        overallRecommendation = `Consider switching to "${bestFairness.name}" for better fairness`;
      } else if (
        bestTaxEfficiency.id !== activeScenario.id &&
        bestTaxEfficiency.taxEfficiency > activeScenario.taxEfficiency + 15
      ) {
        overallRecommendation = `Consider switching to "${bestTaxEfficiency.name}" for significant tax savings`;
      }
    }

    return {
      scenarios,
      recommendations,
      summary: {
        bestFairness: bestFairness.name,
        bestTaxEfficiency: bestTaxEfficiency.name,
        bestLegalCompliance: bestLegalCompliance.name,
        easiestImplementation: easiestImplementation.name,
        overallRecommendation,
      },
    };
  }

  archiveScenario(scenarioId: string, reason: string): void {
    const scenario = this.props.scenarios.get(scenarioId);
    if (!scenario) {
      throw new ValidationError(`Scenario ${scenarioId} not found`);
    }

    scenario.archive(reason);
    this.props.updatedAt = new Date();

    if (this.props.activeScenarioId === scenarioId) {
      this.props.activeScenarioId = undefined;
    }

    if (this.props.defaultScenarioId === scenarioId) {
      this.props.defaultScenarioId = undefined;
    }

    this.recordHistory(
      'SCENARIO_ARCHIVED',
      `Archived scenario "${scenario.props.name}". Reason: ${reason}`,
      scenarioId,
    );
  }

  private calculatePersonalEffectsValue(): number {
    // Simplified: 10% of estate for personal/household effects
    return this.props.estateContext.totalNetEstate.amount * 0.1;
  }

  private recordHistory(
    action: string,
    details: string,
    scenarioId?: string,
    performedBy?: string,
  ): void {
    this.props.calculationHistory.push({
      timestamp: new Date(),
      action,
      scenarioId,
      details,
      performedBy,
    });

    // Keep history manageable (last 100 entries)
    if (this.props.calculationHistory.length > 100) {
      this.props.calculationHistory = this.props.calculationHistory.slice(-100);
    }
  }

  // Getters
  get estateContext(): EstateContext {
    return this.props.estateContext;
  }

  get scenarios(): Map<string, DistributionScenario> {
    return this.props.scenarios;
  }

  get activeScenario(): DistributionScenario | undefined {
    return this.props.activeScenarioId
      ? this.props.scenarios.get(this.props.activeScenarioId)
      : undefined;
  }

  get defaultScenario(): DistributionScenario | undefined {
    return this.props.defaultScenarioId
      ? this.props.scenarios.get(this.props.defaultScenarioId)
      : undefined;
  }

  get calculationStatus(): string {
    return this.props.calculationStatus;
  }

  get recommendedScenarioId(): string | undefined {
    return this.props.summary?.recommendedScenarioId;
  }

  toJSON() {
    const scenariosArray = Array.from(this.props.scenarios.values());

    return {
      id: this.id.toString(),
      estateContext: {
        ...this.props.estateContext,
        deceasedId: this.props.estateContext.deceasedId.value,
        totalGrossEstate: this.props.estateContext.totalGrossEstate.toJSON(),
        totalNetEstate: this.props.estateContext.totalNetEstate.toJSON(),
        totalLiabilities: this.props.estateContext.totalLiabilities.toJSON(),
      },
      legalContext: this.props.legalContext,
      familyContext: {
        ...this.props.familyContext,
        survivingSpouse: {
          ...this.props.familyContext.survivingSpouse,
          spouseId: this.props.familyContext.survivingSpouse.spouseId?.value,
        },
        children: this.props.familyContext.children.map((child) => ({
          ...child,
          childId: child.childId.value,
        })),
        dependants: this.props.familyContext.dependants.map((dependant) => ({
          ...dependant,
          dependantId: dependant.dependantId.value,
          monthlySupport: dependant.monthlySupport.toJSON(),
        })),
      },
      hotchpotContext: {
        ...this.props.hotchpotContext,
        giftsInterVivos: this.props.hotchpotContext.giftsInterVivos.map((gift) => ({
          ...gift,
          recipientId: gift.recipientId.value,
          value: gift.value.toJSON(),
        })),
        inflationRate: this.props.hotchpotContext.inflationRate.value,
      },
      scenarios: scenariosArray.map((s) => ({
        id: s.id.toString(),
        name: s.props.name,
        type: s.props.scenarioType,
        status: s.props.isActive ? 'ACTIVE' : 'ARCHIVED',
        isDefault: s.props.isDefault,
      })),
      activeScenarioId: this.props.activeScenarioId,
      defaultScenarioId: this.props.defaultScenarioId,
      calculationStatus: this.props.calculationStatus,
      calculationErrors: this.props.calculationErrors,
      summary: this.generateComparativeAnalysis(),
      history: this.props.calculationHistory.slice(-20), // Last 20 entries
      version: this.props.version,
      timestamps: {
        createdAt: this.props.createdAt,
        updatedAt: this.props.updatedAt,
        lastCalculatedAt: this.props.lastCalculatedAt,
      },
      statistics: {
        totalScenarios: scenariosArray.length,
        activeScenarios: scenariosArray.filter((s) => s.props.isActive).length,
        archivedScenarios: scenariosArray.filter((s) => s.props.isArchived).length,
        scenariosWithCalculations: scenariosArray.filter((s) => !!s.props.results).length,
      },
    };
  }
}
