import { ValueObject } from '../../../base/value-object';
import { Result } from '../../../core/result';
import { DateRange } from '../../../shared/date-range.vo';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export enum DependantCategory {
  MINOR_CHILD = 'MINOR_CHILD',
  ADULT_CHILD = 'ADULT_CHILD',
  SPOUSE = 'SPOUSE',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  GRANDCHILD = 'GRANDCHILD',
  OTHER_RELATIVE = 'OTHER_RELATIVE',
  COMMON_LAW_SPOUSE = 'COMMON_LAW_SPOUSE', // S.29(5)
  CUSTOMARY_SPOUSE = 'CUSTOMARY_SPOUSE',
}

export enum DependencyLevel {
  FULL = 'FULL', // Completely dependent
  PARTIAL = 'PARTIAL', // Partially dependent
  PAST = 'PAST', // Was dependent in the past
  POTENTIAL = 'POTENTIAL', // Likely to become dependent
}

export enum DependantStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  PENDING_ASSESSMENT = 'PENDING_ASSESSMENT',
  COURT_DETERMINED = 'COURT_DETERMINED',
  PROVISION_GRANTED = 'PROVISION_GRANTED',
  PROVISION_DENIED = 'PROVISION_DENIED',
  APPEAL_PENDING = 'APPEAL_PENDING',
}

export enum SupportType {
  LUMP_SUM = 'LUMP_SUM',
  MONTHLY_ALLOWANCE = 'MONTHLY_ALLOWANCE',
  EDUCATION_FUND = 'EDUCATION_FUND',
  HOUSING_ALLOWANCE = 'HOUSING_ALLOWANCE',
  MEDICAL_COVER = 'MEDICAL_COVER',
  BUSINESS_CAPITAL = 'BUSINESS_CAPITAL',
  TRUST_FUND = 'TRUST_FUND',
}

export interface DependantEvidence {
  evidenceId: string;
  evidenceType: string;
  documentId?: string;
  description: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  weight: number; // 0-1 indicating strength of evidence
}

export interface DependencyAssessment {
  // Basic Information
  dependantId: string;
  dependantName: string;
  category: DependantCategory;
  relationshipToDeceased: string;
  age: number;
  isMinor: boolean;

  // Dependency Analysis
  dependencyLevel: DependencyLevel;
  dependencyPercentage: number; // 0-100% how much they depended on deceased
  monthlySupportReceived?: Money;
  supportPeriod?: DateRange;

  // Needs Assessment
  monthlyLivingExpenses: Money;
  monthlyIncome?: Money;
  incomeSource?: string;
  specialNeeds: string[]; // Education, medical, housing, etc.

  // Disability Status
  hasDisability: boolean;
  disabilityType?: 'PHYSICAL' | 'MENTAL' | 'BOTH';
  disabilityCertificate?: string;
  requiresCaregiver: boolean;

  // Education Status (for children)
  isStudent: boolean;
  educationLevel?: string;
  expectedGraduationDate?: Date;
  educationCosts?: Money;

  // Employment Status
  isEmployed: boolean;
  employmentType?: string;
  employmentStability?: 'STABLE' | 'TEMPORARY' | 'UNEMPLOYED';

  // Assets & Resources
  personalAssetsValue?: Money;
  otherSupportSources: Array<{
    source: string;
    amount: Money;
    frequency: string;
  }>;

  // Evidence
  supportingEvidence: DependantEvidence[];
  evidenceScore: number; // 0-100

  // Assessment Metadata
  assessedBy: string;
  assessedAt: Date;
  assessmentMethod: string;
  confidenceLevel: number; // 0-100%
}

export interface DependantProvisionCalculation {
  // Dependant Information
  dependantId: string;
  dependantName: string;
  category: DependantCategory;
  status: DependantStatus;

  // Calculation Inputs
  estateNetValue: Money;
  competingClaims: Money; // Other S.29 claims
  availableForDependants: Money; // Estate value after debts, expenses

  // Needs Assessment Result
  assessedNeed: Money;
  needDuration?: DateRange; // How long support is needed

  // Provision Calculation
  recommendedProvision: Money;
  provisionType: SupportType;
  provisionBreakdown: Record<string, Money>; // e.g., { "Monthly Allowance": 50000, "Education Fund": 200000 }

  // Percentage Calculations
  needAsPercentageOfEstate: Percentage;
  provisionAsPercentageOfEstate: Percentage;
  provisionAsPercentageOfNeed: Percentage;

  // Legal Factors
  legalEntitlementScore: number; // 0-100 based on S.29 factors
  urgencyScore: number; // 0-100
  competingFactors: Array<{
    factor: string;
    impact: 'INCREASE' | 'DECREASE' | 'NEUTRAL';
    amount?: Money;
  }>;

  // Payment Structure
  paymentSchedule?: Array<{
    dueDate: Date;
    amount: Money;
    purpose: string;
  }>;

  // Trust Provisions (if applicable)
  trustDetails?: {
    trusteeId: string;
    trustDuration: string;
    distributionConditions: string[];
  };

  // Court Considerations
  requiresCourtApproval: boolean;
  courtOrderReference?: string;
  courtOrderDate?: Date;
  likelyCourtOutcome?: 'GRANTED' | 'DENIED' | 'REDUCED';

  // Alternative Provisions
  alternativeProvisions: Array<{
    type: SupportType;
    amount: Money;
    rationale: string;
  }>;

  // Notes & Recommendations
  calculationNotes: string[];
  recommendations: string[];
  warnings: string[];

  // Audit
  calculatedAt: Date;
  calculatedBy: string;
  version: number;
}

export interface S29CalculationInput {
  // Estate Information
  estateId: string;
  netEstateValue: Money;
  totalDebts: Money;
  funeralExpenses: Money;
  testamentaryExpenses: Money;

  // Deceased Information
  deceasedName: string;
  deceasedAgeAtDeath: number;
  deceasedOccupation?: string;
  deceasedMonthlyIncome?: Money;

  // Dependants to Assess
  dependants: DependencyAssessment[];

  // Existing Provisions
  existingWillProvisions: Array<{
    beneficiaryId: string;
    amount: Money;
    isDependant: boolean;
  }>;

  // Competing Claims
  otherCreditors: Money;
  taxObligations: Money;

  // Legal Parameters
  jurisdiction: string;
  courtPreferences?: Record<string, any>; // Known court tendencies
  precedentCases?: Array<{
    caseName: string;
    ruling: string;
    relevance: number; // 0-100
  }>;

  // Calculation Parameters
  minimumProvisionPercentage: number; // Minimum % of estate for dependants
  maximumProvisionPercentage: number; // Maximum % of estate for dependants
  livingExpenseMultiplier: number; // Multiplier for living expenses (e.g., 12 months)

  // Customary Law Considerations
  customaryLawApplicable: boolean;
  customaryClan?: string;
  clanElderRecommendations?: string[];
}

export class DependencyEntitlement extends ValueObject<DependantProvisionCalculation> {
  get dependantId(): string {
    return this.props.dependantId;
  }
  get dependantName(): string {
    return this.props.dependantName;
  }
  get status(): DependantStatus {
    return this.props.status;
  }
  get recommendedProvision(): Money {
    return this.props.recommendedProvision;
  }
  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval;
  }

  private constructor(props: DependantProvisionCalculation) {
    super(props);
  }

  /**
   * Calculate dependant provision under Section 29 LSA
   */
  public static calculate(
    input: S29CalculationInput,
    dependantId: string,
  ): Result<DependencyEntitlement> {
    const validationResult = this.validateInput(input, dependantId);
    if (validationResult.isFailure) {
      return Result.fail<DependencyEntitlement>(validationResult.getErrorValue());
    }

    // Find dependant
    const dependant = input.dependants.find((d) => d.dependantId === dependantId);
    if (!dependant) {
      return Result.fail(`Dependant ${dependantId} not found`);
    }

    // Calculate available estate for dependants
    const availableForDependants = this.calculateAvailableEstate(input);

    // Calculate dependant's need
    const assessedNeed = this.assessDependantNeed(dependant, input);

    // Calculate recommended provision
    const provision = this.calculateProvision(
      dependant,
      assessedNeed,
      availableForDependants,
      input,
    );

    // Create calculation result
    const result = this.createCalculationResult(
      dependant,
      provision,
      assessedNeed,
      availableForDependants,
      input,
    );

    return Result.ok<DependencyEntitlement>(new DependencyEntitlement(result));
  }

  /**
   * Validate calculation input
   */
  private static validateInput(input: S29CalculationInput, dependantId: string): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (input.netEstateValue.amount <= 0) {
      errors.push('Net estate value must be greater than zero');
    }

    if (input.dependants.length === 0) {
      errors.push('At least one dependant must be specified');
    }

    // Check dependant exists
    const dependant = input.dependants.find((d) => d.dependantId === dependantId);
    if (!dependant) {
      errors.push(`Dependant ${dependantId} not found`);
    }

    // Validate percentages
    if (input.minimumProvisionPercentage < 0 || input.minimumProvisionPercentage > 100) {
      errors.push('Minimum provision percentage must be between 0 and 100');
    }

    if (input.maximumProvisionPercentage < 0 || input.maximumProvisionPercentage > 100) {
      errors.push('Maximum provision percentage must be between 0 and 100');
    }

    if (input.minimumProvisionPercentage > input.maximumProvisionPercentage) {
      errors.push('Minimum provision percentage cannot exceed maximum');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Calculate available estate for dependants
   */
  private static calculateAvailableEstate(input: S29CalculationInput): Money {
    // S.29 provisions come after S.45 debts but before other distributions
    let available = input.netEstateValue.amount;

    // Subtract debts and expenses (S.45 priority)
    available -= input.totalDebts.amount;
    available -= input.funeralExpenses.amount;
    available -= input.testamentaryExpenses.amount;

    // Subtract other priority claims
    available -= input.otherCreditors.amount;
    available -= input.taxObligations.amount;

    // Ensure non-negative
    available = Math.max(0, available);

    return Money.create({
      amount: available,
      currency: input.netEstateValue.currency,
    }).getValue();
  }

  /**
   * Assess dependant's need
   */
  private static assessDependantNeed(
    dependant: DependencyAssessment,
    input: S29CalculationInput,
  ): Money {
    // Calculate annual living expenses
    const annualLivingExpenses = dependant.monthlyLivingExpenses.multiply(12);

    // Subtract other income/support
    let otherAnnualIncome = 0;
    dependant.otherSupportSources.forEach((source) => {
      // Convert to annual
      const frequency = source.frequency.toLowerCase();
      let multiplier = 1;

      switch (frequency) {
        case 'monthly':
          multiplier = 12;
          break;
        case 'weekly':
          multiplier = 52;
          break;
        case 'daily':
          multiplier = 365;
          break;
        case 'annual':
          multiplier = 1;
          break;
      }

      otherAnnualIncome += source.amount.amount * multiplier;
    });

    // Add special needs (education, medical, etc.)
    let specialNeedsCost = 0;

    if (dependant.isStudent && dependant.educationCosts) {
      specialNeedsCost += dependant.educationCosts.amount;
    }

    if (dependant.hasDisability) {
      // Estimate disability care costs
      specialNeedsCost += dependant.monthlyLivingExpenses.amount * 6; // 6 months extra
    }

    // Calculate need duration
    let needDurationYears = 1; // Default 1 year

    if (dependant.isMinor) {
      needDurationYears = 18 - dependant.age; // Until age 18
    } else if (dependant.isStudent && dependant.expectedGraduationDate) {
      const yearsUntilGraduation = Math.ceil(
        (dependant.expectedGraduationDate.getTime() - new Date().getTime()) /
          (365 * 24 * 60 * 60 * 1000),
      );
      needDurationYears = Math.max(1, yearsUntilGraduation);
    }

    // Calculate total need
    const baseNeed = annualLivingExpenses.amount - otherAnnualIncome;
    const totalNeed = baseNeed * needDurationYears + specialNeedsCost;

    // Apply dependency percentage
    const adjustedNeed = totalNeed * (dependant.dependencyPercentage / 100);

    return Money.create({
      amount: Math.max(0, adjustedNeed),
      currency: dependant.monthlyLivingExpenses.currency,
    }).getValue();
  }

  /**
   * Calculate recommended provision
   */
  private static calculateProvision(
    dependant: DependencyAssessment,
    assessedNeed: Money,
    availableEstate: Money,
    input: S29CalculationInput,
  ): Money {
    // Start with assessed need
    let provision = assessedNeed.amount;

    // Apply legal entitlement score adjustment
    const legalScore = this.calculateLegalEntitlementScore(dependant);
    provision = provision * (legalScore / 100);

    // Apply urgency adjustment
    const urgencyScore = this.calculateUrgencyScore(dependant);
    provision = provision * (1 + urgencyScore / 200); // Up to 50% increase for urgency

    // Cap by available estate percentage limits
    const maxFromEstate = availableEstate.amount * (input.maximumProvisionPercentage / 100);
    const minFromEstate = availableEstate.amount * (input.minimumProvisionPercentage / 100);

    provision = Math.max(minFromEstate, Math.min(provision, maxFromEstate));

    // Apply competing claims adjustment
    provision = this.adjustForCompetingClaims(provision, dependant, input);

    // Ensure provision doesn't exceed available estate
    provision = Math.min(provision, availableEstate.amount);

    return Money.create({
      amount: Math.max(0, provision),
      currency: assessedNeed.currency,
    }).getValue();
  }

  /**
   * Calculate legal entitlement score (0-100)
   */
  private static calculateLegalEntitlementScore(dependant: DependencyAssessment): number {
    let score = 50; // Base score

    // Category adjustments
    switch (dependant.category) {
      case DependantCategory.MINOR_CHILD:
        score += 40; // Strongest claim
        break;
      case DependantCategory.SPOUSE:
        score += 35;
        break;
      case DependantCategory.ADULT_CHILD:
        score += 20;
        break;
      case DependantCategory.PARENT:
        score += 25;
        break;
      case DependantCategory.COMMON_LAW_SPOUSE:
        score += 15; // S.29(5) requires proof of cohabitation
        break;
      default:
        score += 10;
    }

    // Dependency level adjustments
    switch (dependant.dependencyLevel) {
      case DependencyLevel.FULL:
        score += 30;
        break;
      case DependencyLevel.PARTIAL:
        score += 15;
        break;
      case DependencyLevel.PAST:
        score += 5;
        break;
    }

    // Disability adjustment
    if (dependant.hasDisability) {
      score += 20;
    }

    // Age adjustment for children
    if (dependant.isMinor && dependant.age < 10) {
      score += 10;
    }

    // Evidence strength adjustment
    score = score * (dependant.evidenceScore / 100);

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Calculate urgency score (0-100)
   */
  private static calculateUrgencyScore(dependant: DependencyAssessment): number {
    let score = 0;

    // Immediate needs
    if (dependant.isMinor && !dependant.otherSupportSources.length) {
      score += 40;
    }

    if (dependant.hasDisability && dependant.requiresCaregiver) {
      score += 30;
    }

    if (dependant.isStudent && dependant.educationCosts) {
      score += 20;
    }

    // Employment status
    if (!dependant.isEmployed || dependant.employmentStability === 'UNEMPLOYED') {
      score += 20;
    }

    // Special circumstances
    if (dependant.specialNeeds.includes('MEDICAL')) {
      score += 30;
    }

    if (dependant.specialNeeds.includes('HOUSING')) {
      score += 20;
    }

    return Math.min(100, score);
  }

  /**
   * Adjust for competing claims
   */
  private static adjustForCompetingClaims(
    provision: number,
    dependant: DependencyAssessment,
    input: S29CalculationInput,
  ): number {
    // Count other dependants with stronger claims
    const strongerClaims = input.dependants.filter(
      (d) =>
        d.dependantId !== dependant.dependantId &&
        this.calculateLegalEntitlementScore(d) > this.calculateLegalEntitlementScore(dependant),
    );

    if (strongerClaims.length > 0) {
      // Reduce provision based on number of stronger claims
      const reductionFactor = 1 / (strongerClaims.length + 1);
      provision = provision * reductionFactor;
    }

    return provision;
  }

  /**
   * Create calculation result
   */
  private static createCalculationResult(
    dependant: DependencyAssessment,
    provision: Money,
    assessedNeed: Money,
    availableEstate: Money,
    input: S29CalculationInput,
  ): DependantProvisionCalculation {
    const calculationNotes: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Calculate percentages
    const needPercentage = Percentage.create({
      value: (assessedNeed.amount / input.netEstateValue.amount) * 100,
    }).getValue();

    const provisionPercentage = Percentage.create({
      value: (provision.amount / input.netEstateValue.amount) * 100,
    }).getValue();

    const provisionVsNeed = Percentage.create({
      value: assessedNeed.amount > 0 ? (provision.amount / assessedNeed.amount) * 100 : 0,
    }).getValue();

    // Determine status
    const status = this.determineDependantStatus(dependant, provision);

    // Check if court approval required
    const requiresCourtApproval = this.requiresCourtApproval(dependant, provision, input);

    // Determine likely court outcome
    const likelyCourtOutcome = this.predictCourtOutcome(dependant, provision);

    // Determine provision type
    const provisionType = this.determineProvisionType(dependant);

    // Create payment schedule
    const paymentSchedule = this.createPaymentSchedule(dependant, provision, provisionType);

    // Add notes
    if (dependant.hasDisability) {
      calculationNotes.push('Special disability considerations applied');
      recommendations.push('Consider trust fund for long-term care');
    }

    if (dependant.isMinor) {
      calculationNotes.push('Minor child - provision may need to be held in trust');
      recommendations.push('Appoint guardian for financial management');
    }

    if (provisionVsNeed.value < 50) {
      warnings.push('Provision covers less than 50% of assessed need');
      recommendations.push('Consider alternative support sources');
    }

    // Add customary law notes if applicable
    if (input.customaryLawApplicable) {
      calculationNotes.push('Customary law considerations factored in');
      if (input.clanElderRecommendations) {
        recommendations.push(...input.clanElderRecommendations);
      }
    }

    // Competing factors
    const competingFactors = this.identifyCompetingFactors(dependant, input);

    // Alternative provisions
    const alternativeProvisions = this.generateAlternativeProvisions(dependant, provision);

    return {
      dependantId: dependant.dependantId,
      dependantName: dependant.dependantName,
      category: dependant.category,
      status,

      estateNetValue: input.netEstateValue,
      competingClaims: Money.create({ amount: 0, currency: 'KES' }).getValue(), // Would calculate from other dependants
      availableForDependants: availableEstate,

      assessedNeed,
      needDuration: dependant.supportPeriod,

      recommendedProvision: provision,
      provisionType,
      provisionBreakdown: {
        'Basic Support': provision.multiply(0.7),
        'Special Needs': provision.multiply(0.3),
      },

      needAsPercentageOfEstate: needPercentage,
      provisionAsPercentageOfEstate: provisionPercentage,
      provisionAsPercentageOfNeed: provisionVsNeed,

      legalEntitlementScore: this.calculateLegalEntitlementScore(dependant),
      urgencyScore: this.calculateUrgencyScore(dependant),
      competingFactors,

      paymentSchedule,

      requiresCourtApproval,
      likelyCourtOutcome,

      alternativeProvisions,
      calculationNotes,
      recommendations,
      warnings,

      calculatedAt: new Date(),
      calculatedBy: 'SYSTEM',
      version: 1,
    };
  }

  /**
   * Determine dependant status
   */
  private static determineDependantStatus(
    dependant: DependencyAssessment,
    provision: Money,
  ): DependantStatus {
    if (provision.amount === 0) {
      return DependantStatus.INELIGIBLE;
    }

    if (dependant.evidenceScore < 50) {
      return DependantStatus.PENDING_ASSESSMENT;
    }

    return DependantStatus.ELIGIBLE;
  }

  /**
   * Check if court approval required
   */
  private static requiresCourtApproval(
    dependant: DependencyAssessment,
    provision: Money,
    input: S29CalculationInput,
  ): boolean {
    // Always require court approval for:
    // 1. Large provisions (> 20% of estate)
    if (provision.amount / input.netEstateValue.amount > 0.2) {
      return true;
    }

    // 2. Minor children
    if (dependant.isMinor) {
      return true;
    }

    // 3. Common law spouses (S.29(5))
    if (dependant.category === DependantCategory.COMMON_LAW_SPOUSE) {
      return true;
    }

    // 4. Disputed dependency
    if (dependant.evidenceScore < 70) {
      return true;
    }

    return false;
  }

  /**
   * Predict court outcome
   */
  private static predictCourtOutcome(
    dependant: DependencyAssessment,
    provision: Money,
  ): 'GRANTED' | 'DENIED' | 'REDUCED' {
    const legalScore = this.calculateLegalEntitlementScore(dependant);

    if (legalScore > 80) {
      return 'GRANTED';
    } else if (legalScore > 60) {
      return 'REDUCED';
    } else {
      return 'DENIED';
    }
  }

  /**
   * Determine appropriate provision type
   */
  private static determineProvisionType(dependant: DependencyAssessment): SupportType {
    if (dependant.isMinor) {
      return SupportType.TRUST_FUND;
    }

    if (dependant.hasDisability) {
      return SupportType.MONTHLY_ALLOWANCE;
    }

    if (dependant.isStudent) {
      return SupportType.EDUCATION_FUND;
    }

    return SupportType.LUMP_SUM;
  }

  /**
   * Create payment schedule
   */
  private static createPaymentSchedule(
    dependant: DependencyAssessment,
    provision: Money,
    provisionType: SupportType,
  ): Array<{ dueDate: Date; amount: Money; purpose: string }> | undefined {
    if (provisionType !== SupportType.MONTHLY_ALLOWANCE) {
      return undefined;
    }

    const schedule: Array<{ dueDate: Date; amount: Money; purpose: string }> = [];
    const monthlyAmount = provision.divide(12);

    const startDate = new Date();

    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        dueDate,
        amount: monthlyAmount,
        purpose: 'Monthly living allowance',
      });
    }

    return schedule;
  }

  /**
   * Identify competing factors
   */
  private static identifyCompetingFactors(
    dependant: DependencyAssessment,
    input: S29CalculationInput,
  ): Array<{ factor: string; impact: 'INCREASE' | 'DECREASE' | 'NEUTRAL'; amount?: Money }> {
    const factors: Array<{
      factor: string;
      impact: 'INCREASE' | 'DECREASE' | 'NEUTRAL';
      amount?: Money;
    }> = [];

    // Positive factors
    if (dependant.isMinor) {
      factors.push({ factor: 'Minor child', impact: 'INCREASE' });
    }

    if (dependant.hasDisability) {
      factors.push({ factor: 'Disability', impact: 'INCREASE' });
    }

    if (dependant.dependencyLevel === DependencyLevel.FULL) {
      factors.push({ factor: 'Full dependency', impact: 'INCREASE' });
    }

    // Negative factors
    if (dependant.otherSupportSources.length > 0) {
      factors.push({ factor: 'Other support sources', impact: 'DECREASE' });
    }

    if (dependant.isEmployed && dependant.employmentStability === 'STABLE') {
      factors.push({ factor: 'Stable employment', impact: 'DECREASE' });
    }

    // Estate factors
    if (input.existingWillProvisions.some((p) => p.isDependant)) {
      factors.push({ factor: 'Existing will provisions', impact: 'DECREASE' });
    }

    return factors;
  }

  /**
   * Generate alternative provisions
   */
  private static generateAlternativeProvisions(
    dependant: DependencyAssessment,
    primaryProvision: Money,
  ): Array<{ type: SupportType; amount: Money; rationale: string }> {
    const alternatives: Array<{ type: SupportType; amount: Money; rationale: string }> = [];

    // Alternative 1: Reduced lump sum
    alternatives.push({
      type: SupportType.LUMP_SUM,
      amount: primaryProvision.multiply(0.8),
      rationale: 'Immediate settlement at 20% discount',
    });

    // Alternative 2: Monthly allowance
    if (primaryProvision.amount > 100000) {
      // If substantial amount
      alternatives.push({
        type: SupportType.MONTHLY_ALLOWANCE,
        amount: primaryProvision.divide(24), // Over 2 years
        rationale: 'Structured payments over 24 months',
      });
    }

    // Alternative 3: Trust fund for minors
    if (dependant.isMinor) {
      alternatives.push({
        type: SupportType.TRUST_FUND,
        amount: primaryProvision,
        rationale: 'Protected trust until age of majority',
      });
    }

    return alternatives;
  }

  /**
   * Approve the provision (change status)
   */
  public approveProvision(approvedBy: string, courtOrderReference?: string): Result<void> {
    if (this.props.status === DependantStatus.PROVISION_GRANTED) {
      return Result.fail('Provision already granted');
    }

    this.props.status = DependantStatus.PROVISION_GRANTED;
    this.props.calculationNotes.push(
      `Approved by ${approvedBy} on ${new Date().toLocaleDateString()}`,
    );

    if (courtOrderReference) {
      this.props.courtOrderReference = courtOrderReference;
      this.props.courtOrderDate = new Date();
    }

    return Result.ok();
  }

  /**
   * Deny the provision
   */
  public denyProvision(reason: string, deniedBy: string): Result<void> {
    if (this.props.status === DependantStatus.PROVISION_DENIED) {
      return Result.fail('Provision already denied');
    }

    this.props.status = DependantStatus.PROVISION_DENIED;
    this.props.calculationNotes.push(`Denied by ${deniedBy}: ${reason}`);

    return Result.ok();
  }

  /**
   * Appeal the provision
   */
  public appealProvision(grounds: string): Result<void> {
    if (this.props.status === DependantStatus.APPEAL_PENDING) {
      return Result.fail('Appeal already pending');
    }

    this.props.status = DependantStatus.APPEAL_PENDING;
    this.props.calculationNotes.push(`Appeal filed: ${grounds}`);

    return Result.ok();
  }

  /**
   * Get provision summary
   */
  public getSummary(): {
    dependantName: string;
    category: string;
    recommendedProvision: string;
    status: string;
    requiresCourtApproval: boolean;
    coversPercentageOfNeed: number;
  } {
    return {
      dependantName: this.props.dependantName,
      category: this.props.category,
      recommendedProvision: this.props.recommendedProvision.toString(),
      status: this.props.status,
      requiresCourtApproval: this.props.requiresCourtApproval,
      coversPercentageOfNeed: this.props.provisionAsPercentageOfNeed.value,
    };
  }

  /**
   * Check if provision is adequate (> 70% of need)
   */
  public isAdequateProvision(): boolean {
    return this.props.provisionAsPercentageOfNeed.value > 70;
  }

  /**
   * Check if provision is substantial (> 10% of estate)
   */
  public isSubstantialProvision(): boolean {
    return this.props.provisionAsPercentageOfEstate.value > 10;
  }

  /**
   * Get payment schedule if available
   */
  public getPaymentScheduleSummary(): string {
    if (!this.props.paymentSchedule || this.props.paymentSchedule.length === 0) {
      return 'Lump sum payment';
    }

    const totalPayments = this.props.paymentSchedule.length;
    const firstPayment = this.props.paymentSchedule[0];
    const lastPayment = this.props.paymentSchedule[totalPayments - 1];

    return `${totalPayments} payments from ${firstPayment.dueDate.toLocaleDateString()} to ${lastPayment.dueDate.toLocaleDateString()}`;
  }

  /**
   * Format provision for display
   */
  public formatForDisplay(): string {
    const summary = this.getSummary();

    let display = `S.29 Dependant Provision for ${summary.dependantName}\n`;
    display += `==============================================\n`;
    display += `Category: ${summary.category}\n`;
    display += `Recommended Provision: ${summary.recommendedProvision}\n`;
    display += `Status: ${summary.status}\n`;
    display += `Covers ${summary.coversPercentageOfNeed.toFixed(1)}% of assessed need\n`;
    display += `Court Approval Required: ${summary.requiresCourtApproval ? 'Yes' : 'No'}\n`;
    display += `Payment: ${this.getPaymentScheduleSummary()}\n`;
    display += `\nCalculation Details:\n`;

    this.props.calculationNotes.forEach((note) => {
      display += `- ${note}\n`;
    });

    if (this.props.recommendations.length > 0) {
      display += `\nRecommendations:\n`;
      this.props.recommendations.forEach((rec) => {
        display += `- ${rec}\n`;
      });
    }

    if (this.props.warnings.length > 0) {
      display += `\nWarnings:\n`;
      this.props.warnings.forEach((warning) => {
        display += `- ${warning}\n`;
      });
    }

    return display;
  }

  /**
   * Get the provision breakdown by purpose
   */
  public getProvisionBreakdown(): Array<{ purpose: string; amount: string; percentage: number }> {
    return Object.entries(this.props.provisionBreakdown).map(([purpose, amount]) => ({
      purpose,
      amount: amount.toString(),
      percentage: (amount.amount / this.props.recommendedProvision.amount) * 100,
    }));
  }

  /**
   * Check if this is a high-priority claim
   */
  public isHighPriority(): boolean {
    return (
      this.props.urgencyScore > 70 ||
      this.props.category === DependantCategory.MINOR_CHILD ||
      (this.props.dependantName.includes('disabled') && this.props.urgencyScore > 50)
    );
  }

  /**
   * Get the effective date of provision (if court approved)
   */
  public getEffectiveDate(): Date | undefined {
    return this.props.courtOrderDate || this.props.calculatedAt;
  }
}
