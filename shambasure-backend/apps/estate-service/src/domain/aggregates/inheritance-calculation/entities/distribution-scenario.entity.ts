import { AggregateRoot, Entity, UniqueEntityId } from '../../../core/domain';
import { MoneyVO, PercentageVO, KenyanIdVO, DateRangeVO } from '../../shared';
import { Section35CalculationVO, Section40CalculationVO, HotchpotAdjustmentVO, DependencyEntitlementVO } from '../value-objects';
import { ValidationError } from '../../../core/exceptions';
import { DistributionScenarioCreatedEvent, DistributionScenarioUpdatedEvent, ComputedShareAddedEvent } from '../events';

export type ScenarioType = 
  | 'INTESTATE_S35_MONOGAMOUS' 
  | 'INTESTATE_S40_POLYGAMOUS' 
  | 'TESTATE_WILL_BASED'
  | 'CUSTOMARY_LAW'
  | 'COURT_ORDERED'
  | 'CUSTOM_HYBRID';

export type ScenarioParameters = {
  // Estate configuration
  estateId: string;
  totalGrossValue: MoneyVO;
  totalNetValue: MoneyVO;
  
  // Debt assumptions
  assumeAllDebtsPaid: boolean;
  debtAdjustmentPercentage?: PercentageVO;
  
  // Hotchpot settings
  includeHotchpot: boolean;
  hotchpotGiftIds: string[];
  hotchpotInflationRate: PercentageVO;
  
  // Customary law
  customaryLawApplicable: boolean;
  customaryLawType?: string; // e.g., "KIKUYU", "LUO", "KAMBA"
  customaryElderApproval?: boolean;
  
  // Legal basis
  appliedLawSection: string; // "S.35", "S.40", "S.29", etc.
  polygamousHouseCount: number;
  
  // Asset filters
  includedAssetIds: string[];
  excludedAssetIds: string[];
  
  // Dependant provisions
  includeDependantProvision: boolean;
  courtOrderExists: boolean;
  
  // Time considerations
  valuationDate: Date;
  projectionYears: number;
};

export type ScenarioResults = {
  totalDistributable: MoneyVO;
  totalSharesCalculated: number;
  averageShareValue: MoneyVO;
  largestShare: MoneyVO;
  smallestShare: MoneyVO;
  
  // Legal compliance
  isS35Compliant: boolean;
  isS40Compliant: boolean;
  isS29Addressed: boolean;
  isS35_3HotchpotApplied: boolean;
  
  // Efficiency metrics
  distributionEfficiency: PercentageVO; // How well assets match beneficiary needs
  taxEfficiency: PercentageVO; // Tax optimization score
  fairnessScore: PercentageVO; // Subjective fairness measure
  
  // Customary compliance
  customaryCompliance: PercentageVO;
  elderCouncilApprovalScore?: number;
  
  // Residual estate
  residualAmount: MoneyVO;
  residualReason?: string;
};

export type ScenarioComparison = {
  baseScenarioId?: string;
  differences: Array<{
    field: string;
    previousValue: any;
    newValue: any;
    impactDescription: string;
  }>;
  overallImpact: 'INCREASED_EQUITY' | 'REDUCED_EQUITY' | 'MINIMAL_CHANGE' | 'MAJOR_RESTRUCTURING';
};

export interface DistributionScenarioProps {
  // Core identity
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  
  // Creator info
  createdByUserId: string;
  createdByFullName: string;
  
  // Parameters
  parameters: ScenarioParameters;
  
  // Results (calculated)
  results?: ScenarioResults;
  
  // Comparison context
  comparison?: ScenarioComparison;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  isArchived: boolean;
  
  // Versioning
  version: number;
  basedOnVersion?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastCalculatedAt?: Date;
  
  // Relationships (will be loaded separately)
  computedShareIds?: string[];
}

export class DistributionScenario extends AggregateRoot<DistributionScenarioProps> {
  private computedShares: Map<string, any> = new Map(); // Map of shareId -> ComputedShare entity

  private constructor(props: DistributionScenarioProps, id?: UniqueEntityId) {
    super(props, id);
    this.validate();
  }

  static create(
    name: string,
    scenarioType: ScenarioType,
    createdByUserId: string,
    createdByFullName: string,
    parameters: Omit<ScenarioParameters, 'valuationDate'> & { valuationDate?: Date },
    id?: UniqueEntityId
  ): DistributionScenario {
    const now = new Date();
    const props: DistributionScenarioProps = {
      name,
      scenarioType,
      createdByUserId,
      createdByFullName,
      parameters: {
        ...parameters,
        valuationDate: parameters.valuationDate || now,
      },
      isActive: true,
      isDefault: false,
      isArchived: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const scenario = new DistributionScenario(props, id);
    scenario.addDomainEvent(new DistributionScenarioCreatedEvent(scenario.id.toString(), scenario.toJSON()));
    return scenario;
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length < 3) {
      throw new ValidationError('Scenario name must be at least 3 characters');
    }

    if (!this.props.createdByUserId) {
      throw new ValidationError('Scenario must have a creator');
    }

    if (this.props.parameters.totalGrossValue.amount <= 0) {
      throw new ValidationError('Gross estate value must be positive');
    }

    if (this.props.parameters.totalNetValue.amount > this.props.parameters.totalGrossValue.amount) {
      throw new ValidationError('Net estate value cannot exceed gross value');
    }

    if (this.props.parameters.debtAdjustmentPercentage && 
        (this.props.parameters.debtAdjustmentPercentage.value < 0 || 
         this.props.parameters.debtAdjustmentPercentage.value > 100)) {
      throw new ValidationError('Debt adjustment percentage must be 0-100%');
    }

    // Validate scenario type specific rules
    if (this.props.scenarioType === 'INTESTATE_S40_POLYGAMOUS' && this.props.parameters.polygamousHouseCount < 2) {
      throw new ValidationError('Polygamous scenarios require at least 2 houses');
    }

    if (this.props.parameters.includeHotchpot && this.props.parameters.hotchpotGiftIds.length === 0) {
      console.warn('Hotchpot enabled but no gifts specified');
    }
  }

  // Domain methods
  updateParameters(
    updates: Partial<ScenarioParameters>,
    updatedBy: string,
    reason: string
  ): void {
    const oldParameters = { ...this.props.parameters };
    this.props.parameters = { ...this.props.parameters, ...updates };
    this.props.version += 1;
    this.props.updatedAt = new Date();
    this.props.lastCalculatedAt = undefined; // Reset calculation

    this.addDomainEvent(new DistributionScenarioUpdatedEvent(
      this.id.toString(),
      {
        oldParameters,
        newParameters: this.props.parameters,
        updatedBy,
        reason,
        version: this.props.version
      }
    ));
  }

  addComputedShare(share: any): void {
    if (!this.computedShares.has(share.id.toString())) {
      this.computedShares.set(share.id.toString(), share);
      
      if (!this.props.computedShareIds) {
        this.props.computedShareIds = [];
      }
      this.props.computedShareIds.push(share.id.toString());

      this.addDomainEvent(new ComputedShareAddedEvent(
        this.id.toString(),
        share.id.toString(),
        share.toJSON()
      ));
    }
  }

  removeComputedShare(shareId: string): void {
    if (this.computedShares.has(shareId)) {
      this.computedShares.delete(shareId);
      this.props.computedShareIds = this.props.computedShareIds?.filter(id => id !== shareId) || [];
      this.props.updatedAt = new Date();
    }
  }

  calculateResults(shares: any[]): void {
    if (shares.length === 0) {
      throw new ValidationError('Cannot calculate results without shares');
    }

    // Calculate basic statistics
    const shareValues = shares.map(s => s.finalShareValue.amount);
    const totalDistributable = shareValues.reduce((sum, val) => sum + val, 0);
    const averageShare = totalDistributable / shares.length;
    const largestShare = Math.max(...shareValues);
    const smallestShare = Math.min(...shareValues);

    // Calculate compliance scores
    const isS35Compliant = this.checkS35Compliance(shares);
    const isS40Compliant = this.checkS40Compliance(shares);
    const isS29Addressed = this.checkS29Compliance(shares);
    const isS35_3HotchpotApplied = this.props.parameters.includeHotchpot && 
      this.props.parameters.hotchpotGiftIds.length > 0;

    // Calculate efficiency scores (simplified)
    const distributionEfficiency = this.calculateDistributionEfficiency(shares);
    const taxEfficiency = this.calculateTaxEfficiency(shares);
    const fairnessScore = this.calculateFairnessScore(shares);

    // Calculate residual (if any)
    const residualAmount = this.props.parameters.totalNetValue.amount - totalDistributable;
    let residualReason: string | undefined;
    if (residualAmount > 0.01) {
      residualReason = 'Undistributed due to rounding, unallocated assets, or court hold';
    }

    this.props.results = {
      totalDistributable: MoneyVO.create(totalDistributable, this.props.parameters.totalNetValue.currency),
      totalSharesCalculated: shares.length,
      averageShareValue: MoneyVO.create(averageShare, this.props.parameters.totalNetValue.currency),
      largestShare: MoneyVO.create(largestShare, this.props.parameters.totalNetValue.currency),
      smallestShare: MoneyVO.create(smallestShare, this.props.parameters.totalNetValue.currency),
      isS35Compliant,
      isS40Compliant,
      isS29Addressed,
      isS35_3HotchpotApplied,
      distributionEfficiency: PercentageVO.create(distributionEfficiency),
      taxEfficiency: PercentageVO.create(taxEfficiency),
      fairnessScore: PercentageVO.create(fairnessScore),
      customaryCompliance: PercentageVO.create(
        this.props.parameters.customaryLawApplicable ? 85 : 100 // Simplified
      ),
      residualAmount: MoneyVO.create(residualAmount, this.props.parameters.totalNetValue.currency),
      residualReason
    };

    this.props.lastCalculatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  private checkS35Compliance(shares: any[]): boolean {
    if (this.props.scenarioType !== 'INTESTATE_S35_MONOGAMOUS') return true;

    // Check for spouse life interest and equal children shares
    const spouseShares = shares.filter(s => s.beneficiaryRelationship === 'SPOUSE');
    const childrenShares = shares.filter(s => s.beneficiaryRelationship === 'CHILD');

    if (spouseShares.length !== 1) return false;
    if (spouseShares[0].shareType !== 'LIFE_INTEREST') return false;

    // Check if children shares are equal (within tolerance)
    if (childrenShares.length > 1) {
      const firstShare = childrenShares[0].finalShareValue.amount;
      return childrenShares.every(share => 
        Math.abs(share.finalShareValue.amount - firstShare) < 0.01
      );
    }

    return true;
  }

  private checkS40Compliance(shares: any[]): boolean {
    if (this.props.scenarioType !== 'INTESTATE_S40_POLYGAMOUS') return true;

    // Group shares by house
    const sharesByHouse = new Map<string, any[]>();
    shares.forEach(share => {
      if (share.polygamousContext?.houseId) {
        const houseShares = sharesByHouse.get(share.polygamousContext.houseId) || [];
        houseShares.push(share);
        sharesByHouse.set(share.polygamousContext.houseId, houseShares);
      }
    });

    // Each house should have equal total share
    if (sharesByHouse.size < 2) return false;
    
    const houseTotals = Array.from(sharesByHouse.entries()).map(([houseId, houseShares]) => ({
      houseId,
      total: houseShares.reduce((sum, share) => sum + share.finalShareValue.amount, 0)
    }));

    const firstTotal = houseTotals[0].total;
    return houseTotals.every(h => Math.abs(h.total - firstTotal) < 0.01);
  }

  private checkS29Compliance(shares: any[]): boolean {
    if (!this.props.parameters.includeDependantProvision) return true;

    const dependants = shares.filter(s => 
      s.beneficiaryRelationship === 'DEPENDANT' || 
      s.breakdown.dependantProvision.amount > 0
    );

    return dependants.length > 0 || !this.props.parameters.includeDependantProvision;
  }

  private calculateDistributionEfficiency(shares: any[]): number {
    // Simplified: How well assets match beneficiary needs/preferences
    // In reality, this would consider asset types, beneficiary locations, etc.
    const assetBeneficiaryMatches = shares.filter(share => {
      // Check if share includes preferred assets
      return share.metadata?.assumptionsUsed?.assetPreferences?.matched || false;
    }).length;

    return (assetBeneficiaryMatches / shares.length) * 100;
  }

  private calculateTaxEfficiency(shares: any[]): number {
    // Simplified tax efficiency score
    const totalTax = shares.reduce((sum, share) => {
      const tax = share.calculateTaxImplications?.(PercentageVO.create(15)).taxPayable.amount || 0;
      return sum + tax;
    }, 0);

    const maxPossibleTax = shares.reduce((sum, share) => 
      sum + share.finalShareValue.amount * 0.15, 0
    );

    if (maxPossibleTax === 0) return 100;
    return 100 - (totalTax / maxPossibleTax) * 100;
  }

  private calculateFairnessScore(shares: any[]): number {
    // Simplified fairness calculation based on:
    // 1. Equal treatment of similar beneficiaries
    // 2. Consideration of dependency needs
    // 3. Recognition of contributions

    let score = 80; // Base score

    // Adjust based on variations
    const values = shares.map(s => s.finalShareValue.amount);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = more equal distribution
    if (mean > 0) {
      const coefficientOfVariation = stdDev / mean;
      score -= coefficientOfVariation * 20; // Penalize high variation
    }

    // Bonus for addressing dependants
    const dependantsCovered = shares.filter(s => 
      s.beneficiaryRelationship === 'DEPENDANT' && s.finalShareValue.amount > 0
    ).length;
    score += Math.min(dependantsCovered * 5, 20);

    return Math.max(0, Math.min(100, score));
  }

  compareWith(scenario: DistributionScenario): ScenarioComparison {
    const differences: Array<{
      field: string;
      previousValue: any;
      newValue: any;
      impactDescription: string;
    }> = [];

    // Compare parameters
    Object.keys(this.props.parameters).forEach(key => {
      const thisVal = (this.props.parameters as any)[key];
      const otherVal = (scenario.parameters as any)[key];
      
      if (JSON.stringify(thisVal) !== JSON.stringify(otherVal)) {
        differences.push({
          field: key,
          previousValue: thisVal,
          newValue: otherVal,
          impactDescription: this.describeImpact(key, thisVal, otherVal)
        });
      }
    });

    // Compare results if both have them
    if (this.props.results && scenario.props.results) {
      Object.keys(this.props.results).forEach(key => {
        const thisVal = (this.props.results as any)[key];
        const otherVal = (scenario.props.results as any)[key];
        
        if (JSON.stringify(thisVal) !== JSON.stringify(otherVal)) {
          differences.push({
            field: `results.${key}`,
            previousValue: thisVal,
            newValue: otherVal,
            impactDescription: `Changes distribution outcomes`
          });
        }
      });
    }

    // Determine overall impact
    const overallImpact = this.determineOverallImpact(differences);

    return {
      baseScenarioId: scenario.id.toString(),
      differences,
      overallImpact
    };
  }

  private describeImpact(field: string, oldVal: any, newVal: any): string {
    switch (field) {
      case 'debtAdjustmentPercentage':
        return `Debt payment changed from ${oldVal?.value || 100}% to ${newVal?.value || 100}%`;
      case 'includeHotchpot':
        return newVal ? 'Hotchpot rule now applied' : 'Hotchpot rule removed';
      case 'customaryLawApplicable':
        return newVal ? 'Customary law considerations added' : 'Customary law considerations removed';
      case 'polygamousHouseCount':
        return `Polygamous house count changed from ${oldVal} to ${newVal}`;
      default:
        return `Parameter "${field}" was modified`;
    }
  }

  private determineOverallImpact(differences: any[]): ScenarioComparison['overallImpact'] {
    if (differences.length === 0) return 'MINIMAL_CHANGE';

    const significantChanges = differences.filter(diff => 
      diff.field.includes('debtAdjustmentPercentage') ||
      diff.field.includes('includeHotchpot') ||
      diff.field.includes('polygamousHouseCount') ||
      diff.field.includes('scenarioType')
    );

    if (significantChanges.length >= 2) return 'MAJOR_RESTRUCTURING';
    if (significantChanges.length === 1) {
      const field = significantChanges[0].field;
      if (field.includes('debtAdjustmentPercentage')) {
        const oldVal = significantChanges[0].previousValue?.value || 100;
        const newVal = significantChanges[0].newValue?.value || 100;
        return newVal > oldVal ? 'REDUCED_EQUITY' : 'INCREASED_EQUITY';
      }
      return 'MAJOR_RESTRUCTURING';
    }

    return 'MINIMAL_CHANGE';
  }

  setAsDefault(): void {
    this.props.isDefault = true;
    this.props.updatedAt = new Date();
  }

  archive(reason: string): void {
    this.props.isArchived = true;
    this.props.isActive = false;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      type: 'SCENARIO_ARCHIVED',
      payload: {
        scenarioId: this.id.toString(),
        reason,
        archivedAt: new Date()
      }
    });
  }

  restore(): void {
    this.props.isArchived = false;
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  getShareSummary(): {
    totalBeneficiaries: number;
    byRelationship: Record<string, number>;
    byShareType: Record<string, number>;
    totalValue: MoneyVO;
  } {
    const shares = Array.from(this.computedShares.values());
    
    const byRelationship: Record<string, number> = {};
    const byShareType: Record<string, number> = {};
    
    let totalValue = MoneyVO.zero();
    
    shares.forEach(share => {
      const relationship = share.beneficiaryRelationship;
      const shareType = share.shareType;
      
      byRelationship[relationship] = (byRelationship[relationship] || 0) + 1;
      byShareType[shareType] = (byShareType[shareType] || 0) + 1;
      
      totalValue = totalValue.add(share.finalShareValue.amount);
    });

    return {
      totalBeneficiaries: shares.length,
      byRelationship,
      byShareType,
      totalValue
    };
  }

  generateReport(): {
    executiveSummary: string;
    legalCompliance: Array<{ aspect: string; status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL'; notes: string }>;
    recommendations: Array<{ priority: 'HIGH' | 'MEDIUM' | 'LOW'; recommendation: string; rationale: string }>;
    riskAssessment: Array<{ risk: string; likelihood: string; impact: string; mitigation: string }>;
  } {
    const shares = Array.from(this.computedShares.values());
    const results = this.props.results;
    
    const legalCompliance: Array<{ aspect: string; status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL'; notes: string }> = [
      {
        aspect: 'Section 35 Compliance',
        status: results?.isS35Compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        notes: results?.isS35Compliant ? 'Meets monogamous intestate requirements' : 'Does not meet S.35 requirements'
      },
      {
        aspect: 'Section 40 Compliance',
        status: results?.isS40Compliant ? 'COMPLIANT' : 'NON_COMPLIANT',
        notes: results?.isS40Compliant ? 'Polygamous house distribution compliant' : 'S.40 distribution issues detected'
      },
      {
        aspect: 'Dependant Provision',
        status: results?.isS29Addressed ? 'COMPLIANT' : 'PARTIAL',
        notes: results?.isS29Addressed ? 'Dependant needs addressed' : 'Potential dependant claims not fully addressed'
      }
    ];

    const recommendations: Array<{ priority: 'HIGH' | 'MEDIUM' | 'LOW'; recommendation: string; rationale: string }> = [];
    
    if (results && results.fairnessScore.value < 70) {
      recommendations.push({
        priority: 'HIGH',
        recommendation: 'Review distribution for fairness improvements',
        rationale: `Fairness score of ${results.fairnessScore.value} indicates potential inequities`
      });
    }

    if (this.props.parameters.includeHotchpot && this.props.parameters.hotchpotGiftIds.length === 0) {
      recommendations.push({
        priority: 'MEDIUM',
        recommendation: 'Document any inter vivos gifts for hotchpot calculation',
        rationale: 'Hotchpot enabled but no gifts recorded - may lead to inaccurate distribution'
      });
    }

    if (shares.some(s => s.isMinor && !s.requiresGuardian)) {
      recommendations.push({
        priority: 'HIGH',
        recommendation: 'Appoint guardians for minor beneficiaries',
        rationale: 'Minors require legal guardians for inheritance management'
      });
    }

    const riskAssessment: Array<{ risk: string; likelihood: string; impact: string; mitigation: string }> = [
      {
        risk: 'Dispute among beneficiaries',
        likelihood: 'MODERATE',
        impact: 'HIGH',
        mitigation: 'Document rationale clearly and consider mediation clauses'
      },
      {
        risk: 'Tax inefficiency',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        mitigation: 'Consult tax advisor for optimization strategies'
      },
      {
        risk: 'Asset liquidity issues',
        likelihood: 'LOW',
        impact: 'HIGH',
        mitigation: 'Maintain adequate liquid assets for immediate distributions'
      }
    ];

    return {
      executiveSummary: `Distribution scenario "${this.props.name}" proposes allocation of ${results?.totalDistributable.amount || 0} KES among ${shares.length} beneficiaries with ${results?.fairnessScore.value || 0}% fairness score.`,
      legalCompliance,
      recommendations,
      riskAssessment
    };
  }

  // Getters
  get name(): string {
    return this.props.name;
  }

  get scenarioType(): string {
    return this.props.scenarioType;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  get results(): ScenarioResults | undefined {
    return this.props.results;
  }

  get version(): number {
    return this.props.version;
  }

  toJSON() {
    return {
      id: this.id.toString(),
      name: this.props.name,
      description: this.props.description,
      scenarioType: this.props.scenarioType,
      createdBy: {
        userId: this.props.createdByUserId,
        fullName: this.props.createdByFullName
      },
      parameters: {
        ...this.props.parameters,
        totalGrossValue: this.props.parameters.totalGrossValue.toJSON(),
        totalNetValue: this.props.parameters.totalNetValue.toJSON(),
        debtAdjustmentPercentage: this.props.parameters.debtAdjustmentPercentage?.value,
        hotchpotInflationRate: this.props.parameters.hotchpotInflationRate.value
      },
      results: this.props.results ? {
        ...this.props.results,
        totalDistributable: this.props.results.totalDistributable.toJSON(),
        averageShareValue: this.props.results.averageShareValue.toJSON(),
        largestShare: this.props.results.largestShare.toJSON(),
        smallestShare: this.props.results.smallestShare.toJSON(),
        distributionEfficiency: this.props.results.distributionEfficiency.value,
        taxEfficiency: this.props.results.taxEfficiency.value,
        fairnessScore: this.props.results.fairnessScore.value,
        customaryCompliance: this.props.results.customaryCompliance.value,
        residualAmount: this.props.results.residualAmount.toJSON()
      } : undefined,
      status: {
        isActive: this.props.isActive,
        isDefault: this.props.isDefault,
        isArchived: this.props.isArchived
      },
      version: this.props.version,
      timestamps: {
        createdAt: this.props.createdAt,
        updatedAt: this.props.updatedAt,
        lastCalculatedAt: this.props.lastCalculatedAt
      },
      computedShareCount: this.computedShares.size,
      summary: this.getShareSummary(),
      report: this.generateReport()
    };
  }
}