import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { legalRulesConfig } from '../config/legal-rules.config';
import { FamilyTreeBuilder, FamilyTree, FamilyTreeNode } from './family-tree-builder';
import { RelationshipType } from '@prisma/client';
import { LegalHeirAnalysis } from './family-tree-builder';

interface SerializedIntestateDistribution {
  type: 'intestate';
  scenario: IntestateDistribution['scenario'];
  beneficiaries: [string, BeneficiaryShare][];
  polygamousUnits?: PolygamousUnitDistribution[];
  lifeInterests?: LifeInterest[];
}

interface SerializedTestateDistribution {
  type: 'testate';
  specificBequests: [string, BeneficiaryShare][];
  residuaryBeneficiaries: [string, BeneficiaryShare][];
  dependantProvisions: [string, BeneficiaryShare][];
  unallocatedResidue: number;
}

type SerializedDistribution = SerializedIntestateDistribution | SerializedTestateDistribution;

interface ExportData {
  totalEstate: number;
  netEstate: number;
  deductions: {
    funeralExpenses: number;
    testamentaryExpenses: number;
    administrativeExpenses: number;
    taxesAndDuties: number;
    debtsByPriority: [string, number][];
    totalDeductions: number;
  };
  distribution: SerializedDistribution;
  lawSection: string;
  notes: string[];
  warnings: string[];
  requiredActions: RequiredAction[];
  generatedAt: string;
}

export interface Deceased {
  id: string;
  name: string;
  dateOfDeath: Date;
  estateValue: number;
  currency: string;
  hasWill: boolean;
  willId?: string;
}

export interface Dependant {
  id: string;
  name: string;
  relationship: RelationshipType;
  isMinor: boolean;
  isDeceased: boolean;
  dateOfBirth?: Date;
  needsSupport?: boolean;
}

export interface Will {
  id: string;
  testatorId: string;
  status: string;
  beneficiaryAssignments: BeneficiaryAssignment[];
  disinheritances: string[]; // IDs of disinherited persons
  residuaryClause?: string;
}

export interface BeneficiaryAssignment {
  beneficiaryId: string;
  assetId?: string;
  sharePercent: number;
  specificAmount?: number;
  bequestType: string;
  hasCondition: boolean;
  conditionDetails?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  estimatedValue: number;
  currency: string;
  ownershipType: string;
  ownershipShare?: number;
}

export interface Debt {
  id: string;
  type: string;
  description: string;
  principalAmount: number;
  outstandingBalance: number;
  creditorName: string;
  priority: number;
}

// Distribution calculation results
export interface DistributionPlan {
  totalEstate: number;
  netEstate: number;
  deductions: DeductionBreakdown;
  distribution: IntestateDistribution | TestateDistribution;
  lawSection: string;
  notes: string[];
  warnings: string[];
  requiredActions: RequiredAction[];
}

export interface DeductionBreakdown {
  funeralExpenses: number;
  testamentaryExpenses: number;
  debtsByPriority: Map<string, number>;
  taxesAndDuties: number;
  administrativeExpenses: number;
  totalDeductions: number;
}

export interface IntestateDistribution {
  scenario:
    | 'ONE_SPOUSE_WITH_CHILDREN'
    | 'MULTIPLE_SPOUSES_WITH_CHILDREN'
    | 'SPOUSE_ONLY'
    | 'CHILDREN_ONLY'
    | 'RELATIVES_ONLY'
    | 'NO_HEIRS';
  beneficiaries: Map<string, BeneficiaryShare>;
  polygamousUnits?: PolygamousUnitDistribution[];
  lifeInterests?: LifeInterest[];
}

export interface TestateDistribution {
  specificBequests: Map<string, BeneficiaryShare>;
  residuaryBeneficiaries: Map<string, BeneficiaryShare>;
  dependantProvisions: Map<string, BeneficiaryShare>;
  unallocatedResidue: number;
}

export interface BeneficiaryShare {
  beneficiaryId: string;
  beneficiaryName: string;
  relationship: RelationshipType;
  shareType: 'ABSOLUTE' | 'LIFE_INTEREST' | 'CONDITIONAL' | 'TRUST';
  sharePercent: number;
  shareAmount: number;
  priority: number;
  conditions?: string[];
  trustDetails?: TrustDetails;
}

export interface PolygamousUnitDistribution {
  unitNumber: number;
  spouseId: string;
  spouseName: string;
  childrenIds: string[];
  unitSize: number;
  unitShare: number;
  spouseAmount: number;
  childrenTotalAmount: number;
  perChildAmount: number;
}

export interface LifeInterest {
  beneficiaryId: string;
  beneficiaryName: string;
  assetIds: string[];
  estimatedValue: number;
  remaindermen: string[]; // Who gets it after life interest ends
  conditions: string[];
}

export interface TrustDetails {
  trusteeId?: string;
  trusteeName: string;
  purpose: string;
  validUntil?: Date;
  releaseConditions: string[];
}

export interface RequiredAction {
  action: string;
  reason: string;
  legalBasis: string;
  deadline?: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DependantProvisionAnalysis {
  requiredProvisions: Map<string, number>;
  shortfall: number;
  recommendations: string[];
  legalGrounds: string[];
}

// ============================================================================
// KENYAN SUCCESSION CALCULATOR SERVICE
// ============================================================================

@Injectable()
export class KenyanSuccessionCalculator {
  private readonly logger = new Logger(KenyanSuccessionCalculator.name);

  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
    private readonly familyTreeBuilder: FamilyTreeBuilder,
  ) {}

  // ============================================================================
  // MAIN CALCULATION METHODS
  // ============================================================================

  /**
   * Calculates complete intestate distribution per Kenyan Law of Succession Act
   * Sections 35-42
   */
  public calculateIntestateDistribution(
    deceased: Deceased,
    familyTree: FamilyTree,
    assets: Asset[],
    debts: Debt[],
  ): DistributionPlan {
    this.logger.log(`Calculating intestate distribution for ${deceased.name}`);

    // Step 1: Calculate estate value and deductions
    const totalEstate = this.calculateTotalEstate(assets);
    const deductions = this.calculateDeductions(totalEstate, debts);
    const netEstate = totalEstate - deductions.totalDeductions;

    if (netEstate <= 0) {
      return this.createInsolventEstatePlan(deceased, totalEstate, deductions);
    }

    // Step 2: Analyze family structure
    const legalAnalysis = this.familyTreeBuilder.analyzeLegalHeirs(familyTree);

    // Step 3: Determine intestacy scenario
    const scenario = this.determineIntestacyScenario(familyTree);

    // Step 4: Calculate distribution based on scenario
    const distribution = this.calculateDistributionByScenario(
      scenario,
      netEstate,
      legalAnalysis,
      familyTree,
    );

    // Step 5: Identify required actions
    const requiredActions = this.identifyRequiredActions(legalAnalysis, distribution);

    // Step 6: Generate warnings
    const warnings = this.generateWarnings(legalAnalysis, familyTree);

    return {
      totalEstate,
      netEstate,
      deductions,
      distribution,
      lawSection: this.getLawSectionForScenario(scenario),
      notes: this.generateDistributionNotes(scenario),
      warnings,
      requiredActions,
    };
  }

  /**
   * Calculates testate distribution (when there's a valid will)
   * with dependant provision adjustments
   */
  public calculateTestateDistribution(
    deceased: Deceased,
    will: Will,
    familyTree: FamilyTree,
    assets: Asset[],
    debts: Debt[],
  ): DistributionPlan {
    this.logger.log(`Calculating testate distribution for ${deceased.name}`);

    // Step 1: Calculate estate value
    const totalEstate = this.calculateTotalEstate(assets);
    const deductions = this.calculateDeductions(totalEstate, debts);
    const netEstate = totalEstate - deductions.totalDeductions;

    // Step 2: Parse will provisions
    const specificBequests = this.calculateSpecificBequests(
      will.beneficiaryAssignments,
      assets,
      netEstate,
    );

    // Step 3: Calculate residuary estate
    const totalSpecificBequests = Array.from(specificBequests.values()).reduce(
      (sum, share) => sum + share.shareAmount,
      0,
    );
    const residuaryEstate = netEstate - totalSpecificBequests;

    // Step 4: Distribute residuary estate
    const residuaryBeneficiaries = this.calculateResiduaryDistribution(
      will.beneficiaryAssignments,
      residuaryEstate,
    );

    // Step 5: Check dependant provision requirements (Section 26-29)
    const legalAnalysis = this.familyTreeBuilder.analyzeLegalHeirs(familyTree);
    const dependantAnalysis = this.analyzeDependantProvision(
      legalAnalysis.dependants,
      netEstate,
      specificBequests,
      residuaryBeneficiaries,
      will.disinheritances,
    );

    // Step 6: Adjust for inadequate provision
    let dependantProvisions = new Map<string, BeneficiaryShare>();
    if (dependantAnalysis.shortfall > 0) {
      dependantProvisions = this.calculateDependantProvisions(dependantAnalysis, netEstate);
    }

    const distribution: TestateDistribution = {
      specificBequests,
      residuaryBeneficiaries,
      dependantProvisions,
      unallocatedResidue: this.calculateUnallocatedResidue(
        residuaryEstate,
        residuaryBeneficiaries,
        dependantProvisions,
      ),
    };

    const requiredActions = this.identifyTestateRequiredActions(
      will,
      legalAnalysis,
      dependantAnalysis,
    );

    const warnings = this.generateTestateWarnings(will, dependantAnalysis);

    return {
      totalEstate,
      netEstate,
      deductions,
      distribution,
      lawSection: 'Testate Succession (Will-based)',
      notes: this.generateTestateNotes(will, dependantAnalysis),
      warnings,
      requiredActions,
    };
  }

  // ============================================================================
  // ESTATE VALUATION & DEDUCTIONS
  // ============================================================================

  /**
   * Calculates total estate value from all assets
   */
  private calculateTotalEstate(assets: Asset[]): number {
    return assets.reduce((total, asset) => {
      // Account for partial ownership
      const ownershipFactor = asset.ownershipShare ? asset.ownershipShare / 100 : 1;
      return total + asset.estimatedValue * ownershipFactor;
    }, 0);
  }

  /**
   * Calculates all deductions from the estate per Section 48
   * Priority: Funeral > Testamentary > Secured Debts > Unsecured Debts > Tax
   */
  private calculateDeductions(totalEstate: number, debts: Debt[]): DeductionBreakdown {
    const funeralCap = this.rules.debtSettlement.limits.reasonableFuneralExpenses;
    const adminCap = this.rules.debtSettlement.limits.administrativeExpenses;

    // Calculate funeral expenses (capped)
    const funeralDebts = debts.filter((d) => d.type === 'FUNERAL_EXPENSES');
    const funeralExpenses = Math.min(
      funeralDebts.reduce((sum, d) => sum + d.outstandingBalance, 0),
      funeralCap,
    );

    // Calculate administrative expenses
    const administrativeExpenses = totalEstate * adminCap;

    // Calculate testamentary expenses (grant of probate fees, legal fees)
    const testamentaryExpenses = totalEstate * 0.005; // 0.5% standard

    // Group debts by priority
    const debtsByPriority = this.groupDebtsByPriority(debts);

    // Calculate taxes (stamp duty on property transfers)
    const taxesAndDuties = this.calculateTaxLiabilities(totalEstate);

    const totalDeductions =
      funeralExpenses +
      testamentaryExpenses +
      administrativeExpenses +
      taxesAndDuties +
      Array.from(debtsByPriority.values()).reduce((sum, amount) => sum + amount, 0);

    return {
      funeralExpenses,
      testamentaryExpenses,
      debtsByPriority,
      taxesAndDuties,
      administrativeExpenses,
      totalDeductions,
    };
  }

  /**
   * Groups debts by legal priority order per Section 48
   */
  private groupDebtsByPriority(debts: Debt[]): Map<string, number> {
    const priorityOrder = this.rules.debtSettlement.priorityOrder;
    const grouped = new Map<string, number>();

    for (const priorityItem of priorityOrder) {
      const category = priorityItem.category;
      const priorityDebts = debts.filter((d) => d.type === category);
      const total = priorityDebts.reduce((sum, d) => sum + d.outstandingBalance, 0);
      if (total > 0) {
        grouped.set(category, total);
      }
    }

    return grouped;
  }

  /**
   * Calculates tax liabilities on the estate
   */
  private calculateTaxLiabilities(totalEstate: number): number {
    let totalTax = 0;

    // Capital Gains Tax (if applicable)
    if (this.rules.taxation.capitalGainsTax.applicable) {
      totalTax += totalEstate * this.rules.taxation.capitalGainsTax.rate;
    }

    // Stamp Duty (if applicable)
    if (this.rules.taxation.stampDuty.applicable) {
      totalTax += totalEstate * this.rules.taxation.stampDuty.rate;
    }

    return totalTax;
  }

  // ============================================================================
  // INTESTATE DISTRIBUTION CALCULATIONS
  // ============================================================================

  /**
   * Determines which intestacy scenario applies
   */
  private determineIntestacyScenario(tree: FamilyTree): IntestateDistribution['scenario'] {
    const deceased = tree.root;
    const activeSpouses = deceased.spouses.filter((s) => {
      const marriage = deceased.marriages.find((m) => m.spouseId === s.id);
      return marriage?.isActive && !s.isDeceased;
    });
    const livingChildren = deceased.children.filter((c) => !c.isDeceased);

    if (activeSpouses.length === 1 && livingChildren.length > 0) {
      return 'ONE_SPOUSE_WITH_CHILDREN';
    }

    if (activeSpouses.length > 1 && livingChildren.length > 0) {
      return 'MULTIPLE_SPOUSES_WITH_CHILDREN';
    }

    if (activeSpouses.length > 0 && livingChildren.length === 0) {
      return 'SPOUSE_ONLY';
    }

    if (activeSpouses.length === 0 && livingChildren.length > 0) {
      return 'CHILDREN_ONLY';
    }

    // Check for other relatives
    const hasRelatives = Array.from(tree.members.values()).some(
      (m) => m.isEligibleHeir && !m.isDeceased && m.id !== deceased.id,
    );

    if (hasRelatives) {
      return 'RELATIVES_ONLY';
    }

    return 'NO_HEIRS';
  }

  /**
   * Calculates distribution based on the identified scenario
   */
  private calculateDistributionByScenario(
    scenario: IntestateDistribution['scenario'],
    netEstate: number,
    legalAnalysis: any,
    tree: FamilyTree,
  ): IntestateDistribution {
    const beneficiaries = new Map<string, BeneficiaryShare>();

    switch (scenario) {
      case 'ONE_SPOUSE_WITH_CHILDREN':
        return this.calculateOneSpouseWithChildren(netEstate, tree);

      case 'MULTIPLE_SPOUSES_WITH_CHILDREN':
        return this.calculatePolygamousDistribution(netEstate, tree);

      case 'SPOUSE_ONLY':
        return this.calculateSpouseOnly(netEstate, tree);

      case 'CHILDREN_ONLY':
        return this.calculateChildrenOnly(netEstate, tree);

      case 'RELATIVES_ONLY':
        return this.calculateRelativesOnly(netEstate, tree);

      default:
        return {
          scenario: 'NO_HEIRS',
          beneficiaries,
        };
    }
  }

  /**
   * Section 38: One spouse with children
   * Spouse gets personal effects + life interest in remainder
   * Children get absolute interest after life interest
   */
  private calculateOneSpouseWithChildren(
    netEstate: number,
    tree: FamilyTree,
  ): IntestateDistribution {
    const deceased = tree.root;
    const spouse = deceased.spouses.find((s) => {
      const marriage = deceased.marriages.find((m) => m.spouseId === s.id);
      return marriage?.isActive && !s.isDeceased;
    })!;
    const children = deceased.children.filter((c) => !c.isDeceased);

    const beneficiaries = new Map<string, BeneficiaryShare>();

    // Spouse gets life interest in entire estate
    beneficiaries.set(spouse.id, {
      beneficiaryId: spouse.id,
      beneficiaryName: spouse.name,
      relationship: RelationshipType.SPOUSE,
      shareType: 'LIFE_INTEREST',
      sharePercent: 100,
      shareAmount: netEstate,
      priority: 1,
      conditions: ['Extinguishes upon death, remarriage, or cohabitation'],
    });

    // Children get absolute interest (after life interest)
    const perChildPercent = 100 / children.length;
    const perChildAmount = netEstate / children.length;

    children.forEach((child) => {
      beneficiaries.set(child.id, {
        beneficiaryId: child.id,
        beneficiaryName: child.name,
        relationship: child.relationship,
        shareType: child.isMinor ? 'TRUST' : 'ABSOLUTE',
        sharePercent: perChildPercent,
        shareAmount: perChildAmount,
        priority: 2,
        conditions: ["After spouse's life interest ends"],
        trustDetails: child.isMinor
          ? {
              trusteeName: 'Court-appointed trustee',
              purpose: 'Hold until age of majority',
              validUntil: this.calculateAgeOfMajorityDate(child),
              releaseConditions: ['Reaching age 18', 'Marriage', 'Court order'],
            }
          : undefined,
      });
    });

    const lifeInterests: LifeInterest[] = [
      {
        beneficiaryId: spouse.id,
        beneficiaryName: spouse.name,
        assetIds: [], // All estate assets
        estimatedValue: netEstate,
        remaindermen: children.map((c) => c.id),
        conditions: [
          'Life interest extinguishes on death',
          'Life interest extinguishes on remarriage',
          'Life interest extinguishes on cohabitation as if married',
        ],
      },
    ];

    return {
      scenario: 'ONE_SPOUSE_WITH_CHILDREN',
      beneficiaries,
      lifeInterests,
    };
  }

  /**
   * Section 40: Multiple spouses with children (Polygamous distribution)
   * Uses unit system: 1 wife + her children = 1 unit
   */
  private calculatePolygamousDistribution(
    netEstate: number,
    tree: FamilyTree,
  ): IntestateDistribution {
    const polygamousUnits = this.familyTreeBuilder.identifyPolygamousUnits(tree);

    // Calculate total units
    const totalUnits = polygamousUnits.reduce((sum, unit) => sum + unit.unitSize, 0);
    const valuePerUnit = netEstate / totalUnits;

    const beneficiaries = new Map<string, BeneficiaryShare>();
    const unitDistributions: PolygamousUnitDistribution[] = [];

    polygamousUnits.forEach((unit, index) => {
      const unitShare = (unit.unitSize / totalUnits) * 100;

      // Each member of the unit gets 1 unit worth
      const perMemberAmount = valuePerUnit;
      const perMemberPercent = (1 / totalUnits) * 100;

      // Spouse share
      beneficiaries.set(unit.spouseId, {
        beneficiaryId: unit.spouseId,
        beneficiaryName: unit.spouseName,
        relationship: RelationshipType.SPOUSE,
        shareType: 'ABSOLUTE',
        sharePercent: perMemberPercent,
        shareAmount: perMemberAmount,
        priority: 1,
      });

      // Children shares

      unit.childrenIds.forEach((childId) => {
        const child = tree.members.get(childId)!;
        beneficiaries.set(childId, {
          beneficiaryId: childId,
          beneficiaryName: child.name,
          relationship: child.relationship,
          shareType: child.isMinor ? 'TRUST' : 'ABSOLUTE',
          sharePercent: perMemberPercent,
          shareAmount: perMemberAmount,
          priority: 1,
          trustDetails: child.isMinor
            ? {
                trusteeName: unit.spouseName + ' (Mother) or Court-appointed',
                purpose: 'Hold until age of majority',
                validUntil: this.calculateAgeOfMajorityDate(child),
                releaseConditions: ['Reaching age 18', 'Marriage', 'Court order'],
              }
            : undefined,
        });
      });

      unitDistributions.push({
        unitNumber: index + 1,
        spouseId: unit.spouseId,
        spouseName: unit.spouseName,
        childrenIds: unit.childrenIds,
        unitSize: unit.unitSize,
        unitShare,
        spouseAmount: perMemberAmount,
        childrenTotalAmount: unit.childrenIds.length * perMemberAmount,
        perChildAmount: perMemberAmount,
      });
    });

    return {
      scenario: 'MULTIPLE_SPOUSES_WITH_CHILDREN',
      beneficiaries,
      polygamousUnits: unitDistributions,
    };
  }

  /**
   * Section 39: Spouse only, no children
   * Entire estate to spouse(s) absolutely
   */
  private calculateSpouseOnly(netEstate: number, tree: FamilyTree): IntestateDistribution {
    const deceased = tree.root;
    const activeSpouses = deceased.spouses.filter((s) => {
      const marriage = deceased.marriages.find((m) => m.spouseId === s.id);
      return marriage?.isActive && !s.isDeceased;
    });

    const beneficiaries = new Map<string, BeneficiaryShare>();
    const perSpousePercent = 100 / activeSpouses.length;
    const perSpouseAmount = netEstate / activeSpouses.length;

    activeSpouses.forEach((spouse) => {
      beneficiaries.set(spouse.id, {
        beneficiaryId: spouse.id,
        beneficiaryName: spouse.name,
        relationship: RelationshipType.SPOUSE,
        shareType: 'ABSOLUTE',
        sharePercent: perSpousePercent,
        shareAmount: perSpouseAmount,
        priority: 1,
      });
    });

    return {
      scenario: 'SPOUSE_ONLY',
      beneficiaries,
    };
  }

  /**
   * Children only (no surviving spouse)
   * Estate divided equally among children
   */
  private calculateChildrenOnly(netEstate: number, tree: FamilyTree): IntestateDistribution {
    const deceased = tree.root;
    const children = deceased.children.filter((c) => !c.isDeceased);

    const beneficiaries = new Map<string, BeneficiaryShare>();
    const perChildPercent = 100 / children.length;
    const perChildAmount = netEstate / children.length;

    children.forEach((child) => {
      beneficiaries.set(child.id, {
        beneficiaryId: child.id,
        beneficiaryName: child.name,
        relationship: child.relationship,
        shareType: child.isMinor ? 'TRUST' : 'ABSOLUTE',
        sharePercent: perChildPercent,
        shareAmount: perChildAmount,
        priority: 1,
        trustDetails: child.isMinor
          ? {
              trusteeName: 'Court-appointed trustee',
              purpose: 'Hold until age of majority',
              validUntil: this.calculateAgeOfMajorityDate(child),
              releaseConditions: ['Reaching age 18', 'Marriage', 'Court order'],
            }
          : undefined,
      });
    });

    return {
      scenario: 'CHILDREN_ONLY',
      beneficiaries,
    };
  }

  /**
   * Section 41: No spouse, no children - distribution to relatives
   * Priority: Parents > Siblings > Grandparents > Aunts/Uncles > Cousins
   */
  private calculateRelativesOnly(netEstate: number, tree: FamilyTree): IntestateDistribution {
    const deceased = tree.root;
    const orderOfPriority = this.rules.intestateSuccession.relativesOnly.orderOfSuccession;
    const beneficiaries = new Map<string, BeneficiaryShare>();

    for (const priorityLevel of orderOfPriority) {
      let eligibleRelatives: FamilyTreeNode[] = [];

      switch (priorityLevel) {
        case 'PARENTS':
          eligibleRelatives = deceased.parents.filter((p) => !p.isDeceased);
          break;
        case 'SIBLINGS_FULL': // ✅ Use SIBLINGS_FULL instead of BROTHERS_AND_SISTERS
          eligibleRelatives = deceased.siblings.filter((s) => !s.isDeceased);
          break;
        case 'HALF_SIBLINGS': // ✅ Add missing case
          eligibleRelatives = this.findHalfSiblings(deceased);
          break;
        case 'GRANDPARENTS':
          eligibleRelatives = Array.from(tree.members.values()).filter(
            (m) => m.relationship === RelationshipType.GRANDPARENT && !m.isDeceased,
          );
          break;
        case 'UNCLES_AUNTS': // ✅ Use UNCLES_AUNTS instead of AUNTS_AND_UNCLES
          eligibleRelatives = Array.from(tree.members.values()).filter(
            (m) => m.relationship === RelationshipType.AUNT_UNCLE && !m.isDeceased,
          );
          break;
        case 'COUSINS':
          eligibleRelatives = Array.from(tree.members.values()).filter(
            (m) => m.relationship === RelationshipType.COUSIN && !m.isDeceased,
          );
          break;
        case 'STATE': // ✅ Add missing case
          // No relatives - estate goes to state
          break;
      }

      if (eligibleRelatives.length > 0) {
        const perPersonPercent = 100 / eligibleRelatives.length;
        const perPersonAmount = netEstate / eligibleRelatives.length;

        eligibleRelatives.forEach((relative) => {
          beneficiaries.set(relative.id, {
            beneficiaryId: relative.id,
            beneficiaryName: relative.name,
            relationship: relative.relationship,
            shareType: 'ABSOLUTE',
            sharePercent: perPersonPercent,
            shareAmount: perPersonAmount,
            priority: 1,
          });
        });

        break; // Stop at first non-empty priority level
      }
    }

    return {
      scenario: 'RELATIVES_ONLY',
      beneficiaries,
    };
  }

  // ============================================================================
  // TESTATE DISTRIBUTION CALCULATIONS
  // ============================================================================

  /**
   * Calculates specific bequests from will provisions
   */
  private calculateSpecificBequests(
    assignments: BeneficiaryAssignment[],
    assets: Asset[],
    netEstate: number,
  ): Map<string, BeneficiaryShare> {
    const specificBequests = new Map<string, BeneficiaryShare>();

    const specificAssignments = assignments.filter(
      (a) => a.bequestType === 'SPECIFIC' && a.assetId,
    );

    for (const assignment of specificAssignments) {
      const asset = assets.find((a) => a.id === assignment.assetId);
      if (!asset) continue;

      const amount = assignment.specificAmount || asset.estimatedValue;
      const percent = (amount / netEstate) * 100;

      // Get or create share for this beneficiary
      const existing = specificBequests.get(assignment.beneficiaryId);
      if (existing) {
        existing.shareAmount += amount;
        existing.sharePercent += percent;
      } else {
        specificBequests.set(assignment.beneficiaryId, {
          beneficiaryId: assignment.beneficiaryId,
          beneficiaryName: '', // Will be filled by caller
          relationship: RelationshipType.OTHER, // Will be filled by caller
          shareType: assignment.hasCondition ? 'CONDITIONAL' : 'ABSOLUTE',
          sharePercent: percent,
          shareAmount: amount,
          priority: 1,
          conditions: assignment.hasCondition ? [assignment.conditionDetails!] : undefined,
        });
      }
    }

    return specificBequests;
  }

  /**
   * Calculates residuary distribution
   */
  private calculateResiduaryDistribution(
    assignments: BeneficiaryAssignment[],
    residuaryEstate: number,
  ): Map<string, BeneficiaryShare> {
    const residuaryBeneficiaries = new Map<string, BeneficiaryShare>();

    const residuaryAssignments = assignments.filter(
      (a) => a.bequestType === 'RESIDUARY' || a.bequestType === 'PERCENTAGE',
    );

    if (residuaryAssignments.length === 0) {
      return residuaryBeneficiaries;
    }

    const totalPercent = residuaryAssignments.reduce((sum, a) => sum + a.sharePercent, 0);

    for (const assignment of residuaryAssignments) {
      const normalizedPercent = (assignment.sharePercent / totalPercent) * 100;
      const amount = (normalizedPercent / 100) * residuaryEstate;

      residuaryBeneficiaries.set(assignment.beneficiaryId, {
        beneficiaryId: assignment.beneficiaryId,
        beneficiaryName: '', // Will be filled by caller
        relationship: RelationshipType.OTHER,
        shareType: assignment.hasCondition ? 'CONDITIONAL' : 'ABSOLUTE',
        sharePercent: normalizedPercent,
        shareAmount: amount,
        priority: 2,
        conditions: assignment.hasCondition ? [assignment.conditionDetails!] : undefined,
      });
    }

    return residuaryBeneficiaries;
  }

  /**
   * Calculates unallocated residue
   */
  private calculateUnallocatedResidue(
    residuaryEstate: number,
    residuaryBeneficiaries: Map<string, BeneficiaryShare>,
    dependantProvisions: Map<string, BeneficiaryShare>,
  ): number {
    const allocated =
      Array.from(residuaryBeneficiaries.values()).reduce((sum, s) => sum + s.shareAmount, 0) +
      Array.from(dependantProvisions.values()).reduce((sum, s) => sum + s.shareAmount, 0);

    return Math.max(0, residuaryEstate - allocated);
  }

  // ============================================================================
  // DEPENDANT PROVISION ANALYSIS (Sections 26-29)
  // ============================================================================

  /**
   * Analyzes whether dependants have received reasonable provision
   */
  private analyzeDependantProvision(
    dependants: FamilyTreeNode[],
    netEstate: number,
    specificBequests: Map<string, BeneficiaryShare>,
    residuaryBeneficiaries: Map<string, BeneficiaryShare>,
    disinheritances: string[],
  ): DependantProvisionAnalysis {
    const requiredProvisions = new Map<string, number>();
    const recommendations: string[] = [];
    const legalGrounds: string[] = [];

    const minDependantShare = this.rules.assetDistribution.beneficiaryRules.dependantMinimumShare;

    for (const dependant of dependants) {
      // Skip if disinherited
      if (disinheritances.includes(dependant.id)) continue;

      // Calculate what they've received
      const specificShare = specificBequests.get(dependant.id);
      const residuaryShare = residuaryBeneficiaries.get(dependant.id);
      const totalReceived = (specificShare?.shareAmount || 0) + (residuaryShare?.shareAmount || 0);

      // Calculate minimum required provision
      let minimumRequired = netEstate * minDependantShare;

      // Adjust based on dependant's circumstances
      if (dependant.isMinor) {
        minimumRequired *= 1.2; // 20% increase for minors
      }

      // Check if needs are met
      if (totalReceived < minimumRequired) {
        const shortfall = minimumRequired - totalReceived;
        requiredProvisions.set(dependant.id, shortfall);

        recommendations.push(
          `${dependant.name} requires additional provision of ${this.formatCurrency(shortfall)}`,
        );

        legalGrounds.push(
          `Section 26-29: Inadequate provision for ${dependant.relationship.toLowerCase()} ${dependant.name}`,
        );
      }
    }

    const totalShortfall = Array.from(requiredProvisions.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return {
      requiredProvisions,
      shortfall: totalShortfall,
      recommendations,
      legalGrounds,
    };
  }

  /**
   * Calculates court-ordered dependant provisions
   */
  private calculateDependantProvisions(
    analysis: DependantProvisionAnalysis,
    netEstate: number,
  ): Map<string, BeneficiaryShare> {
    const provisions = new Map<string, BeneficiaryShare>();

    for (const [dependantId, amount] of analysis.requiredProvisions.entries()) {
      const percent = (amount / netEstate) * 100;

      provisions.set(dependantId, {
        beneficiaryId: dependantId,
        beneficiaryName: '', // Will be filled by caller
        relationship: RelationshipType.OTHER,
        shareType: 'ABSOLUTE',
        sharePercent: percent,
        shareAmount: amount,
        priority: 0, // Highest priority (court-ordered)
        conditions: ['Court-ordered reasonable provision per Section 26'],
      });
    }

    return provisions;
  }

  // ============================================================================
  // UTILITY & HELPER METHODS
  // ============================================================================

  /**
   * Calculates date when minor reaches age of majority
   */
  private calculateAgeOfMajorityDate(person: FamilyTreeNode): Date | undefined {
    if (!person.dateOfBirth) return undefined;

    const ageOfMajority = this.rules.assetDistribution.minorProtection.ageOfMajority;
    const majorityDate = new Date(person.dateOfBirth);
    majorityDate.setFullYear(majorityDate.getFullYear() + ageOfMajority);

    return majorityDate;
  }

  /**
   * Creates distribution plan for insolvent estate
   */
  private createInsolventEstatePlan(
    deceased: Deceased,
    totalEstate: number,
    deductions: DeductionBreakdown,
  ): DistributionPlan {
    const beneficiaries = new Map<string, BeneficiaryShare>();

    return {
      totalEstate,
      netEstate: 0,
      deductions,
      distribution: {
        scenario: 'NO_HEIRS',
        beneficiaries,
      },
      lawSection: 'Insolvent Estate',
      notes: [
        'Estate is insolvent - debts exceed assets',
        'Creditors will be paid pro rata according to priority',
        'No distribution to beneficiaries possible',
      ],
      warnings: [
        'CRITICAL: Estate cannot pay all debts',
        'Beneficiaries will receive nothing',
        'Consider debt settlement negotiations',
      ],
      requiredActions: [
        {
          action: 'File for insolvency proceedings',
          reason: 'Estate debts exceed assets',
          legalBasis: 'Law of Succession Act - Insolvent Estate Provisions',
          priority: 'CRITICAL',
        },
      ],
    };
  }

  /**
   * Identifies required legal actions based on distribution
   */
  private identifyRequiredActions(
    legalAnalysis: LegalHeirAnalysis, // ✅ Use proper type instead of 'any'
    distribution: IntestateDistribution,
  ): RequiredAction[] {
    const actions: RequiredAction[] = [];

    // Guardian appointments for minors - ✅ Now type-safe
    if (legalAnalysis.minorsRequiringGuardians.length > 0) {
      actions.push({
        action: `Appoint guardians for ${legalAnalysis.minorsRequiringGuardians.length} minor beneficiaries`,
        reason: 'Minors cannot receive inheritance directly',
        legalBasis: 'Section 56-58: Guardian Appointment Requirements',
        priority: 'CRITICAL',
        deadline: this.calculateDeadline(90),
      });
    }

    // Trust creation for conditional bequests
    const conditionalBeneficiaries = Array.from(distribution.beneficiaries.values()).filter(
      (b) => b.shareType === 'TRUST' || b.shareType === 'CONDITIONAL',
    );

    if (conditionalBeneficiaries.length > 0) {
      actions.push({
        action: 'Establish testamentary trusts',
        reason: `${conditionalBeneficiaries.length} beneficiaries require trust arrangements`,
        legalBasis: 'Section 60: Trust Administration',
        priority: 'HIGH',
        deadline: this.calculateDeadline(120),
      });
    }

    // Life interest registration
    if (distribution.lifeInterests && distribution.lifeInterests.length > 0) {
      actions.push({
        action: 'Register life interest with Land Registry',
        reason: 'Life interest must be legally recorded',
        legalBasis: 'Land Registration Act',
        priority: 'HIGH',
        deadline: this.calculateDeadline(60),
      });
    }

    // Grant of probate/letters of administration
    actions.push({
      action: 'Apply for Grant of Representation',
      reason: 'Required to legally administer estate',
      legalBasis: 'Section 51-52: Probate Application',
      priority: 'CRITICAL',
      deadline: this.calculateDeadline(this.rules.probateProcess.applicationDeadline),
    });

    // Asset inventory - ✅ Use correct property
    actions.push({
      action: 'Submit complete estate inventory to court',
      reason: 'Legal requirement for estate administration',
      legalBasis: 'Section 83: Executor Duties',
      priority: 'HIGH',
      deadline: this.calculateDeadline(this.rules.assetDistribution.timelines.inventorySubmission),
    });

    return actions;
  }

  /**
   * Identifies required actions for testate succession
   */
  private identifyTestateRequiredActions(
    will: Will,
    legalAnalysis: LegalHeirAnalysis,
    dependantAnalysis: DependantProvisionAnalysis,
  ): RequiredAction[] {
    const actions: RequiredAction[] = [];

    // Base actions
    actions.push(
      ...this.identifyRequiredActions(legalAnalysis, {
        scenario: 'CHILDREN_ONLY',
        beneficiaries: new Map(),
      }),
    );

    // Will-specific actions
    if (dependantAnalysis.shortfall > 0) {
      actions.push({
        action: 'File application for dependant provision',
        reason: 'Will provides inadequate provision for dependants',
        legalBasis: 'Section 26-29: Dependant Provision',
        priority: 'CRITICAL',
        deadline: this.calculateDeadline(365),
      });
    }

    // Executor appointment confirmation
    actions.push({
      action: 'Confirm executor appointments',
      reason: 'Executors must accept or decline appointment',
      legalBasis: 'Section 54: Executor Acceptance',
      priority: 'HIGH',
      deadline: this.calculateDeadline(30),
    });

    return actions;
  }

  /**
   * Generates warnings based on legal analysis
   */
  private generateWarnings(
    legalAnalysis: LegalHeirAnalysis, // ✅ Fix type from 'any' to 'LegalHeirAnalysis'
    tree: FamilyTree,
  ): string[] {
    const warnings: string[] = [];

    // Polygamy warning
    if (tree.isPolygamous) {
      warnings.push('POLYGAMOUS FAMILY: Distribution follows Section 40 unit-based calculation');
    }

    // Minor warnings - ✅ Now type-safe access
    if (legalAnalysis.minorsRequiringGuardians.length > 0) {
      warnings.push(
        `${legalAnalysis.minorsRequiringGuardians.length} minor beneficiaries require court-appointed guardians and trust arrangements`,
      );
    }

    // Life interest warnings
    const hasLifeInterest = Array.from(tree.members.values()).some(
      (m) => m.relationship === RelationshipType.SPOUSE && !m.isDeceased,
    );

    if (hasLifeInterest && tree.root.children.length > 0) {
      warnings.push(
        'Life interest in favor of spouse - children receive absolute interest only after life interest ends',
      );
    }

    // ✅ Additional warnings for better legal compliance
    if (legalAnalysis.polygamousUnits && legalAnalysis.polygamousUnits.length > 0) {
      warnings.push(
        `Polygamous family structure detected: ${legalAnalysis.polygamousUnits.length} marital units identified`,
      );
    }

    // Warning for dependants without adequate provision
    if (legalAnalysis.dependants.length > 0) {
      const dependantsWithoutProvision = legalAnalysis.dependants.filter(
        (dependant: FamilyTreeNode) => !dependant.isEligibleHeir && !dependant.isDisinherited,
      );

      if (dependantsWithoutProvision.length > 0) {
        warnings.push(
          `${dependantsWithoutProvision.length} legal dependants identified who may require court provision`,
        );
      }
    }

    // Warning for complex family structures
    if (tree.members.size > 10) {
      warnings.push(
        'Large family structure detected - consider professional legal advice for complex distribution',
      );
    }

    return warnings;
  }

  /**
   * Generates warnings for testate succession
   */
  private generateTestateWarnings(
    will: Will,
    dependantAnalysis: DependantProvisionAnalysis,
  ): string[] {
    const warnings: string[] = [];

    // Dependant provision warnings
    if (dependantAnalysis.shortfall > 0) {
      warnings.push(`INSUFFICIENT DEPENDANT PROVISION: Will may be challenged under Section 26-29`);
      warnings.push(`Total shortfall: ${this.formatCurrency(dependantAnalysis.shortfall)}`);
    }

    // Disinheritance warnings
    if (will.disinheritances.length > 0) {
      warnings.push(
        `${will.disinheritances.length} person(s) explicitly disinherited - ensure legal justification documented`,
      );
    }

    return warnings;
  }

  /**
   * Generates distribution notes based on scenario
   */
  private generateDistributionNotes(scenario: IntestateDistribution['scenario']): string[] {
    const notes: string[] = [];

    switch (scenario) {
      case 'ONE_SPOUSE_WITH_CHILDREN':
        notes.push('Distribution follows Section 38 (One Spouse with Children)');
        notes.push('Surviving spouse receives personal effects and life interest in remainder');
        notes.push('Children receive absolute interest after life interest ends');
        notes.push('Life interest extinguishes on death, remarriage, or cohabitation');
        break;

      case 'MULTIPLE_SPOUSES_WITH_CHILDREN':
        notes.push('Distribution follows Section 40 (Polygamous Families)');
        notes.push('Estate divided into units: 1 wife + her children = 1 unit');
        notes.push('Each person in a unit receives equal share of that unit');
        notes.push('Calculation method ensures fair distribution across households');
        break;

      case 'SPOUSE_ONLY':
        notes.push('Distribution follows Section 39 (Spouse Only, No Children)');
        notes.push('Surviving spouse(s) inherit entire estate absolutely');
        notes.push('If multiple spouses, estate divided equally among them');
        break;

      case 'CHILDREN_ONLY':
        notes.push('Distribution to children only (no surviving spouse)');
        notes.push('Estate divided equally among all children');
        notes.push('Per stirpes distribution applies if any child is deceased');
        break;

      case 'RELATIVES_ONLY':
        notes.push('Distribution follows Section 41 (No Spouse, No Children)');
        notes.push('Priority order: Parents > Siblings > Grandparents > Aunts/Uncles > Cousins');
        notes.push('Distribution to first available priority level only');
        notes.push('Equal division within the priority class');
        break;

      case 'NO_HEIRS':
        notes.push('No eligible heirs identified');
        notes.push('Estate becomes bona vacantia (ownerless property)');
        notes.push('Estate passes to the government');
        break;
    }

    // Add common notes
    notes.push('');
    notes.push('All distributions subject to debt payment and funeral expenses');
    notes.push('Grant of Representation required before distribution');
    notes.push(
      `Application deadline: ${this.rules.probateProcess.applicationDeadline} days from death`,
    );

    return notes;
  }

  /**
   * Generates notes for testate succession
   */
  private generateTestateNotes(
    will: Will,
    dependantAnalysis: DependantProvisionAnalysis,
  ): string[] {
    const notes: string[] = [];

    notes.push('Distribution based on valid testamentary will');
    notes.push('Specific bequests take priority over residuary distribution');
    notes.push('All distributions subject to debt payment');

    if (dependantAnalysis.shortfall > 0) {
      notes.push('');
      notes.push('DEPENDANT PROVISION ADJUSTMENT REQUIRED:');
      notes.push(...dependantAnalysis.recommendations);
      notes.push('Court may vary will provisions to ensure reasonable provision');
    }

    if (will.residuaryClause) {
      notes.push('');
      notes.push('Residuary clause: ' + will.residuaryClause);
    }

    return notes;
  }

  /**
   * Gets the Law of Succession Act section for a scenario
   */
  private getLawSectionForScenario(scenario: IntestateDistribution['scenario']): string {
    const sections = {
      ONE_SPOUSE_WITH_CHILDREN: 'Section 38',
      MULTIPLE_SPOUSES_WITH_CHILDREN: 'Section 40',
      SPOUSE_ONLY: 'Section 39',
      CHILDREN_ONLY: 'Section 38 (modified)',
      RELATIVES_ONLY: 'Section 41',
      NO_HEIRS: 'Bona Vacantia',
    };

    return sections[scenario] || 'Unknown';
  }

  /**
   * Calculates deadline date from today
   */
  private calculateDeadline(days: number): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);
    return deadline;
  }

  /**
   * Formats currency amount
   */
  private formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // ============================================================================
  // REPORT GENERATION
  // ============================================================================

  /**
   * Generates comprehensive distribution report
   */
  public generateDistributionReport(plan: DistributionPlan): string {
    let report = '='.repeat(80) + '\n';
    report += 'KENYAN SUCCESSION DISTRIBUTION REPORT\n';
    report += 'Law of Succession Act (Cap 160)\n';
    report += '='.repeat(80) + '\n\n';

    // Estate Summary
    report += '--- ESTATE SUMMARY ---\n';
    report += `Total Estate Value: ${this.formatCurrency(plan.totalEstate)}\n`;
    report += `Total Deductions: ${this.formatCurrency(plan.deductions.totalDeductions)}\n`;
    report += `Net Estate for Distribution: ${this.formatCurrency(plan.netEstate)}\n\n`;

    // Deductions Breakdown
    report += '--- DEDUCTIONS BREAKDOWN ---\n';
    report += `Funeral Expenses: ${this.formatCurrency(plan.deductions.funeralExpenses)}\n`;
    report += `Testamentary Expenses: ${this.formatCurrency(plan.deductions.testamentaryExpenses)}\n`;
    report += `Administrative Expenses: ${this.formatCurrency(plan.deductions.administrativeExpenses)}\n`;
    report += `Taxes and Duties: ${this.formatCurrency(plan.deductions.taxesAndDuties)}\n`;

    if (plan.deductions.debtsByPriority.size > 0) {
      report += `Debts by Priority:\n`;
      plan.deductions.debtsByPriority.forEach((amount, priority) => {
        report += `  - ${priority}: ${this.formatCurrency(amount)}\n`;
      });
    }
    report += '\n';

    // Distribution
    report += `--- DISTRIBUTION (${plan.lawSection}) ---\n`;

    if ('scenario' in plan.distribution) {
      const intestate = plan.distribution;
      report += `Scenario: ${intestate.scenario}\n\n`;

      report += 'Beneficiaries:\n';
      Array.from(intestate.beneficiaries.values())
        .sort((a, b) => a.priority - b.priority)
        .forEach((beneficiary) => {
          report += `\n${beneficiary.beneficiaryName}\n`;
          report += `  Relationship: ${beneficiary.relationship}\n`;
          report += `  Share Type: ${beneficiary.shareType}\n`;
          report += `  Share: ${beneficiary.sharePercent.toFixed(2)}% (${this.formatCurrency(beneficiary.shareAmount)})\n`;
          if (beneficiary.conditions) {
            report += `  Conditions:\n`;
            beneficiary.conditions.forEach((c) => (report += `    - ${c}\n`));
          }
          if (beneficiary.trustDetails) {
            report += `  Trust Details:\n`;
            report += `    Trustee: ${beneficiary.trustDetails.trusteeName}\n`;
            report += `    Purpose: ${beneficiary.trustDetails.purpose}\n`;
            if (beneficiary.trustDetails.validUntil) {
              report += `    Valid Until: ${beneficiary.trustDetails.validUntil.toDateString()}\n`;
            }
          }
        });

      // Polygamous units
      if (intestate.polygamousUnits) {
        report += '\n--- POLYGAMOUS UNIT BREAKDOWN ---\n';
        intestate.polygamousUnits.forEach((unit) => {
          report += `\nUnit ${unit.unitNumber}: ${unit.spouseName}\n`;
          report += `  Unit Size: ${unit.unitSize} (1 wife + ${unit.childrenIds.length} children)\n`;
          report += `  Unit Share: ${unit.unitShare.toFixed(2)}%\n`;
          report += `  Spouse Amount: ${this.formatCurrency(unit.spouseAmount)}\n`;
          report += `  Children Total: ${this.formatCurrency(unit.childrenTotalAmount)}\n`;
          report += `  Per Child: ${this.formatCurrency(unit.perChildAmount)}\n`;
        });
      }

      // Life interests
      if (intestate.lifeInterests) {
        report += '\n--- LIFE INTERESTS ---\n';
        intestate.lifeInterests.forEach((li) => {
          report += `\n${li.beneficiaryName}\n`;
          report += `  Estimated Value: ${this.formatCurrency(li.estimatedValue)}\n`;
          report += `  Conditions:\n`;
          li.conditions.forEach((c) => (report += `    - ${c}\n`));
        });
      }
    } else {
      const testate = plan.distribution;

      report += 'Specific Bequests:\n';
      testate.specificBequests.forEach((bequest) => {
        report += `  ${bequest.beneficiaryName}: ${this.formatCurrency(bequest.shareAmount)}\n`;
      });

      report += '\nResiduary Beneficiaries:\n';
      testate.residuaryBeneficiaries.forEach((beneficiary) => {
        report += `  ${beneficiary.beneficiaryName}: ${beneficiary.sharePercent.toFixed(2)}% (${this.formatCurrency(beneficiary.shareAmount)})\n`;
      });

      if (testate.dependantProvisions.size > 0) {
        report += '\nCourt-Ordered Dependant Provisions:\n';
        testate.dependantProvisions.forEach((provision) => {
          report += `  ${provision.beneficiaryName}: ${this.formatCurrency(provision.shareAmount)}\n`;
        });
      }

      if (testate.unallocatedResidue > 0) {
        report += `\nUnallocated Residue: ${this.formatCurrency(testate.unallocatedResidue)}\n`;
      }
    }

    // Notes
    if (plan.notes.length > 0) {
      report += '\n--- NOTES ---\n';
      plan.notes.forEach((note) => (report += `${note}\n`));
    }

    // Warnings
    if (plan.warnings.length > 0) {
      report += '\n--- WARNINGS ---\n';
      plan.warnings.forEach((warning) => (report += `⚠️  ${warning}\n`));
    }

    // Required Actions
    if (plan.requiredActions.length > 0) {
      report += '\n--- REQUIRED ACTIONS ---\n';
      plan.requiredActions
        .sort((a, b) => {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .forEach((action) => {
          report += `\n[${action.priority}] ${action.action}\n`;
          report += `  Reason: ${action.reason}\n`;
          report += `  Legal Basis: ${action.legalBasis}\n`;
          if (action.deadline) {
            report += `  Deadline: ${action.deadline.toDateString()}\n`;
          }
        });
    }

    report += '\n' + '='.repeat(80) + '\n';
    report += 'Report Generated: ' + new Date().toISOString() + '\n';
    report += '='.repeat(80) + '\n';

    return report;
  }

  /**
   * Exports distribution plan to JSON
   */
  public exportDistributionToJson(plan: DistributionPlan): string {
    const exportData: ExportData = {
      totalEstate: plan.totalEstate,
      netEstate: plan.netEstate,
      deductions: {
        funeralExpenses: plan.deductions.funeralExpenses,
        testamentaryExpenses: plan.deductions.testamentaryExpenses,
        administrativeExpenses: plan.deductions.administrativeExpenses,
        taxesAndDuties: plan.deductions.taxesAndDuties,
        debtsByPriority: Array.from(plan.deductions.debtsByPriority.entries()),
        totalDeductions: plan.deductions.totalDeductions,
      },
      distribution: this.serializeDistribution(plan.distribution), // ✅ Now properly typed
      lawSection: plan.lawSection,
      notes: plan.notes,
      warnings: plan.warnings,
      requiredActions: plan.requiredActions,
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Serializes distribution for JSON export
   */
  private serializeDistribution(
    distribution: IntestateDistribution | TestateDistribution,
  ): SerializedDistribution {
    if ('scenario' in distribution) {
      const intestateDist: SerializedIntestateDistribution = {
        type: 'intestate',
        scenario: distribution.scenario,
        beneficiaries: Array.from(distribution.beneficiaries.entries()),
        polygamousUnits: distribution.polygamousUnits,
        lifeInterests: distribution.lifeInterests,
      };
      return intestateDist;
    } else {
      const testateDist: SerializedTestateDistribution = {
        type: 'testate',
        specificBequests: Array.from(distribution.specificBequests.entries()),
        residuaryBeneficiaries: Array.from(distribution.residuaryBeneficiaries.entries()),
        dependantProvisions: Array.from(distribution.dependantProvisions.entries()),
        unallocatedResidue: distribution.unallocatedResidue,
      };
      return testateDist;
    }
  }
  private findHalfSiblings(deceased: FamilyTreeNode): FamilyTreeNode[] {
    // Find siblings who share only one parent
    return deceased.siblings
      .filter((sibling) => {
        const sharedParents = deceased.parents.filter((parent) =>
          sibling.parents.some((siblingParent) => siblingParent.id === parent.id),
        );
        return sharedParents.length === 1; // Half-siblings share exactly one parent
      })
      .filter((s) => !s.isDeceased);
  }
}
