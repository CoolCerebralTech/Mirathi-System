import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export class InvalidDebtTermsException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_DEBT_TERMS');
  }
}

export enum InterestType {
  SIMPLE = 'SIMPLE',
  COMPOUND = 'COMPOUND',
  FIXED = 'FIXED',
  VARIABLE = 'VARIABLE',
  DEFAULT = 'DEFAULT', // S.45 Statutory default
}

export enum CompoundingFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  AT_MATURITY = 'AT_MATURITY',
}

interface DebtTermsProps {
  principalAmount: Money;
  interestRate?: Percentage;
  interestType: InterestType;
  compoundingFrequency: CompoundingFrequency;
  dueDate?: Date;
  securityDetails?: string;
  collateralDescription?: string;
  isSecured: boolean;
  requiresCourtApproval: boolean;
}

export class DebtTerms extends ValueObject<DebtTermsProps> {
  private constructor(props: DebtTermsProps) {
    super(props);
  }

  protected validate(): void {
    // 1. Principal must be positive
    if (this.props.principalAmount.amount <= 0) {
      throw new InvalidDebtTermsException('Principal amount must be positive');
    }

    // 2. Kenyan Banking Act / Court Limitations on Interest
    if (this.props.interestRate) {
      // Rates > 100% are generally unconscionable/illegal "in duplum" rule application usually caps total interest,
      // but a base rate of >100% is invalid on face.
      if (this.props.interestRate.value > 100) {
        throw new InvalidDebtTermsException('Interest rate cannot exceed 100%');
      }
    }

    // 3. Secured Debt Requirements
    if (this.props.isSecured) {
      if (!this.props.securityDetails && !this.props.collateralDescription) {
        throw new InvalidDebtTermsException(
          'Secured debts must specify security details or collateral',
        );
      }
    }

    // 4. Date Validation
    if (this.props.dueDate && isNaN(this.props.dueDate.getTime())) {
      throw new InvalidDebtTermsException('Invalid due date');
    }
  }

  static create(props: {
    principalAmount: Money;
    interestRate?: Percentage;
    interestType?: InterestType;
    compoundingFrequency?: CompoundingFrequency;
    dueDate?: Date;
    securityDetails?: string;
    collateralDescription?: string;
    isSecured?: boolean;
    requiresCourtApproval?: boolean;
  }): DebtTerms {
    return new DebtTerms({
      principalAmount: props.principalAmount,
      interestRate: props.interestRate,
      interestType: props.interestType || InterestType.SIMPLE,
      compoundingFrequency: props.compoundingFrequency || CompoundingFrequency.AT_MATURITY,
      dueDate: props.dueDate,
      securityDetails: props.securityDetails,
      collateralDescription: props.collateralDescription,
      isSecured: props.isSecured || false,
      requiresCourtApproval: props.requiresCourtApproval || false,
    });
  }

  // --- Business Logic ---

  isPastDue(): boolean {
    if (!this.props.dueDate) return false;
    return new Date() > this.props.dueDate;
  }

  isStatuteBarred(defaultDate: Date): boolean {
    // Limitation of Actions Act (Cap 22)
    // Contract/Tort: 6 years. Secured/Land: 12 years.
    const limitationYears = this.props.isSecured ? 12 : 6;
    const expiry = new Date(defaultDate);
    expiry.setFullYear(expiry.getFullYear() + limitationYears);
    return new Date() > expiry;
  }

  // --- Getters ---
  get principal(): Money {
    return this.props.principalAmount;
  }
  get interestRate(): Percentage | undefined {
    return this.props.interestRate;
  }
  get isSecured(): boolean {
    return this.props.isSecured;
  }

  public toJSON(): Record<string, any> {
    return {
      principal: this.props.principalAmount.toJSON(),
      interestRate: this.props.interestRate?.toJSON(),
      type: this.props.interestType,
      isSecured: this.props.isSecured,
      dueDate: this.props.dueDate,
      isPastDue: this.isPastDue(),
    };
  }
}
