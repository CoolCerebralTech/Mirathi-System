// domain/value-objects/executor-powers.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Executor Powers Value Object
 *
 * Kenyan Legal Context - Section 83 LSA:
 * "An executor or administrator shall have the following powers and duties..."
 *
 * Default Powers (S.83):
 * - Pay funeral expenses and debts (S.45 priority)
 * - Collect and preserve assets
 * - Sell assets (with or without court approval)
 * - Invest estate funds prudently
 * - Distribute to beneficiaries
 *
 * Testator can:
 * - GRANT additional powers (e.g., continue business)
 * - RESTRICT powers (e.g., require court approval for sales)
 * - REQUIRE bonding (S.72 LSA)
 *
 * Types of Executors:
 * - TESTAMENTARY: Appointed by will
 * - COURT_APPOINTED: Appointed by court when no will
 * - ADMINISTRATOR: Letters of administration (intestate)
 * - SPECIAL_EXECUTOR: Limited powers for specific purpose
 */
export enum ExecutorAppointmentType {
  TESTAMENTARY = 'TESTAMENTARY',
  COURT_APPOINTED = 'COURT_APPOINTED',
  ADMINISTRATOR = 'ADMINISTRATOR',
  SPECIAL_EXECUTOR = 'SPECIAL_EXECUTOR',
}

interface ExecutorPowersProps {
  appointmentType: ExecutorAppointmentType;

  // Core powers (default true)
  canPayDebts: boolean;
  canCollectAssets: boolean;
  canSellLand: boolean;
  canSellPersonalProperty: boolean;
  canInvestFunds: boolean;
  canDistribute: boolean;

  // Extended powers (must be explicitly granted)
  canContinueBusiness: boolean;
  canMortgageProperty: boolean;
  canCompromiseDebts: boolean;
  canLitigate: boolean;

  // Restrictions
  requiresCourtApprovalForSales: boolean;
  requiresBondPosting: boolean;
  bondAmountKES?: number;

  // Compensation
  isEntitledToCommission: boolean;
  commissionPercentage?: number;

  // Tenure
  powerStartDate?: Date;
  powerEndDate?: Date;

  // Special instructions
  specialInstructions?: string;
}

export class ExecutorPowers extends ValueObject<ExecutorPowersProps> {
  private constructor(props: ExecutorPowersProps) {
    super(props);
  }

  protected validate(): void {
    if (!Object.values(ExecutorAppointmentType).includes(this.props.appointmentType)) {
      throw new ValueObjectValidationError(
        `Invalid appointment type: ${this.props.appointmentType}`,
        'appointmentType',
      );
    }

    // Commission validation
    if (this.props.isEntitledToCommission && this.props.commissionPercentage !== undefined) {
      if (this.props.commissionPercentage < 0 || this.props.commissionPercentage > 5) {
        throw new ValueObjectValidationError(
          'Commission percentage must be between 0% and 5%',
          'commissionPercentage',
        );
      }
    }

    // Bond amount validation
    if (this.props.requiresBondPosting && !this.props.bondAmountKES) {
      throw new ValueObjectValidationError(
        'Bond amount must be specified if bond is required',
        'bondAmountKES',
      );
    }

    if (this.props.bondAmountKES && this.props.bondAmountKES < 0) {
      throw new ValueObjectValidationError('Bond amount cannot be negative', 'bondAmountKES');
    }

    // Date validation
    if (
      this.props.powerStartDate &&
      this.props.powerEndDate &&
      this.props.powerEndDate < this.props.powerStartDate
    ) {
      throw new ValueObjectValidationError(
        'Power end date cannot be before start date',
        'powerEndDate',
      );
    }
  }

  // Factory: Standard testamentary executor powers
  static standard(): ExecutorPowers {
    return new ExecutorPowers({
      appointmentType: ExecutorAppointmentType.TESTAMENTARY,
      canPayDebts: true,
      canCollectAssets: true,
      canSellLand: true,
      canSellPersonalProperty: true,
      canInvestFunds: true,
      canDistribute: true,
      canContinueBusiness: false,
      canMortgageProperty: false,
      canCompromiseDebts: false,
      canLitigate: true,
      requiresCourtApprovalForSales: false,
      requiresBondPosting: false,
      isEntitledToCommission: true,
      commissionPercentage: 2.5, // Standard 2.5% of estate value
    });
  }

  // Factory: Restricted powers (conservative testator)
  static restricted(): ExecutorPowers {
    return new ExecutorPowers({
      appointmentType: ExecutorAppointmentType.TESTAMENTARY,
      canPayDebts: true,
      canCollectAssets: true,
      canSellLand: false, // Requires court approval
      canSellPersonalProperty: true,
      canInvestFunds: false,
      canDistribute: true,
      canContinueBusiness: false,
      canMortgageProperty: false,
      canCompromiseDebts: false,
      canLitigate: false,
      requiresCourtApprovalForSales: true,
      requiresBondPosting: true,
      isEntitledToCommission: true,
      commissionPercentage: 1.5,
    });
  }

  // Factory: Extended powers (business owner testator)
  static extended(): ExecutorPowers {
    return new ExecutorPowers({
      appointmentType: ExecutorAppointmentType.TESTAMENTARY,
      canPayDebts: true,
      canCollectAssets: true,
      canSellLand: true,
      canSellPersonalProperty: true,
      canInvestFunds: true,
      canDistribute: true,
      canContinueBusiness: true, // Can continue running business
      canMortgageProperty: true, // Can raise capital
      canCompromiseDebts: true, // Can negotiate settlements
      canLitigate: true,
      requiresCourtApprovalForSales: false,
      requiresBondPosting: false,
      isEntitledToCommission: true,
      commissionPercentage: 3.0,
    });
  }

  // Factory: Court-appointed administrator
  static administrator(): ExecutorPowers {
    return new ExecutorPowers({
      appointmentType: ExecutorAppointmentType.ADMINISTRATOR,
      canPayDebts: true,
      canCollectAssets: true,
      canSellLand: true,
      canSellPersonalProperty: true,
      canInvestFunds: true,
      canDistribute: true,
      canContinueBusiness: false,
      canMortgageProperty: false,
      canCompromiseDebts: false,
      canLitigate: true,
      requiresCourtApprovalForSales: true, // Always for administrators
      requiresBondPosting: true, // Usually required
      isEntitledToCommission: true,
      commissionPercentage: 2.0,
    });
  }

  // Factory: Special/limited executor
  static special(purpose: string): ExecutorPowers {
    return new ExecutorPowers({
      appointmentType: ExecutorAppointmentType.SPECIAL_EXECUTOR,
      canPayDebts: false,
      canCollectAssets: true,
      canSellLand: false,
      canSellPersonalProperty: false,
      canInvestFunds: false,
      canDistribute: false,
      canContinueBusiness: false,
      canMortgageProperty: false,
      canCompromiseDebts: false,
      canLitigate: false,
      requiresCourtApprovalForSales: true,
      requiresBondPosting: true,
      isEntitledToCommission: false,
      specialInstructions: purpose,
    });
  }

  // Query methods
  public getAppointmentType(): ExecutorAppointmentType {
    return this.props.appointmentType;
  }

  public canPerformAction(action: string): boolean {
    const actionMap: Record<string, boolean> = {
      payDebts: this.props.canPayDebts,
      collectAssets: this.props.canCollectAssets,
      sellLand: this.props.canSellLand,
      sellPersonalProperty: this.props.canSellPersonalProperty,
      investFunds: this.props.canInvestFunds,
      distribute: this.props.canDistribute,
      continueBusiness: this.props.canContinueBusiness,
      mortgageProperty: this.props.canMortgageProperty,
      compromiseDebts: this.props.canCompromiseDebts,
      litigate: this.props.canLitigate,
    };

    return actionMap[action] ?? false;
  }

  public requiresCourtApproval(action: string): boolean {
    if (this.props.requiresCourtApprovalForSales) {
      return ['sellLand', 'sellPersonalProperty', 'mortgageProperty'].includes(action);
    }

    // Land sales often require court approval even without restriction
    if (action === 'sellLand' && !this.props.canSellLand) {
      return true;
    }

    return false;
  }

  public requiresBond(): boolean {
    return this.props.requiresBondPosting;
  }

  public getBondAmount(): number | undefined {
    return this.props.bondAmountKES;
  }

  public getCommissionRate(): number {
    return this.props.commissionPercentage ?? 0;
  }

  public isEntitledToCommission(): boolean {
    return this.props.isEntitledToCommission;
  }

  public hasExtendedPowers(): boolean {
    return (
      this.props.canContinueBusiness ||
      this.props.canMortgageProperty ||
      this.props.canCompromiseDebts
    );
  }

  public isLimited(): boolean {
    return this.props.appointmentType === ExecutorAppointmentType.SPECIAL_EXECUTOR;
  }

  public getSpecialInstructions(): string | undefined {
    return this.props.specialInstructions;
  }

  // Business logic: Grant additional power
  public grantPower(power: keyof ExecutorPowersProps): ExecutorPowers {
    if (typeof this.props[power] !== 'boolean') {
      throw new Error(`Cannot grant non-boolean power: ${power}`);
    }

    return new ExecutorPowers({
      ...this.props,
      [power]: true,
    });
  }

  // Business logic: Revoke power
  public revokePower(power: keyof ExecutorPowersProps): ExecutorPowers {
    if (typeof this.props[power] !== 'boolean') {
      throw new Error(`Cannot revoke non-boolean power: ${power}`);
    }

    return new ExecutorPowers({
      ...this.props,
      [power]: false,
    });
  }

  // Business logic: Set bond requirement
  public requireBond(amountKES: number): ExecutorPowers {
    return new ExecutorPowers({
      ...this.props,
      requiresBondPosting: true,
      bondAmountKES: amountKES,
    });
  }

  // Business logic: Calculate commission
  public calculateCommission(estateValueKES: number): number {
    if (!this.props.isEntitledToCommission || !this.props.commissionPercentage) {
      return 0;
    }

    return (estateValueKES * this.props.commissionPercentage) / 100;
  }

  public toJSON(): Record<string, any> {
    return {
      appointmentType: this.props.appointmentType,
      corePowers: {
        canPayDebts: this.props.canPayDebts,
        canCollectAssets: this.props.canCollectAssets,
        canSellLand: this.props.canSellLand,
        canSellPersonalProperty: this.props.canSellPersonalProperty,
        canInvestFunds: this.props.canInvestFunds,
        canDistribute: this.props.canDistribute,
      },
      extendedPowers: {
        canContinueBusiness: this.props.canContinueBusiness,
        canMortgageProperty: this.props.canMortgageProperty,
        canCompromiseDebts: this.props.canCompromiseDebts,
        canLitigate: this.props.canLitigate,
      },
      restrictions: {
        requiresCourtApprovalForSales: this.props.requiresCourtApprovalForSales,
        requiresBondPosting: this.props.requiresBondPosting,
        bondAmountKES: this.props.bondAmountKES,
      },
      compensation: {
        isEntitledToCommission: this.props.isEntitledToCommission,
        commissionPercentage: this.props.commissionPercentage,
      },
      tenure: {
        powerStartDate: this.props.powerStartDate?.toISOString(),
        powerEndDate: this.props.powerEndDate?.toISOString(),
      },
      specialInstructions: this.props.specialInstructions,
    };
  }
}
