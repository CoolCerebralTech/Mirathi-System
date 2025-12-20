import { ValueObject } from '../../../shared/base/vo.base';
import { Result } from '../../../shared/core/result';
import { Money } from '../../../shared/money.vo';

export interface PolygamousHouse {
  houseId: string;
  houseName: string;
  houseOrder: number; // 1st, 2nd, 3rd house
  spouseId: string;
  spouseName: string;

  // Children in this house
  children: Array<{
    childId: string;
    name: string;
    age: number;
    isMinor: boolean;
    isDeceased: boolean;
    hasChildren: boolean;
  }>;

  // House-specific property
  separatePropertyValue?: Money;
  houseBusinessValue?: Money;

  // Customary considerations
  bridePricePaid: boolean;
  bridePriceAmount?: Money;
  customaryMarriageDate?: Date;
}

export interface S40CalculationInput {
  // Estate Information
  netEstateValue: Money;
  personalChattelsValue: Money;

  // Polygamous Structure
  houses: PolygamousHouse[];
  totalHouses: number;

  // Deceased Information
  deceasedGender: 'MALE' | 'FEMALE';
  customaryEthnicGroup?: string; // For customary law variations

  // Hotchpot Data
  lifetimeGiftsByHouse: Record<
    string,
    Array<{
      recipientId: string;
      giftValue: Money;
      giftDate: Date;
      isAdvancement: boolean;
    }>
  >;

  // Special Provisions
  houseSharePercentages?: Record<string, number>; // Optional override percentages
  courtOrderedDistribution?: Record<string, Money>; // Court-mandated distribution
}

export interface S40HouseShare {
  houseId: string;
  houseName: string;
  houseOrder: number;

  // Calculated Shares
  shareOfPersonalChattels?: Money;
  shareOfEstate: Money;
  totalHouseShare: Money;

  // Per Capita Distribution within House
  spouseShare?: Money;
  childrenShares: Array<{
    childId: string;
    name: string;
    share: Money;
    isMinor: boolean;
  }>;

  // Hotchpot Adjustments
  hotchpotAdjustment?: Money;
  hotchpotAdjusted: boolean;

  // Customary Adjustments
  bridePriceConsideration?: Money;
  customaryAdjustment?: Money;

  // Legal Notes
  notes: string[];
}

export interface S40CalculationResult {
  // Legal Framework
  appliedSection: 'S40(1)' | 'S40(2)' | 'CUSTOMARY';
  calculationMethod: 'EQUAL_HOUSES' | 'PER_CAPITA' | 'COURT_ORDERED' | 'CUSTOMARY';

  // House Distribution
  perHouseShare: Money;
  houseShares: S40HouseShare[];

  // Totals
  totalDistributed: Money;
  unallocatedAmount?: Money;

  // Statistical Data
  totalChildren: number;
  totalMinorChildren: number;
  averageChildrenPerHouse: number;

  // Legal Compliance
  compliesWithS40: boolean;
  requiresCustomaryLawConsideration: boolean;
  requiresCourtApproval: boolean;

  // Metadata
  notes: string[];
  warnings: string[];
  calculatedAt: Date;
  calculatedBy: string;
  version: number;
}

export class Section40Calculation extends ValueObject<S40CalculationResult> {
  get appliedSection(): string {
    return this.props.appliedSection;
  }
  get perHouseShare(): Money {
    return this.props.perHouseShare;
  }
  get houseShares(): S40HouseShare[] {
    return this.props.houseShares;
  }
  get compliesWithS40(): boolean {
    return this.props.compliesWithS40;
  }
  get requiresCourtApproval(): boolean {
    return this.props.requiresCourtApproval;
  }

  private constructor(props: S40CalculationResult) {
    super(props);
  }

  /**
   * Calculate polygamous succession under Section 40 LSA
   */
  public static calculate(input: S40CalculationInput): Result<Section40Calculation> {
    const validationResult = this.validateInput(input);
    if (validationResult.isFailure) {
      return Result.fail<Section40Calculation>(validationResult.getErrorValue());
    }

    // Determine applicable section and method
    const { appliedSection, calculationMethod } = this.determineApplicableMethod(input);

    // Calculate distribution
    const result = this.performCalculation(input, appliedSection, calculationMethod);

    return Result.ok<Section40Calculation>(new Section40Calculation(result));
  }

  /**
   * Validate input data
   */
  private static validateInput(input: S40CalculationInput): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (input.netEstateValue.amount <= 0) {
      errors.push('Net estate value must be greater than zero');
    }

    if (input.houses.length === 0) {
      errors.push('At least one polygamous house must be specified');
    }

    if (input.houses.length !== input.totalHouses) {
      errors.push('Number of houses must match total houses specified');
    }

    // House order validation
    const houseOrders = input.houses.map((h) => h.houseOrder);
    const uniqueOrders = new Set(houseOrders);
    if (uniqueOrders.size !== houseOrders.length) {
      errors.push('House orders must be unique');
    }

    // Check for proper ordering
    const sortedOrders = [...houseOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        errors.push('House orders must be sequential starting from 1');
        break;
      }
    }

    // Validate share percentages if provided
    if (input.houseSharePercentages) {
      const totalPercentage = Object.values(input.houseSharePercentages).reduce((a, b) => a + b, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        errors.push('House share percentages must total 100%');
      }
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Determine applicable section and calculation method
   */
  private static determineApplicableMethod(input: S40CalculationInput): {
    appliedSection: string;
    calculationMethod: string;
  } {
    // Check for court-ordered distribution
    if (input.courtOrderedDistribution && Object.keys(input.courtOrderedDistribution).length > 0) {
      return { appliedSection: 'S40(2)', calculationMethod: 'COURT_ORDERED' };
    }

    // Check for custom percentages
    if (input.houseSharePercentages) {
      return { appliedSection: 'S40(2)', calculationMethod: 'EQUAL_HOUSES' };
    }

    // Default: Equal division among houses (S.40(1))
    return { appliedSection: 'S40(1)', calculationMethod: 'EQUAL_HOUSES' };
  }

  /**
   * Perform the calculation
   */
  private static performCalculation(
    input: S40CalculationInput,
    section: string,
    method: string,
  ): S40CalculationResult {
    const notes: string[] = [];
    const warnings: string[] = [];
    let requiresCourtApproval = false;

    // Calculate per-house share
    const perHouseShare = this.calculatePerHouseShare(input, method);

    // Calculate distribution for each house
    const houseShares = this.calculateHouseShares(input, perHouseShare, method);

    // Calculate totals
    const totalDistributed = this.calculateTotalDistributed(houseShares);
    const unallocatedAmount = input.netEstateValue.subtract(totalDistributed);

    // Statistical data
    const totalChildren = this.calculateTotalChildren(input);
    const totalMinorChildren = this.calculateTotalMinorChildren(input);
    const averageChildrenPerHouse = totalChildren / input.houses.length;

    // Legal compliance checks
    const compliesWithS40 = this.checkS40Compliance(input, houseShares);
    const requiresCustomaryLawConsideration = this.requiresCustomaryLawConsideration(input);

    // Check for court approval requirements
    if (totalMinorChildren > 0) {
      requiresCourtApproval = true;
      notes.push("Court approval required for minor children's shares");
    }

    if (input.houses.some((house) => house.separatePropertyValue)) {
      notes.push('Separate property considerations may affect distribution');
    }

    return {
      appliedSection: section as any,
      calculationMethod: method as any,
      perHouseShare,
      houseShares,
      totalDistributed,
      unallocatedAmount: unallocatedAmount.amount > 0.01 ? unallocatedAmount : undefined,
      totalChildren,
      totalMinorChildren,
      averageChildrenPerHouse,
      compliesWithS40,
      requiresCustomaryLawConsideration,
      requiresCourtApproval,
      notes,
      warnings,
      calculatedAt: new Date(),
      calculatedBy: 'SYSTEM',
      version: 1,
    };
  }

  /**
   * Calculate per-house share
   */
  private static calculatePerHouseShare(input: S40CalculationInput, method: string): Money {
    switch (method) {
      case 'COURT_ORDERED':
        // Court-ordered amounts already specified
        const totalCourtOrdered = Object.values(input.courtOrderedDistribution || {}).reduce(
          (sum, amount) => sum.add(amount),
          Money.create({ amount: 0, currency: input.netEstateValue.currency }).getValue(),
        );
        return totalCourtOrdered.divide(input.houses.length);

      case 'EQUAL_HOUSES':
        // Equal division among houses (S.40(1))
        return input.netEstateValue.divide(input.houses.length);

      case 'PER_CAPITA':
        // Per capita division (total estate divided by total beneficiaries)
        const totalBeneficiaries = this.calculateTotalBeneficiaries(input);
        return input.netEstateValue.divide(totalBeneficiaries);

      case 'CUSTOMARY':
        // Customary law may have different rules
        // For now, use equal division
        return input.netEstateValue.divide(input.houses.length);

      default:
        return input.netEstateValue.divide(input.houses.length);
    }
  }

  /**
   * Calculate total number of beneficiaries
   */
  private static calculateTotalBeneficiaries(input: S40CalculationInput): number {
    let total = 0;

    input.houses.forEach((house) => {
      // Count spouse
      total += 1;

      // Count children
      total += house.children.filter((child) => !child.isDeceased || child.hasChildren).length;
    });

    return total;
  }

  /**
   * Calculate house shares
   */
  private static calculateHouseShares(
    input: S40CalculationInput,
    basePerHouseShare: Money,
    method: string,
  ): S40HouseShare[] {
    return input.houses.map((house) => {
      // Calculate base share for this house
      let houseShare = basePerHouseShare;

      // Apply custom percentages if specified
      if (method === 'EQUAL_HOUSES' && input.houseSharePercentages?.[house.houseId]) {
        const percentage = input.houseSharePercentages[house.houseId] / 100;
        houseShare = input.netEstateValue.multiply(percentage);
      }

      // Apply court-ordered amounts if specified
      if (method === 'COURT_ORDERED' && input.courtOrderedDistribution?.[house.houseId]) {
        houseShare = input.courtOrderedDistribution[house.houseId];
      }

      // Add separate property for this house
      if (house.separatePropertyValue) {
        houseShare = houseShare.add(house.separatePropertyValue);
      }

      // Calculate hotchpot adjustment
      const hotchpotAdjustment = this.calculateHouseHotchpotAdjustment(input, house.houseId);
      let hotchpotAdjusted = false;

      if (hotchpotAdjustment && hotchpotAdjustment.amount > 0) {
        houseShare = houseShare.subtract(hotchpotAdjustment);
        hotchpotAdjusted = true;
      }

      // Calculate bride price consideration
      const bridePriceConsideration = this.calculateBridePriceConsideration(house);

      // Calculate spouse and children shares within house
      const { spouseShare, childrenShares } = this.calculateIntraHouseDistribution(
        house,
        houseShare,
        hotchpotAdjustment,
      );

      // Calculate customary adjustments
      const customaryAdjustment = this.calculateCustomaryAdjustment(
        house,
        input.customaryEthnicGroup,
      );

      // Apply customary adjustment if any
      if (customaryAdjustment) {
        houseShare = houseShare.add(customaryAdjustment);
      }

      const notes: string[] = [];
      if (house.bridePricePaid) {
        notes.push(`Bride price of ${house.bridePriceAmount?.toString() || 'unknown'} was paid`);
      }

      if (house.customaryMarriageDate) {
        notes.push(`Customary marriage on ${house.customaryMarriageDate.toLocaleDateString()}`);
      }

      return {
        houseId: house.houseId,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        shareOfEstate: houseShare,
        totalHouseShare: houseShare,
        spouseShare,
        childrenShares,
        hotchpotAdjustment,
        hotchpotAdjusted,
        bridePriceConsideration,
        customaryAdjustment,
        notes,
      };
    });
  }

  /**
   * Calculate hotchpot adjustment for a house
   */
  private static calculateHouseHotchpotAdjustment(
    input: S40CalculationInput,
    houseId: string,
  ): Money | undefined {
    const gifts = input.lifetimeGiftsByHouse?.[houseId] || [];
    const advancementGifts = gifts.filter((gift) => gift.isAdvancement);

    if (advancementGifts.length === 0) {
      return undefined;
    }

    const totalAdvancements = advancementGifts.reduce(
      (sum, gift) => sum + gift.giftValue.amount,
      0,
    );

    return Money.create({
      amount: totalAdvancements,
      currency: input.netEstateValue.currency,
    }).getValue();
  }

  /**
   * Calculate bride price consideration
   */
  private static calculateBridePriceConsideration(house: PolygamousHouse): Money | undefined {
    if (!house.bridePricePaid || !house.bridePriceAmount) {
      return undefined;
    }

    // Bride price may be deducted from the house's share in some customary systems
    // For now, we just note the amount
    return house.bridePriceAmount;
  }

  /**
   * Calculate customary adjustment based on ethnic group
   */
  private static calculateCustomaryAdjustment(
    house: PolygamousHouse,
    ethnicGroup?: string,
  ): Money | undefined {
    if (!ethnicGroup) {
      return undefined;
    }

    // Different ethnic groups have different customary rules
    // This is a simplified placeholder implementation
    switch (ethnicGroup.toUpperCase()) {
      case 'KIKUYU':
        // Kikuyu customary law might favor first house
        if (house.houseOrder === 1) {
          return Money.create({
            amount: house.separatePropertyValue?.amount || 0 * 0.1,
            currency: 'KES',
          }).getValue();
        }
        break;

      case 'LUO':
        // Luo customary law might have different rules
        if (house.houseOrder > 1) {
          return Money.create({
            amount: -(house.separatePropertyValue?.amount || 0 * 0.05),
            currency: 'KES',
          }).getValue();
        }
        break;

      // Add other ethnic groups as needed
    }

    return undefined;
  }

  /**
   * Calculate distribution within a house
   */
  private static calculateIntraHouseDistribution(
    house: PolygamousHouse,
    houseShare: Money,
    hotchpotAdjustment?: Money,
  ): {
    spouseShare?: Money;
    childrenShares: Array<{ childId: string; name: string; share: Money; isMinor: boolean }>;
  } {
    const childrenShares: Array<{ childId: string; name: string; share: Money; isMinor: boolean }> =
      [];

    // Filter living children and children who left issue
    const eligibleChildren = house.children.filter(
      (child) => !child.isDeceased || child.hasChildren,
    );

    if (eligibleChildren.length === 0) {
      // If no children, spouse gets entire house share
      return {
        spouseShare: houseShare,
        childrenShares: [],
      };
    }

    // Under Kenyan law, spouse gets a portion and children get the rest
    // For polygamous houses, the spouse typically gets a life interest or fixed portion
    const spousePercentage = 0.333; // Approximately 1/3 for spouse
    const childrenPercentage = 1 - spousePercentage;

    const spouseShareAmount = houseShare.amount * spousePercentage;
    const childrenShareAmount = houseShare.amount * childrenPercentage;

    const perChildShare = childrenShareAmount / eligibleChildren.length;

    // Create children shares
    eligibleChildren.forEach((child) => {
      childrenShares.push({
        childId: child.childId,
        name: child.name,
        share: Money.create({ amount: perChildShare, currency: houseShare.currency }).getValue(),
        isMinor: child.isMinor,
      });
    });

    // Adjust for deceased children with issue (representation)
    const deceasedChildrenWithIssue = house.children.filter(
      (child) => child.isDeceased && child.hasChildren,
    );
    if (deceasedChildrenWithIssue.length > 0) {
      // Their share would be divided among their children
      // Simplified implementation
      notes.push(
        `House ${house.houseName}: Deceased children with issue require representation calculation`,
      );
    }

    return {
      spouseShare: Money.create({
        amount: spouseShareAmount,
        currency: houseShare.currency,
      }).getValue(),
      childrenShares,
    };
  }

  /**
   * Calculate total distributed amount
   */
  private static calculateTotalDistributed(houseShares: S40HouseShare[]): Money {
    const total = houseShares.reduce(
      (sum, house) => {
        return sum.add(house.totalHouseShare);
      },
      Money.create({
        amount: 0,
        currency: houseShares[0]?.totalHouseShare.currency || 'KES',
      }).getValue(),
    );

    return total;
  }

  /**
   * Calculate total children across all houses
   */
  private static calculateTotalChildren(input: S40CalculationInput): number {
    return input.houses.reduce((total, house) => {
      return (
        total + house.children.filter((child) => !child.isDeceased || child.hasChildren).length
      );
    }, 0);
  }

  /**
   * Calculate total minor children
   */
  private static calculateTotalMinorChildren(input: S40CalculationInput): number {
    return input.houses.reduce((total, house) => {
      return (
        total +
        house.children.filter((child) => child.isMinor && (!child.isDeceased || child.hasChildren))
          .length
      );
    }, 0);
  }

  /**
   * Check S.40 compliance
   */
  private static checkS40Compliance(
    input: S40CalculationInput,
    houseShares: S40HouseShare[],
  ): boolean {
    // Basic compliance checks

    // 1. All houses must receive a share
    if (houseShares.length !== input.houses.length) {
      return false;
    }

    // 2. No house should receive negative share
    if (houseShares.some((house) => house.totalHouseShare.amount < 0)) {
      return false;
    }

    // 3. Total distributed should not exceed net estate value
    const totalDistributed = this.calculateTotalDistributed(houseShares);
    if (totalDistributed.amount > input.netEstateValue.amount * 1.01) {
      // Allow 1% rounding error
      return false;
    }

    // 4. If court-ordered, must match court orders
    if (input.courtOrderedDistribution) {
      for (const [houseId, courtAmount] of Object.entries(input.courtOrderedDistribution)) {
        const houseShare = houseShares.find((h) => h.houseId === houseId);
        if (
          !houseShare ||
          Math.abs(houseShare.totalHouseShare.amount - courtAmount.amount) > 0.01
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if customary law consideration is required
   */
  private static requiresCustomaryLawConsideration(input: S40CalculationInput): boolean {
    return (
      !!input.customaryEthnicGroup ||
      input.houses.some((house) => house.bridePricePaid || house.customaryMarriageDate)
    );
  }

  /**
   * Get summary of calculation
   */
  public getSummary(): {
    totalHouses: number;
    perHouseShare: string;
    totalDistributed: string;
    totalChildren: number;
    compliesWithS40: boolean;
  } {
    return {
      totalHouses: this.props.houseShares.length,
      perHouseShare: this.props.perHouseShare.toString(),
      totalDistributed: this.props.totalDistributed.toString(),
      totalChildren: this.props.totalChildren,
      compliesWithS40: this.props.compliesWithS40,
    };
  }

  /**
   * Get house-by-house breakdown
   */
  public getHouseBreakdown(): Array<{
    houseName: string;
    houseOrder: number;
    totalShare: string;
    spouseShare?: string;
    childrenCount: number;
    minorChildrenCount: number;
  }> {
    return this.props.houseShares.map((house) => {
      const minorChildrenCount = house.childrenShares.filter((child) => child.isMinor).length;

      return {
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        totalShare: house.totalHouseShare.toString(),
        spouseShare: house.spouseShare?.toString(),
        childrenCount: house.childrenShares.length,
        minorChildrenCount,
      };
    });
  }

  /**
   * Format calculation for display
   */
  public formatForDisplay(): string {
    const summary = this.getSummary();
    const houseBreakdown = this.getHouseBreakdown();

    let display = `Section ${this.props.appliedSection} Calculation (Polygamous)\n`;
    display += `=================================================\n`;
    display += `Total Houses: ${summary.totalHouses}\n`;
    display += `Per House Share: ${summary.perHouseShare}\n`;
    display += `Total Distributed: ${summary.totalDistributed}\n`;
    display += `Total Children: ${summary.totalChildren}\n`;
    display += `S.40 Compliant: ${summary.compliesWithS40 ? 'Yes' : 'No'}\n`;

    display += `\nHouse Breakdown:\n`;
    houseBreakdown.forEach((house) => {
      display += `\n${house.houseOrder}. ${house.houseName}:\n`;
      display += `  Total Share: ${house.totalShare}\n`;
      if (house.spouseShare) {
        display += `  Spouse Share: ${house.spouseShare}\n`;
      }
      display += `  Children: ${house.childrenCount} (${house.minorChildrenCount} minors)\n`;
    });

    if (this.props.warnings.length > 0) {
      display += `\nWarnings:\n`;
      this.props.warnings.forEach((warning) => {
        display += `- ${warning}\n`;
      });
    }

    if (this.props.notes.length > 0) {
      display += `\nNotes:\n`;
      this.props.notes.forEach((note) => {
        display += `- ${note}\n`;
      });
    }

    if (this.props.requiresCourtApproval) {
      display += `\n⚠️  COURT APPROVAL REQUIRED\n`;
    }

    return display;
  }

  /**
   * Get calculation metadata
   */
  public getMetadata(): {
    calculatedAt: Date;
    calculatedBy: string;
    version: number;
    method: string;
  } {
    return {
      calculatedAt: this.props.calculatedAt,
      calculatedBy: this.props.calculatedBy,
      version: this.props.version,
      method: this.props.calculationMethod,
    };
  }
}
