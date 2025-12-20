import { ValueObject } from '../../../base/value-object';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';

export enum S35EstateCategory {
  PERSONAL_CHATTELS = 'PERSONAL_CHATTELS',
  LIFE_INTEREST_PROPERTY = 'LIFE_INTEREST_PROPERTY',
  RESIDUARY_ESTATE = 'RESIDUARY_ESTATE',
}

export enum S35BeneficiaryType {
  SURVIVING_SPOUSE = 'SURVIVING_SPOUSE',
  CHILD = 'CHILD',
  CHILD_OF_DECEASED_CHILD = 'CHILD_OF_DECEASED_CHILD',
  OTHER_DEPENDANT = 'OTHER_DEPENDANT',
}

export interface S35BeneficiaryShare {
  beneficiaryId: string;
  beneficiaryType: S35BeneficiaryType;
  relationship: string;

  // Share Calculations
  shareOfPersonalChattels?: Money;
  shareOfLifeInterest?: {
    propertyId: string;
    lifeInterestValue: Money;
    endsAt: Date;
    condition?: string;
  };
  shareOfResiduaryEstate?: Money;

  // Legal Provisions
  isMinor: boolean;
  isDependant: boolean;
  requiresGuardian: boolean;
  guardianId?: string;

  // Hotchpot Adjustment (S.35(3))
  hotchpotAdjustment?: Money;
  hotchpotAdjusted: boolean;

  // Special Circumstances
  hasPhysicalDisability: boolean;
  hasMentalDisability: boolean;
  requiresSpecialProvision: boolean;
}

export interface S35CalculationInput {
  // Estate Information
  netEstateValue: Money;
  personalChattelsValue: Money;
  matrimonialHomeValue?: Money;

  // Beneficiary Information
  survivingSpouseId?: string;
  survivingSpouseName?: string;
  spouseMarriageDate?: Date;
  isPolygamousSpouse: boolean;

  children: Array<{
    childId: string;
    name: string;
    age: number;
    isMinor: boolean;
    isDeceased: boolean;
    hasChildren: boolean; // For representation under S.35(5)
    disabilityStatus?: 'NONE' | 'PHYSICAL' | 'MENTAL' | 'BOTH';
  }>;

  // Dependants (S.29)
  otherDependants: Array<{
    dependantId: string;
    name: string;
    relationship: string;
    dependencyLevel: 'NONE' | 'PARTIAL' | 'FULL';
  }>;

  // Hotchpot Data (S.35(3))
  lifetimeGifts: Array<{
    recipientId: string;
    giftValue: Money;
    giftDate: Date;
    isAdvancement: boolean;
  }>;

  // Special Circumstances
  spouseDisabled: boolean;
  spouseAge?: number;
  customaryLawApplicable: boolean;
  customaryClan?: string;
}

export interface S35CalculationResult {
  // Legal Framework
  appliedSection: 'S35(1)' | 'S35(1)(a)' | 'S35(1)(b)' | 'S35(5)';
  calculationMethod: 'STATUTORY' | 'CUSTOMARY' | 'COURT_ORDERED';

  // Estate Division
  personalChattelsDistribution: Money;
  lifeInterestProperty?: {
    propertyId: string;
    value: Money;
    holderId: string;
    endsAt: Date;
  };
  residuaryEstateDistribution: Money;

  // Beneficiary Shares
  spouseShare?: S35BeneficiaryShare;
  childrenShares: S35BeneficiaryShare[];
  otherDependantShares: S35BeneficiaryShare[];

  // Calculations
  totalSpouseShare: Money;
  totalChildrenShare: Money;
  totalDependantShare: Money;
  unallocatedAmount?: Money;

  // Legal Notes
  notes: string[];
  warnings: string[];
  requiresCourtApproval: boolean;

  // Metadata
  calculatedAt: Date;
  calculatedBy: string;
  version: number;
}

export class Section35Calculation extends ValueObject<S35CalculationResult> {
  get appliedSection(): string {
    return this.props.appliedSection;
  }
  get totalSpouseShare(): Money {
    return this.props.totalSpouseShare;
  }
  get totalChildrenShare(): Money {
    return this.props.totalChildrenShare;
  }
  get childrenShares(): S35BeneficiaryShare[] {
    return this.props.childrenShares;
  }
  get calculatedAt(): Date {
    return this.props.calculatedAt;
  }
  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval;
  }

  private constructor(props: S35CalculationResult) {
    super(props);
  }

  /**
   * Calculate intestate succession under Section 35 LSA
   */
  public static calculate(input: S35CalculationInput): Result<Section35Calculation> {
    const validationResult = this.validateInput(input);
    if (validationResult.isFailure) {
      return Result.fail<Section35Calculation>(validationResult.getErrorValue());
    }

    // Determine which subsection applies
    const appliedSection = this.determineApplicableSection(input);

    // Calculate distribution
    const result = this.performCalculation(input, appliedSection);

    return Result.ok<Section35Calculation>(new Section35Calculation(result));
  }

  /**
   * Validate input data
   */
  private static validateInput(input: S35CalculationInput): Result<void> {
    const errors: string[] = [];

    // Estate value validation
    if (input.netEstateValue.amount <= 0) {
      errors.push('Net estate value must be greater than zero');
    }

    if (input.personalChattelsValue.amount < 0) {
      errors.push('Personal chattels value cannot be negative');
    }

    if (input.personalChattelsValue.amount > input.netEstateValue.amount) {
      errors.push('Personal chattels value cannot exceed net estate value');
    }

    // Beneficiary validation
    if (!input.survivingSpouseId && input.children.length === 0) {
      errors.push('Must have either surviving spouse or children for Section 35');
    }

    // Child validation
    const deceasedChildrenWithNoIssue = input.children.filter(
      (child) => child.isDeceased && !child.hasChildren,
    );
    if (deceasedChildrenWithNoIssue.length > 0) {
      errors.push('Deceased children without issue cannot inherit under Section 35');
    }

    // Hotchpot validation
    const invalidGifts = input.lifetimeGifts.filter((gift) => gift.giftValue.amount < 0);
    if (invalidGifts.length > 0) {
      errors.push('Lifetime gift values cannot be negative');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Determine which subsection of Section 35 applies
   */
  private static determineApplicableSection(input: S35CalculationInput): string {
    // S.35(1) - General rule
    if (input.survivingSpouseId && input.children.length > 0) {
      return 'S35(1)';
    }

    // S.35(1)(a) - Only spouse survives
    if (input.survivingSpouseId && input.children.length === 0) {
      return 'S35(1)(a)';
    }

    // S.35(1)(b) - Only children survive
    if (!input.survivingSpouseId && input.children.length > 0) {
      return 'S35(1)(b)';
    }

    // S.35(5) - Representation rule
    const hasDeceasedChildrenWithIssue = input.children.some(
      (child) => child.isDeceased && child.hasChildren,
    );
    if (hasDeceasedChildrenWithIssue) {
      return 'S35(5)';
    }

    return 'S35(1)';
  }

  /**
   * Perform the actual calculation
   */
  private static performCalculation(
    input: S35CalculationInput,
    section: string,
  ): S35CalculationResult {
    const notes: string[] = [];
    const warnings: string[] = [];
    let requiresCourtApproval = false;

    // Calculate personal chattels (go to spouse if exists)
    const personalChattelsDistribution = this.calculatePersonalChattels(input, section);

    // Calculate life interest (S.35(1)(b))
    const lifeInterestProperty = this.calculateLifeInterest(input, section);

    // Calculate residuary estate
    const residuaryEstateDistribution = this.calculateResiduaryEstate(input, section);

    // Calculate beneficiary shares
    const { spouseShare, childrenShares, otherDependantShares } = this.calculateBeneficiaryShares(
      input,
      section,
    );

    // Calculate totals
    const totalSpouseShare = this.calculateTotalSpouseShare(
      spouseShare,
      personalChattelsDistribution,
      lifeInterestProperty,
    );

    const totalChildrenShare = this.calculateTotalChildrenShare(childrenShares);
    const totalDependantShare = this.calculateTotalDependantShare(otherDependantShares);

    // Check for court approval requirements
    if (input.children.some((child) => child.isMinor)) {
      requiresCourtApproval = true;
      notes.push("Court approval required for minor children's shares");
    }

    if (input.otherDependants.length > 0) {
      warnings.push('Section 29 dependant provisions may override Section 35 calculations');
    }

    // Check for unallocated amounts
    const totalDistributed = totalSpouseShare.add(totalChildrenShare).add(totalDependantShare);
    const unallocatedAmount = input.netEstateValue.subtract(totalDistributed);

    return {
      appliedSection: section as any,
      calculationMethod: 'STATUTORY',
      personalChattelsDistribution,
      lifeInterestProperty,
      residuaryEstateDistribution,
      spouseShare,
      childrenShares,
      otherDependantShares,
      totalSpouseShare,
      totalChildrenShare,
      totalDependantShare,
      unallocatedAmount: unallocatedAmount.amount > 0.01 ? unallocatedAmount : undefined,
      notes,
      warnings,
      requiresCourtApproval,
      calculatedAt: new Date(),
      calculatedBy: 'SYSTEM',
      version: 1,
    };
  }

  /**
   * Calculate personal chattels distribution
   */
  private static calculatePersonalChattels(input: S35CalculationInput, section: string): Money {
    // Under Kenyan law, personal chattels typically go to the spouse
    if (input.survivingSpouseId && section === 'S35(1)') {
      return input.personalChattelsValue;
    }

    // If no spouse, divided equally among children
    if (!input.survivingSpouseId && input.children.length > 0) {
      const perChildAmount = input.personalChattelsValue.amount / input.children.length;
      return Money.create({
        amount: perChildAmount,
        currency: input.personalChattelsValue.currency,
      }).getValue();
    }

    return Money.create({ amount: 0, currency: input.netEstateValue.currency }).getValue();
  }

  /**
   * Calculate life interest in matrimonial home (S.35(1)(b))
   */
  private static calculateLifeInterest(
    input: S35CalculationInput,
    section: string,
  ): S35CalculationResult['lifeInterestProperty'] | undefined {
    if (!input.matrimonialHomeValue || input.matrimonialHomeValue.amount === 0) {
      return undefined;
    }

    if (section === 'S35(1)' && input.survivingSpouseId) {
      // Spouse gets life interest in matrimonial home
      const endsAt = this.calculateLifeInterestEndDate(input);

      return {
        propertyId: 'MATRIMONIAL_HOME',
        value: input.matrimonialHomeValue,
        holderId: input.survivingSpouseId,
        endsAt,
      };
    }

    return undefined;
  }

  /**
   * Calculate when life interest ends
   */
  private static calculateLifeInterestEndDate(input: S35CalculationInput): Date {
    // Typically ends at spouse's death or remarriage
    // For calculation purposes, we estimate 30 years from calculation date
    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + 30);
    return endsAt;
  }

  /**
   * Calculate residuary estate distribution
   */
  private static calculateResiduaryEstate(input: S35CalculationInput, section: string): Money {
    // Remove personal chattels and life interest from net estate
    let residuaryValue = input.netEstateValue.amount;

    if (input.personalChattelsValue) {
      residuaryValue -= input.personalChattelsValue.amount;
    }

    if (input.matrimonialHomeValue) {
      // Life interest value is complex - for simplicity, we might use present value
      // Here we just subtract a portion
      residuaryValue -= input.matrimonialHomeValue.amount * 0.5;
    }

    return Money.create({
      amount: Math.max(0, residuaryValue),
      currency: input.netEstateValue.currency,
    }).getValue();
  }

  /**
   * Calculate individual beneficiary shares
   */
  private static calculateBeneficiaryShares(
    input: S35CalculationInput,
    section: string,
  ): {
    spouseShare?: S35BeneficiaryShare;
    childrenShares: S35BeneficiaryShare[];
    otherDependantShares: S35BeneficiaryShare[];
  } {
    const childrenShares: S35BeneficiaryShare[] = [];
    const otherDependantShares: S35BeneficiaryShare[] = [];

    // Calculate spouse share if applicable
    let spouseShare: S35BeneficiaryShare | undefined;
    if (input.survivingSpouseId && section === 'S35(1)') {
      spouseShare = this.calculateSpouseShare(input);
    }

    // Calculate children shares
    input.children.forEach((child) => {
      if (!child.isDeceased || child.hasChildren) {
        const childShare = this.calculateChildShare(input, child, section);
        childrenShares.push(childShare);
      }
    });

    // Calculate other dependant shares (simplified - usually through S.29)
    input.otherDependants.forEach((dependant) => {
      const dependantShare = this.calculateDependantShare(input, dependant);
      otherDependantShares.push(dependantShare);
    });

    return { spouseShare, childrenShares, otherDependantShares };
  }

  /**
   * Calculate spouse's share
   */
  private static calculateSpouseShare(input: S35CalculationInput): S35BeneficiaryShare {
    // Spouse gets personal chattels and life interest in matrimonial home
    // Plus a share of the residuary estate (typically 1/3 or fixed amount)
    const residuaryShare = this.calculateSpouseResiduaryShare(input);

    return {
      beneficiaryId: input.survivingSpouseId!,
      beneficiaryType: S35BeneficiaryType.SURVIVING_SPOUSE,
      relationship: 'SPOUSE',
      shareOfPersonalChattels: input.personalChattelsValue,
      shareOfResiduaryEstate: residuaryShare,
      isMinor: false,
      isDependant: input.spouseDisabled || false,
      requiresGuardian: false,
      hotchpotAdjusted: false,
      hasPhysicalDisability: input.spouseDisabled || false,
      hasMentalDisability: false,
      requiresSpecialProvision: input.spouseDisabled,
    };
  }

  /**
   * Calculate spouse's share of residuary estate
   */
  private static calculateSpouseResiduaryShare(input: S35CalculationInput): Money {
    // Under S.35(1), spouse gets the personal chattels, life interest in matrimonial home,
    // and a portion of the residuary estate (typically the income for life, with remainder to children)
    // For simplicity in calculation, we allocate a fixed percentage
    const percentage = 0.333; // Approximately 1/3
    const residuaryValue = this.calculateResiduaryEstate(input, 'S35(1)').amount;

    return Money.create({
      amount: residuaryValue * percentage,
      currency: input.netEstateValue.currency,
    }).getValue();
  }

  /**
   * Calculate child's share
   */
  private static calculateChildShare(
    input: S35CalculationInput,
    child: S35CalculationInput['children'][0],
    section: string,
  ): S35BeneficiaryShare {
    // Children share the residuary estate equally
    const livingChildren = input.children.filter((c) => !c.isDeceased || c.hasChildren);
    const residuaryValue = this.calculateResiduaryEstate(input, section).amount;

    let childResiduaryShare = residuaryValue / livingChildren.length;

    // Adjust for representation (S.35(5))
    if (child.isDeceased && child.hasChildren) {
      // Share is divided among deceased child's children
      childResiduaryShare = childResiduaryShare; // Would be further divided among grandchildren
    }

    // Apply hotchpot adjustments if applicable
    const hotchpotAdjustment = this.calculateHotchpotAdjustment(input, child.childId);
    let hotchpotAdjusted = false;

    if (hotchpotAdjustment && hotchpotAdjustment.amount > 0) {
      childResiduaryShare -= hotchpotAdjustment.amount;
      hotchpotAdjusted = true;
    }

    return {
      beneficiaryId: child.childId,
      beneficiaryType: child.isDeceased
        ? S35BeneficiaryType.CHILD_OF_DECEASED_CHILD
        : S35BeneficiaryType.CHILD,
      relationship: 'CHILD',
      shareOfResiduaryEstate: Money.create({
        amount: Math.max(0, childResiduaryShare),
        currency: input.netEstateValue.currency,
      }).getValue(),
      hotchpotAdjustment,
      hotchpotAdjusted,
      isMinor: child.isMinor,
      isDependant: child.disabilityStatus !== 'NONE' || child.isMinor,
      requiresGuardian: child.isMinor,
      hasPhysicalDisability:
        child.disabilityStatus === 'PHYSICAL' || child.disabilityStatus === 'BOTH',
      hasMentalDisability: child.disabilityStatus === 'MENTAL' || child.disabilityStatus === 'BOTH',
      requiresSpecialProvision: child.disabilityStatus !== 'NONE',
    };
  }

  /**
   * Calculate dependant's share
   */
  private static calculateDependantShare(
    input: S35CalculationInput,
    dependant: S35CalculationInput['otherDependants'][0],
  ): S35BeneficiaryShare {
    // S.29 dependants may get provision from estate
    // This is a simplified calculation - actual amounts determined by court
    const dependantShare = Money.create({
      amount: input.netEstateValue.amount * 0.05, // 5% as placeholder
      currency: input.netEstateValue.currency,
    }).getValue();

    return {
      beneficiaryId: dependant.dependantId,
      beneficiaryType: S35BeneficiaryType.OTHER_DEPENDANT,
      relationship: dependant.relationship,
      shareOfResiduaryEstate: dependantShare,
      isMinor: false, // Would need actual age
      isDependant: true,
      requiresGuardian: false,
      hotchpotAdjusted: false,
      hasPhysicalDisability: false,
      hasMentalDisability: false,
      requiresSpecialProvision: dependant.dependencyLevel === 'FULL',
    };
  }

  /**
   * Calculate hotchpot adjustment for a beneficiary (S.35(3))
   */
  private static calculateHotchpotAdjustment(
    input: S35CalculationInput,
    beneficiaryId: string,
  ): Money | undefined {
    const giftsToBeneficiary = input.lifetimeGifts.filter(
      (gift) => gift.recipientId === beneficiaryId && gift.isAdvancement,
    );

    if (giftsToBeneficiary.length === 0) {
      return undefined;
    }

    const totalGifts = giftsToBeneficiary.reduce((sum, gift) => sum + gift.giftValue.amount, 0);

    return Money.create({
      amount: totalGifts,
      currency: input.netEstateValue.currency,
    }).getValue();
  }

  /**
   * Calculate total spouse share
   */
  private static calculateTotalSpouseShare(
    spouseShare: S35BeneficiaryShare | undefined,
    personalChattels: Money,
    lifeInterest?: S35CalculationResult['lifeInterestProperty'],
  ): Money {
    if (!spouseShare) {
      return Money.create({ amount: 0, currency: personalChattels.currency }).getValue();
    }

    let total = personalChattels.amount;

    if (spouseShare.shareOfResiduaryEstate) {
      total += spouseShare.shareOfResiduaryEstate.amount;
    }

    if (lifeInterest) {
      // For calculation, we might use present value of life interest
      total += lifeInterest.value.amount * 0.5; // Simplified
    }

    return Money.create({
      amount: total,
      currency: personalChattels.currency,
    }).getValue();
  }

  /**
   * Calculate total children share
   */
  private static calculateTotalChildrenShare(childrenShares: S35BeneficiaryShare[]): Money {
    if (childrenShares.length === 0) {
      return Money.create({ amount: 0, currency: 'KES' }).getValue();
    }

    const total = childrenShares.reduce((sum, child) => {
      let childTotal = 0;

      if (child.shareOfResiduaryEstate) {
        childTotal += child.shareOfResiduaryEstate.amount;
      }

      if (child.hotchpotAdjustment) {
        childTotal -= child.hotchpotAdjustment.amount;
      }

      return sum + Math.max(0, childTotal);
    }, 0);

    return Money.create({
      amount: total,
      currency: childrenShares[0]?.shareOfResiduaryEstate?.currency || 'KES',
    }).getValue();
  }

  /**
   * Calculate total dependant share
   */
  private static calculateTotalDependantShare(dependantShares: S35BeneficiaryShare[]): Money {
    const total = dependantShares.reduce((sum, dependant) => {
      return sum + (dependant.shareOfResiduaryEstate?.amount || 0);
    }, 0);

    return Money.create({
      amount: total,
      currency: 'KES',
    }).getValue();
  }

  /**
   * Get summary of calculation
   */
  public getSummary(): {
    section: string;
    spouseShare: string;
    childrenShare: string;
    totalDistributed: string;
    hasWarnings: boolean;
    requiresCourtApproval: boolean;
  } {
    return {
      section: this.props.appliedSection,
      spouseShare: this.props.totalSpouseShare.toString(),
      childrenShare: this.props.totalChildrenShare.toString(),
      totalDistributed: this.props.totalSpouseShare
        .add(this.props.totalChildrenShare)
        .add(this.props.totalDependantShare)
        .toString(),
      hasWarnings: this.props.warnings.length > 0,
      requiresCourtApproval: this.props.requiresCourtApproval,
    };
  }

  /**
   * Get breakdown by beneficiary
   */
  public getBeneficiaryBreakdown(): Array<{
    beneficiaryId: string;
    beneficiaryType: string;
    totalShare: string;
    shareDetails: string[];
  }> {
    const breakdown: Array<{
      beneficiaryId: string;
      beneficiaryType: string;
      totalShare: string;
      shareDetails: string[];
    }> = [];

    // Add spouse if exists
    if (this.props.spouseShare) {
      const spouseTotal = this.calculateBeneficiaryTotal(this.props.spouseShare);
      breakdown.push({
        beneficiaryId: this.props.spouseShare.beneficiaryId,
        beneficiaryType: this.props.spouseShare.beneficiaryType,
        totalShare: spouseTotal.toString(),
        shareDetails: [
          `Personal chattels: ${this.props.spouseShare.shareOfPersonalChattels?.toString() || '0'}`,
          `Residuary estate: ${this.props.spouseShare.shareOfResiduaryEstate?.toString() || '0'}`,
          this.props.spouseShare.hotchpotAdjusted ? 'Hotchpot adjusted' : 'No hotchpot adjustment',
        ],
      });
    }

    // Add children
    this.props.childrenShares.forEach((child) => {
      const childTotal = this.calculateBeneficiaryTotal(child);
      breakdown.push({
        beneficiaryId: child.beneficiaryId,
        beneficiaryType: child.beneficiaryType,
        totalShare: childTotal.toString(),
        shareDetails: [
          `Residuary estate: ${child.shareOfResiduaryEstate?.toString() || '0'}`,
          child.hotchpotAdjusted
            ? `Hotchpot adjustment: ${child.hotchpotAdjustment?.toString() || '0'}`
            : 'No hotchpot adjustment',
          child.isMinor ? 'Minor - requires guardian' : 'Adult',
        ],
      });
    });

    // Add other dependants
    this.props.otherDependantShares.forEach((dependant) => {
      const dependantTotal = this.calculateBeneficiaryTotal(dependant);
      breakdown.push({
        beneficiaryId: dependant.beneficiaryId,
        beneficiaryType: dependant.beneficiaryType,
        totalShare: dependantTotal.toString(),
        shareDetails: [
          `Dependant provision: ${dependant.shareOfResiduaryEstate?.toString() || '0'}`,
          `Relationship: ${dependant.relationship}`,
        ],
      });
    });

    return breakdown;
  }

  /**
   * Calculate total for a single beneficiary
   */
  private calculateBeneficiaryTotal(beneficiary: S35BeneficiaryShare): Money {
    let total = 0;

    if (beneficiary.shareOfPersonalChattels) {
      total += beneficiary.shareOfPersonalChattels.amount;
    }

    if (beneficiary.shareOfResiduaryEstate) {
      total += beneficiary.shareOfResiduaryEstate.amount;
    }

    if (beneficiary.hotchpotAdjustment) {
      total -= beneficiary.hotchpotAdjustment.amount;
    }

    return Money.create({
      amount: Math.max(0, total),
      currency: beneficiary.shareOfResiduaryEstate?.currency || 'KES',
    }).getValue();
  }

  /**
   * Check if calculation has any warnings
   */
  public hasWarnings(): boolean {
    return this.props.warnings.length > 0;
  }

  /**
   * Check if calculation has any notes
   */
  public hasNotes(): boolean {
    return this.props.notes.length > 0;
  }

  /**
   * Get the calculation date
   */
  public getCalculationDate(): Date {
    return this.props.calculatedAt;
  }

  /**
   * Format the calculation for display
   */
  public formatForDisplay(): string {
    const summary = this.getSummary();
    const breakdown = this.getBeneficiaryBreakdown();

    let display = `Section ${summary.section} Calculation\n`;
    display += `=================================\n`;
    display += `Spouse Share: ${summary.spouseShare}\n`;
    display += `Children Share: ${summary.childrenShare}\n`;
    display += `Total Distributed: ${summary.totalDistributed}\n`;
    display += `\nBeneficiary Breakdown:\n`;

    breakdown.forEach((item) => {
      display += `- ${item.beneficiaryType}: ${item.totalShare}\n`;
      item.shareDetails.forEach((detail) => {
        display += `  ${detail}\n`;
      });
    });

    if (this.hasWarnings()) {
      display += `\nWarnings:\n`;
      this.props.warnings.forEach((warning) => {
        display += `- ${warning}\n`;
      });
    }

    if (this.hasNotes()) {
      display += `\nNotes:\n`;
      this.props.notes.forEach((note) => {
        display += `- ${note}\n`;
      });
    }

    return display;
  }
}
