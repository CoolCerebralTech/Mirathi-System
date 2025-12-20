import { ValueObject } from '../../../base/value-object';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

interface DebtTermsProps {
  readonly principalAmount: Money;
  readonly interestRate: Percentage | null;
  readonly interestType: InterestType;
  readonly compoundingFrequency: CompoundingFrequency;
  readonly dueDate: Date | null;
  readonly securityDetails: string | null;
  readonly collateralDescription: string | null;
  readonly isSecured: boolean;
  readonly requiresCourtApproval: boolean;
}

export class DebtTerms extends ValueObject<DebtTermsProps> {
  private constructor(props: DebtTermsProps) {
    super(props);
  }

  public static create(props: {
    principalAmount: Money;
    interestRate?: number;
    interestType?: InterestType;
    compoundingFrequency?: CompoundingFrequency;
    dueDate?: Date;
    securityDetails?: string;
    collateralDescription?: string;
    isSecured?: boolean;
    requiresCourtApproval?: boolean;
  }): Result<DebtTerms> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.principalAmount, argumentName: 'principalAmount' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    // Principal must be positive
    if (props.principalAmount.amount <= 0) {
      return Result.fail('Principal amount must be positive');
    }

    // Validate interest rate if provided
    let interestRateVO: Percentage | null = null;
    if (props.interestRate !== undefined) {
      const interestRateResult = Percentage.create(props.interestRate);
      if (interestRateResult.isFailure) {
        return Result.fail(interestRateResult.errorValue());
      }
      interestRateVO = interestRateResult.getValue();

      // Kenyan interest rate caps (Banking Act)
      if (interestRateVO.value > 100) {
        return Result.fail('Interest rate cannot exceed 100% under Kenyan law');
      }

      if (props.interestRate > 20 && !props.isSecured) {
        // Warning: High interest rates for unsecured loans
        console.warn('Unsecured interest rates above 20% may be unenforceable in Kenyan courts');
      }
    }

    // Validate due date is not in the past for new debts
    if (props.dueDate && props.dueDate < new Date()) {
      return Result.fail('Due date cannot be in the past');
    }

    // Secured debts require security details
    if (props.isSecured && !props.securityDetails) {
      return Result.fail('Secured debts require security details');
    }

    return Result.ok(
      new DebtTerms({
        principalAmount: props.principalAmount,
        interestRate: interestRateVO,
        interestType: props.interestType || InterestType.SIMPLE,
        compoundingFrequency: props.compoundingFrequency || CompoundingFrequency.MONTHLY,
        dueDate: props.dueDate || null,
        securityDetails: props.securityDetails || null,
        collateralDescription: props.collateralDescription || null,
        isSecured: props.isSecured || false,
        requiresCourtApproval: props.requiresCourtApproval || false,
      }),
    );
  }

  get principalAmount(): Money {
    return this.props.principalAmount;
  }

  get interestRate(): Percentage | null {
    return this.props.interestRate;
  }

  get isSecured(): boolean {
    return this.props.isSecured;
  }

  // Calculate total outstanding amount
  public calculateOutstanding(asOfDate: Date = new Date()): Money {
    if (!this.props.interestRate || !this.props.dueDate || this.props.dueDate > asOfDate) {
      return this.props.principalAmount;
    }

    const monthsOutstanding = this.monthDiff(this.props.dueDate, asOfDate);
    if (monthsOutstanding <= 0) {
      return this.props.principalAmount;
    }

    let totalAmount = this.props.principalAmount.amount;

    switch (this.props.compoundingFrequency) {
      case CompoundingFrequency.MONTHLY:
        const monthlyRate = this.props.interestRate!.value / 12 / 100;
        totalAmount *= Math.pow(1 + monthlyRate, monthsOutstanding);
        break;
      case CompoundingFrequency.QUARTERLY:
        const quarterlyRate = this.props.interestRate!.value / 4 / 100;
        totalAmount *= Math.pow(1 + quarterlyRate, Math.ceil(monthsOutstanding / 3));
        break;
      case CompoundingFrequency.ANNUALLY:
        const annualRate = this.props.interestRate!.value / 100;
        totalAmount *= Math.pow(1 + annualRate, Math.ceil(monthsOutstanding / 12));
        break;
      default:
        // Simple interest
        totalAmount *= 1 + (this.props.interestRate!.value / 100) * (monthsOutstanding / 12);
    }

    return Money.create({
      amount: Math.round(totalAmount * 100) / 100,
      currency: this.props.principalAmount.currency,
    });
  }

  // Kenyan legal requirements for debt validity
  public getKenyanLegalRequirements(): string[] {
    const requirements: string[] = [];

    if (this.props.isSecured) {
      requirements.push('Security must be registered with relevant registry');
      requirements.push('Charge/mortgage must be in prescribed form under Kenyan law');
    }

    if (this.props.interestRate && this.props.interestRate.value > 0) {
      requirements.push('Interest rate must not be oppressive or unconscionable');
      requirements.push('Compound interest requires explicit agreement in writing');
    }

    if (this.props.requiresCourtApproval) {
      requirements.push('Debt settlement requires court approval during succession');
    }

    // Statute of limitations (Limitation Act)
    const limitationYears = this.props.isSecured ? 12 : 6;
    requirements.push(`Claim must be brought within ${limitationYears} years of default`);

    return requirements;
  }

  // Check if debt is statute barred
  public isStatuteBarred(dateOfDefault: Date): boolean {
    const limitationYears = this.props.isSecured ? 12 : 6;
    const limitationDate = new Date(dateOfDefault);
    limitationDate.setFullYear(limitationDate.getFullYear() + limitationYears);

    return new Date() > limitationDate;
  }

  // Get priority under S.45 LSA
  public getSection45Priority(): LiabilityTier {
    if (this.props.isSecured) {
      return LiabilityTier.SECURED_DEBTS;
    }

    // Check if it's a tax debt
    if (this.props.securityDetails && this.props.securityDetails.includes('KRA')) {
      return LiabilityTier.TAXES_RATES_WAGES;
    }

    return LiabilityTier.UNSECURED_GENERAL;
  }

  private monthDiff(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return Math.max(0, years * 12 + months);
  }
}

export enum InterestType {
  SIMPLE = 'SIMPLE',
  COMPOUND = 'COMPOUND',
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
  DEFAULT = 'DEFAULT',
}

export enum CompoundingFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  AT_MATURITY = 'AT_MATURITY',
}

// Liability Tier (for S.45 planning)
export enum LiabilityTier {
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES',
  SECURED_DEBTS = 'SECURED_DEBTS',
  TAXES_RATES_WAGES = 'TAXES_RATES_WAGES',
  UNSECURED_GENERAL = 'UNSECURED_GENERAL',
}
