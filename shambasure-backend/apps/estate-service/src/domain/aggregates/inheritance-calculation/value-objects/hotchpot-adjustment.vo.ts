import { ValueObject } from '../../../base/value-object';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export enum HotchpotAdjustmentType {
  ADVANCEMENT = 'ADVANCEMENT', // Gift intended as advance on inheritance
  GIFT = 'GIFT', // Normal gift not intended as advancement
  DEBT_FORGIVENESS = 'DEBT_FORGIVENESS', // Forgiven debt treated as advancement
  PROPERTY_TRANSFER = 'PROPERTY_TRANSFER',
  EDUCATION_FUNDING = 'EDUCATION_FUNDING',
  BUSINESS_CAPITAL = 'BUSINESS_CAPITAL',
  MARRIAGE_SETTLEMENT = 'MARRIATION_SETTLEMENT',
  CUSTOMARY_GIFT = 'CUSTOMARY_GIFT',
}

export enum HotchpotCalculationMethod {
  NOMINAL_VALUE = 'NOMINAL_VALUE', // Value at time of gift
  INFLATION_ADJUSTED = 'INFLATION_ADJUSTED', // Adjusted for inflation
  CURRENT_MARKET_VALUE = 'CURRENT_MARKET_VALUE', // Value at date of death
  COST_OF_LIVING_ADJUSTED = 'COST_OF_LIVING_ADJUSTED',
}

export enum HotchpotAdjustmentStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  APPLIED = 'APPLIED',
  DISPUTED = 'DISPUTED',
  WAIVED = 'WAIVED',
  EXEMPTED = 'EXEMPTED',
}

export interface LifetimeGift {
  // Identification
  giftId: string;
  donorId: string;
  recipientId: string;
  recipientName: string;
  relationshipToDeceased: string;

  // Gift Details
  description: string;
  adjustmentType: HotchpotAdjustmentType;
  dateOfGift: Date;
  locationOfGift?: string;

  // Financial Details
  originalValue: Money;
  currencyAtGift: string;
  exchangeRateAtGift?: number;

  // Adjustment Factors
  isSubjectToHotchpot: boolean;
  isAdvancement: boolean;
  advancementIntentionExpressed: boolean;
  advancementEvidence?: string; // Document reference

  // Inflation/Value Adjustment
  currentAdjustedValue?: Money;
  adjustmentMethod?: HotchpotCalculationMethod;
  inflationRateUsed?: number;
  adjustmentDate?: Date;

  // Legal Context
  giftDeedReference?: string;
  witnesses?: string[];
  legalAdviceGiven: boolean;
  legalAdviceDetails?: string;

  // Conditions & Reversions
  isConditional: boolean;
  conditionDetails?: string;
  conditionMet?: boolean;
  conditionMetDate?: Date;
  revertsToEstateOnConditionFailure: boolean;

  // Customary Law Considerations
  isCustomaryGift: boolean;
  customaryPurpose?: string;
  customaryLawExemption: boolean;
  clanApprovalObtained?: boolean;

  // Documentation
  supportingDocumentIds: string[];
  valuationReportIds: string[];

  // Metadata
  recordedBy: string;
  recordedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface HotchpotAdjustmentResult {
  // Beneficiary Summary
  beneficiaryId: string;
  beneficiaryName: string;
  relationshipToDeceased: string;

  // Lifetime Gifts Summary
  totalGiftsReceived: number;
  totalGiftValueOriginal: Money;
  totalGiftValueAdjusted: Money;

  // Advancement Calculations
  advancementsCount: number;
  advancementsOriginalValue: Money;
  advancementsAdjustedValue: Money;

  // Adjustments Applied
  hotchpotAdjustmentAmount: Money;
  adjustmentPercentage: Percentage; // Percentage of estate value

  // Legal Status
  adjustmentStatus: HotchpotAdjustmentStatus;
  appliesToIntestateShare: boolean;
  appliesToTestateShare: boolean;

  // Exemptions & Waivers
  isExempted: boolean;
  exemptionReason?: string;
  exemptionAuthority?: string; // Court, clan elder, etc.
  exemptionDate?: Date;

  // Disputes & Resolutions
  isDisputed: boolean;
  disputeReason?: string;
  disputeResolution?: string;
  disputeResolvedAt?: Date;

  // Calculations
  preAdjustmentShare?: Money;
  postAdjustmentShare?: Money;
  adjustmentImpact: Money; // Positive or negative impact

  // Documentation
  calculationNotes: string[];
  legalReferences: string[];
  supportingCaseLaw?: string[];

  // Audit Trail
  calculatedAt: Date;
  calculatedBy: string;
  appliedAt?: Date;
  appliedBy?: string;
  version: number;
}

export interface HotchpotCalculationInput {
  // Estate Information
  estateId: string;
  netEstateValue: Money;
  dateOfDeath: Date;

  // Beneficiary Information
  beneficiaries: Array<{
    beneficiaryId: string;
    name: string;
    relationship: string;
    intestateShare?: Money;
    testateShare?: Money;
    isDependant: boolean;
  }>;

  // Lifetime Gifts Data
  lifetimeGifts: LifetimeGift[];

  // Calculation Parameters
  adjustmentMethod: HotchpotCalculationMethod;
  baseYearForInflation?: number; // e.g., 2021 for CPI calculations
  inflationRate?: number; // Annual inflation rate if known

  // Legal Parameters
  jurisdiction: string; // County for customary law variations
  customaryLawApplicable: boolean;
  customaryClan?: string;

  // Exemptions & Overrides
  exemptedGiftIds: string[];
  courtOrders?: Array<{
    orderNumber: string;
    orderDate: Date;
    effect: 'EXEMPT' | 'ADJUST' | 'WAIVE';
    details: string;
  }>;

  // Calculation Options
  includeConditionalGifts: boolean;
  adjustForExchangeRates: boolean;
  minimumAdjustmentThreshold: Money; // Don't adjust small gifts
}

export class HotchpotAdjustment extends ValueObject<HotchpotAdjustmentResult> {
  get beneficiaryId(): string {
    return this.props.beneficiaryId;
  }
  get adjustmentStatus(): HotchpotAdjustmentStatus {
    return this.props.adjustmentStatus;
  }
  get hotchpotAdjustmentAmount(): Money {
    return this.props.hotchpotAdjustmentAmount;
  }
  get totalGiftValueAdjusted(): Money {
    return this.props.totalGiftValueAdjusted;
  }
  get adjustmentImpact(): Money {
    return this.props.adjustmentImpact;
  }

  private constructor(props: HotchpotAdjustmentResult) {
    super(props);
  }

  /**
   * Calculate hotchpot adjustments for a beneficiary
   */
  public static calculate(
    input: HotchpotCalculationInput,
    beneficiaryId: string,
  ): Result<HotchpotAdjustment> {
    const validationResult = this.validateInput(input, beneficiaryId);
    if (validationResult.isFailure) {
      return Result.fail<HotchpotAdjustment>(validationResult.getErrorValue());
    }

    // Find beneficiary
    const beneficiary = input.beneficiaries.find((b) => b.beneficiaryId === beneficiaryId);
    if (!beneficiary) {
      return Result.fail(`Beneficiary ${beneficiaryId} not found in input`);
    }

    // Filter gifts for this beneficiary
    const beneficiaryGifts = input.lifetimeGifts.filter(
      (gift) => gift.recipientId === beneficiaryId,
    );

    // Calculate adjustments
    const result = this.performCalculation(input, beneficiary, beneficiaryGifts);

    return Result.ok<HotchpotAdjustment>(new HotchpotAdjustment(result));
  }

  /**
   * Validate calculation input
   */
  private static validateInput(
    input: HotchpotCalculationInput,
    beneficiaryId: string,
  ): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (input.netEstateValue.amount <= 0) {
      errors.push('Net estate value must be greater than zero');
    }

    if (!input.dateOfDeath || input.dateOfDeath > new Date()) {
      errors.push('Date of death must be in the past');
    }

    // Check beneficiary exists
    const beneficiary = input.beneficiaries.find((b) => b.beneficiaryId === beneficiaryId);
    if (!beneficiary) {
      errors.push(`Beneficiary ${beneficiaryId} not found`);
    }

    // Check adjustment method
    if (
      input.adjustmentMethod === HotchpotCalculationMethod.INFLATION_ADJUSTED &&
      !input.inflationRate &&
      !input.baseYearForInflation
    ) {
      errors.push('Inflation rate or base year required for inflation-adjusted method');
    }

    // Check minimum threshold
    if (input.minimumAdjustmentThreshold.amount < 0) {
      errors.push('Minimum adjustment threshold cannot be negative');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Perform the hotchpot calculation
   */
  private static performCalculation(
    input: HotchpotCalculationInput,
    beneficiary: HotchpotCalculationInput['beneficiaries'][0],
    gifts: LifetimeGift[],
  ): HotchpotAdjustmentResult {
    const calculationNotes: string[] = [];
    const legalReferences: string[] = ['Section 35(3) LSA'];

    // Filter out exempted gifts
    const applicableGifts = gifts.filter((gift) => !input.exemptedGiftIds.includes(gift.giftId));

    // Separate advancements from regular gifts
    const advancements = applicableGifts.filter(
      (gift) => gift.isSubjectToHotchpot && gift.isAdvancement,
    );

    const regularGifts = applicableGifts.filter(
      (gift) => !gift.isSubjectToHotchpot || !gift.isAdvancement,
    );

    // Calculate values
    const totalGiftsOriginal = this.sumGiftValues(applicableGifts, 'originalValue');
    const totalGiftsAdjusted = this.calculateAdjustedValues(
      applicableGifts,
      input.adjustmentMethod,
      input,
    );

    const advancementsOriginal = this.sumGiftValues(advancements, 'originalValue');
    const advancementsAdjusted = this.sumGiftValues(
      advancements.map((g) => ({
        ...g,
        currentAdjustedValue: this.adjustGiftValue(g, input.adjustmentMethod, input),
      })),
      'currentAdjustedValue',
    );

    // Apply minimum threshold
    const adjustedAfterThreshold = this.applyMinimumThreshold(
      advancementsAdjusted,
      input.minimumAdjustmentThreshold,
    );

    // Calculate adjustment percentage
    const adjustmentPercentage = this.calculateAdjustmentPercentage(
      adjustedAfterThreshold,
      input.netEstateValue,
    );

    // Determine adjustment status
    const adjustmentStatus = this.determineAdjustmentStatus(advancementsAdjusted, input);

    // Check for exemptions
    const isExempted = this.checkForExemptions(beneficiary, advancements, input);

    // Calculate impact on shares
    const preAdjustmentShare = beneficiary.intestateShare || beneficiary.testateShare;
    const postAdjustmentShare = preAdjustmentShare
      ? this.calculatePostAdjustmentShare(preAdjustmentShare, adjustedAfterThreshold)
      : undefined;

    const adjustmentImpact =
      postAdjustmentShare && preAdjustmentShare
        ? postAdjustmentShare.subtract(preAdjustmentShare)
        : Money.create({ amount: 0, currency: input.netEstateValue.currency }).getValue();

    // Add calculation notes
    if (advancements.length > 0) {
      calculationNotes.push(`${advancements.length} advancements found for ${beneficiary.name}`);
    }

    if (isExempted) {
      calculationNotes.push('Hotchpot adjustment exempted');
    }

    if (input.customaryLawApplicable) {
      calculationNotes.push('Customary law considerations applied');
      legalReferences.push('Customary Succession Rules');
    }

    // Check for disputes
    const isDisputed = advancements.some(
      (gift) => gift.conditionDetails && gift.conditionMet === false,
    );

    return {
      beneficiaryId: beneficiary.beneficiaryId,
      beneficiaryName: beneficiary.name,
      relationshipToDeceased: beneficiary.relationship,

      totalGiftsReceived: applicableGifts.length,
      totalGiftValueOriginal: totalGiftsOriginal,
      totalGiftValueAdjusted: totalGiftsAdjusted,

      advancementsCount: advancements.length,
      advancementsOriginalValue: advancementsOriginal,
      advancementsAdjustedValue: advancementsAdjusted,

      hotchpotAdjustmentAmount: adjustedAfterThreshold,
      adjustmentPercentage,

      adjustmentStatus,
      appliesToIntestateShare: !!beneficiary.intestateShare,
      appliesToTestateShare: !!beneficiary.testateShare,

      isExempted,
      exemptionReason: isExempted ? 'Customary law exemption' : undefined,
      exemptionAuthority: isExempted ? 'Clan Council' : undefined,
      exemptionDate: isExempted ? new Date() : undefined,

      isDisputed,
      disputeReason: isDisputed ? 'Conditional gifts with unmet conditions' : undefined,

      preAdjustmentShare,
      postAdjustmentShare,
      adjustmentImpact,

      calculationNotes,
      legalReferences,
      supportingCaseLaw: ['Estate of Njoroge v Njoroge [2010] eKLR'],

      calculatedAt: new Date(),
      calculatedBy: 'SYSTEM',
      version: 1,
    };
  }

  /**
   * Sum gift values
   */
  private static sumGiftValues(
    gifts: LifetimeGift[],
    valueField: 'originalValue' | 'currentAdjustedValue',
  ): Money {
    if (gifts.length === 0) {
      return Money.create({ amount: 0, currency: 'KES' }).getValue();
    }

    const total = gifts.reduce((sum, gift) => {
      const value = gift[valueField];
      if (!value) return sum;

      // Convert to base currency if needed
      // For simplicity, assuming all in same currency
      return sum + value.amount;
    }, 0);

    return Money.create({
      amount: total,
      currency: gifts[0][valueField]?.currency || 'KES',
    }).getValue();
  }

  /**
   * Calculate adjusted values for all gifts
   */
  private static calculateAdjustedValues(
    gifts: LifetimeGift[],
    method: HotchpotCalculationMethod,
    input: HotchpotCalculationInput,
  ): Money {
    if (gifts.length === 0) {
      return Money.create({ amount: 0, currency: 'KES' }).getValue();
    }

    const adjustedGifts = gifts.map((gift) => ({
      ...gift,
      currentAdjustedValue: this.adjustGiftValue(gift, method, input),
    }));

    return this.sumGiftValues(adjustedGifts, 'currentAdjustedValue');
  }

  /**
   * Adjust a single gift value based on method
   */
  private static adjustGiftValue(
    gift: LifetimeGift,
    method: HotchpotCalculationMethod,
    input: HotchpotCalculationInput,
  ): Money {
    if (!gift.isSubjectToHotchpot || !gift.isAdvancement) {
      return gift.originalValue;
    }

    switch (method) {
      case HotchpotCalculationMethod.NOMINAL_VALUE:
        return gift.originalValue;

      case HotchpotCalculationMethod.INFLATION_ADJUSTED:
        return this.adjustForInflation(gift, input);

      case HotchpotCalculationMethod.CURRENT_MARKET_VALUE:
        // For property gifts, would need current valuation
        // For now, return original value
        return gift.originalValue;

      case HotchpotCalculationMethod.COST_OF_LIVING_ADJUSTED:
        return this.adjustForCostOfLiving(gift, input);

      default:
        return gift.originalValue;
    }
  }

  /**
   * Adjust gift for inflation
   */
  private static adjustForInflation(gift: LifetimeGift, input: HotchpotCalculationInput): Money {
    const giftDate = gift.dateOfGift;
    const deathDate = input.dateOfDeath;

    // Calculate years between gift and death
    const yearsDiff = deathDate.getFullYear() - giftDate.getFullYear();

    if (yearsDiff <= 0) {
      return gift.originalValue;
    }

    // Use provided inflation rate or default Kenyan average
    const inflationRate = input.inflationRate || 0.05; // 5% default

    // Compound inflation
    const inflationFactor = Math.pow(1 + inflationRate, yearsDiff);
    const adjustedAmount = gift.originalValue.amount * inflationFactor;

    return Money.create({
      amount: adjustedAmount,
      currency: gift.originalValue.currency,
    }).getValue();
  }

  /**
   * Adjust for cost of living
   */
  private static adjustForCostOfLiving(gift: LifetimeGift, input: HotchpotCalculationInput): Money {
    // Similar to inflation but might use different index
    // For now, use inflation adjustment
    return this.adjustForInflation(gift, input);
  }

  /**
   * Apply minimum threshold
   */
  private static applyMinimumThreshold(adjustmentAmount: Money, threshold: Money): Money {
    if (adjustmentAmount.amount < threshold.amount) {
      return Money.create({ amount: 0, currency: adjustmentAmount.currency }).getValue();
    }

    return adjustmentAmount;
  }

  /**
   * Calculate adjustment as percentage of estate
   */
  private static calculateAdjustmentPercentage(
    adjustmentAmount: Money,
    estateValue: Money,
  ): Percentage {
    if (estateValue.amount === 0) {
      return Percentage.create({ value: 0 }).getValue();
    }

    const percentage = (adjustmentAmount.amount / estateValue.amount) * 100;
    return Percentage.create({ value: Math.min(100, percentage) }).getValue();
  }

  /**
   * Determine adjustment status
   */
  private static determineAdjustmentStatus(
    adjustmentAmount: Money,
    input: HotchpotCalculationInput,
  ): HotchpotAdjustmentStatus {
    if (adjustmentAmount.amount === 0) {
      return HotchpotAdjustmentStatus.WAIVED;
    }

    return HotchpotAdjustmentStatus.CALCULATED;
  }

  /**
   * Check for exemptions
   */
  private static checkForExemptions(
    beneficiary: HotchpotCalculationInput['beneficiaries'][0],
    advancements: LifetimeGift[],
    input: HotchpotCalculationInput,
  ): boolean {
    // Check customary exemptions
    if (input.customaryLawApplicable) {
      // Some customary laws exempt certain gifts
      const hasCustomaryExemption = advancements.some(
        (gift) => gift.isCustomaryGift && gift.customaryLawExemption,
      );

      if (hasCustomaryExemption) {
        return true;
      }
    }

    // Check court orders
    if (input.courtOrders) {
      const exemptionOrder = input.courtOrders.find(
        (order) => order.effect === 'EXEMPT' && order.details.includes(beneficiary.beneficiaryId),
      );

      if (exemptionOrder) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate post-adjustment share
   */
  private static calculatePostAdjustmentShare(
    originalShare: Money,
    adjustmentAmount: Money,
  ): Money {
    // Hotchpot adjustment REDUCES the share (advancements deducted)
    return originalShare.subtract(adjustmentAmount);
  }

  /**
   * Apply the adjustment (change status from CALCULATED to APPLIED)
   */
  public applyAdjustment(appliedBy: string): Result<void> {
    if (this.props.adjustmentStatus !== HotchpotAdjustmentStatus.CALCULATED) {
      return Result.fail(`Cannot apply adjustment with status: ${this.props.adjustmentStatus}`);
    }

    if (this.props.isExempted) {
      return Result.fail('Cannot apply exempted adjustment');
    }

    if (this.props.hotchpotAdjustmentAmount.amount <= 0) {
      return Result.fail('No adjustment amount to apply');
    }

    this.props.adjustmentStatus = HotchpotAdjustmentStatus.APPLIED;
    this.props.appliedAt = new Date();
    this.props.appliedBy = appliedBy;

    return Result.ok();
  }

  /**
   * Dispute the adjustment
   */
  public disputeAdjustment(reason: string): Result<void> {
    if (this.props.adjustmentStatus === HotchpotAdjustmentStatus.DISPUTED) {
      return Result.fail('Adjustment already disputed');
    }

    this.props.adjustmentStatus = HotchpotAdjustmentStatus.DISPUTED;
    this.props.disputeReason = reason;
    this.props.calculationNotes.push(`Disputed: ${reason}`);

    return Result.ok();
  }

  /**
   * Resolve dispute
   */
  public resolveDispute(resolution: string, resolvedBy: string): Result<void> {
    if (this.props.adjustmentStatus !== HotchpotAdjustmentStatus.DISPUTED) {
      return Result.fail('Adjustment is not disputed');
    }

    this.props.adjustmentStatus = HotchpotAdjustmentStatus.CALCULATED;
    this.props.disputeResolution = resolution;
    this.props.disputeResolvedAt = new Date();
    this.props.calculationNotes.push(`Dispute resolved: ${resolution} by ${resolvedBy}`);

    return Result.ok();
  }

  /**
   * Exempt the adjustment
   */
  public exemptAdjustment(
    reason: string,
    authority: string,
    exemptionDate: Date = new Date(),
  ): Result<void> {
    if (this.props.isExempted) {
      return Result.fail('Adjustment already exempted');
    }

    this.props.isExempted = true;
    this.props.exemptionReason = reason;
    this.props.exemptionAuthority = authority;
    this.props.exemptionDate = exemptionDate;
    this.props.adjustmentStatus = HotchpotAdjustmentStatus.EXEMPTED;
    this.props.calculationNotes.push(`Exempted by ${authority}: ${reason}`);

    return Result.ok();
  }

  /**
   * Get adjustment summary
   */
  public getSummary(): {
    beneficiaryName: string;
    relationship: string;
    adjustmentAmount: string;
    adjustmentStatus: string;
    impact: string;
    isExempted: boolean;
  } {
    return {
      beneficiaryName: this.props.beneficiaryName,
      relationship: this.props.relationshipToDeceased,
      adjustmentAmount: this.props.hotchpotAdjustmentAmount.toString(),
      adjustmentStatus: this.props.adjustmentStatus,
      impact: this.props.adjustmentImpact.toString(),
      isExempted: this.props.isExempted,
    };
  }

  /**
   * Get detailed gift breakdown
   */
  public getGiftBreakdown(): Array<{
    giftId: string;
    description: string;
    date: Date;
    originalValue: string;
    adjustedValue: string;
    isAdvancement: boolean;
    isSubjectToHotchpot: boolean;
  }> {
    // Note: This would need access to the original gifts data
    // For now, return simplified breakdown
    return [
      {
        giftId: 'summary',
        description: 'Total advancements',
        date: new Date(),
        originalValue: this.props.advancementsOriginalValue.toString(),
        adjustedValue: this.props.advancementsAdjustedValue.toString(),
        isAdvancement: true,
        isSubjectToHotchpot: true,
      },
    ];
  }

  /**
   * Check if adjustment is significant (> 5% of estate)
   */
  public isSignificantAdjustment(): boolean {
    return this.props.adjustmentPercentage.value > 5;
  }

  /**
   * Format adjustment for display
   */
  public formatForDisplay(): string {
    const summary = this.getSummary();

    let display = `Hotchpot Adjustment for ${summary.beneficiaryName}\n`;
    display += `========================================\n`;
    display += `Relationship: ${summary.relationship}\n`;
    display += `Adjustment Amount: ${summary.adjustmentAmount}\n`;
    display += `Status: ${summary.adjustmentStatus}\n`;
    display += `Impact on Share: ${summary.impact}\n`;
    display += `Exempted: ${summary.isExempted ? 'Yes' : 'No'}\n`;
    display += `\nCalculation Details:\n`;

    this.props.calculationNotes.forEach((note) => {
      display += `- ${note}\n`;
    });

    if (this.props.legalReferences.length > 0) {
      display += `\nLegal References:\n`;
      this.props.legalReferences.forEach((ref) => {
        display += `- ${ref}\n`;
      });
    }

    return display;
  }

  /**
   * Get the net adjustment (after exemptions, disputes, etc.)
   */
  public getNetAdjustment(): Money {
    if (this.props.isExempted || this.props.adjustmentStatus === HotchpotAdjustmentStatus.WAIVED) {
      return Money.create({
        amount: 0,
        currency: this.props.hotchpotAdjustmentAmount.currency,
      }).getValue();
    }

    return this.props.hotchpotAdjustmentAmount;
  }

  /**
   * Check if adjustment requires court approval
   */
  public requiresCourtApproval(): boolean {
    return (
      this.isSignificantAdjustment() ||
      this.props.isDisputed ||
      this.props.adjustmentStatus === HotchpotAdjustmentStatus.DISPUTED
    );
  }
}
