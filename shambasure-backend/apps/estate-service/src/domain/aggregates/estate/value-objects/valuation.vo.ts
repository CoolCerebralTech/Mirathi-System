import { ValueObject } from '../../../base/value-object';
import { Guard } from '../../../core/guard';
import { Result } from '../../../core/result';
import { Money } from '../../../shared/money.vo';

interface ValuationProps {
  readonly value: Money;
  readonly valuationDate: Date;
  readonly method: ValuationMethod;
  readonly valuedBy: string;
  readonly isRegisteredValuer: boolean;
  readonly valuerRegistrationNumber: string | null;
  readonly purpose: ValuationPurpose;
  readonly reportUrl: string | null;
}

export class Valuation extends ValueObject<ValuationProps> {
  private constructor(props: ValuationProps) {
    super(props);
  }

  public static create(props: {
    value: Money;
    valuationDate: Date;
    method: ValuationMethod;
    valuedBy: string;
    isRegisteredValuer: boolean;
    valuerRegistrationNumber?: string;
    purpose: ValuationPurpose;
    reportUrl?: string;
  }): Result<Valuation> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.value, argumentName: 'value' },
      { argument: props.valuationDate, argumentName: 'valuationDate' },
      { argument: props.method, argumentName: 'method' },
      { argument: props.valuedBy, argumentName: 'valuedBy' },
      { argument: props.isRegisteredValuer, argumentName: 'isRegisteredValuer' },
      { argument: props.purpose, argumentName: 'purpose' },
    ]);

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message || 'Validation failed');
    }

    // Value must be positive
    if (props.value.amount <= 0) {
      return Result.fail('Valuation value must be positive');
    }

    // Valuation date cannot be in the future
    if (props.valuationDate > new Date()) {
      return Result.fail('Valuation date cannot be in the future');
    }

    // Registered valuer must have registration number
    if (props.isRegisteredValuer && !props.valuerRegistrationNumber) {
      return Result.fail('Registered valuer must have a registration number');
    }

    // Validate Kenyan valuer registration format
    if (
      props.valuerRegistrationNumber &&
      !/^VR\/\d{4}\/\d{3}$/.test(props.valuerRegistrationNumber)
    ) {
      return Result.fail('Invalid valuer registration number format (expected: VR/YYYY/XXX)');
    }

    return Result.ok(
      new Valuation({
        value: props.value,
        valuationDate: props.valuationDate,
        method: props.method,
        valuedBy: props.valuedBy,
        isRegisteredValuer: props.isRegisteredValuer,
        valuerRegistrationNumber: props.valuerRegistrationNumber || null,
        purpose: props.purpose,
        reportUrl: props.reportUrl || null,
      }),
    );
  }

  get value(): Money {
    return this.props.value;
  }

  get valuationDate(): Date {
    return this.props.valuationDate;
  }

  get method(): ValuationMethod {
    return this.props.method;
  }

  get purpose(): ValuationPurpose {
    return this.props.purpose;
  }

  // Check if valuation is still valid (within 12 months for Kenyan probate)
  public isValidForProbate(): boolean {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    return this.props.valuationDate >= twelveMonthsAgo;
  }

  // Calculate inflation-adjusted value using Kenyan CPI
  public adjustForInflation(currentDate: Date = new Date()): Money {
    const monthsDifference = this.monthDiff(this.props.valuationDate, currentDate);
    const averageMonthlyInflation = 0.05; // 5% annual inflation approximation

    const adjustedAmount =
      this.props.value.amount * Math.pow(1 + averageMonthlyInflation, monthsDifference);

    return Money.create({
      amount: Math.round(adjustedAmount * 100) / 100,
      currency: this.props.value.currency,
    });
  }

  // Get Kenyan legal requirements for this valuation
  public getKenyanLegalRequirements(): string[] {
    const requirements: string[] = [];

    if (this.props.isRegisteredValuer) {
      requirements.push(
        `Valuer: ${this.props.valuedBy} (Reg No: ${this.props.valuerRegistrationNumber})`,
      );
      requirements.push('Valuer must be registered with Institution of Surveyors of Kenya');
    }

    if (this.props.purpose === ValuationPurpose.PROBATE) {
      requirements.push('Valuation must be acceptable to Commissioner of Domestic Taxes');
      requirements.push('Date of death valuation required for Capital Gains Tax');
    }

    if (this.props.purpose === ValuationPurpose.MORTGAGE) {
      requirements.push('Must comply with Central Bank of Kenya guidelines');
    }

    return requirements;
  }

  // Check if valuation needs updating
  public needsUpdate(assetType: AssetType): boolean {
    const now = new Date();
    const ageInMonths = this.monthDiff(this.props.valuationDate, now);

    // Different assets have different valuation frequencies
    switch (assetType) {
      case AssetType.LAND_PARCEL:
        return ageInMonths > 24; // Land values updated every 2 years
      case AssetType.VEHICLE:
        return ageInMonths > 6; // Vehicles every 6 months
      case AssetType.FINANCIAL_ASSET:
        return ageInMonths > 1; // Financial assets monthly
      default:
        return ageInMonths > 12; // Default yearly
    }
  }

  private monthDiff(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
}

export enum ValuationMethod {
  COMPARABLE_SALES = 'COMPARABLE_SALES',
  INCOME_CAPITALIZATION = 'INCOME_CAPITALIZATION',
  COST_APPROACH = 'COST_APPROACH',
  PROFESSIONAL_JUDGMENT = 'PROFESSIONAL_JUDGMENT',
  MARKET_APPROACH = 'MARKET_APPROACH',
  DISCOUNTED_CASH_FLOW = 'DISCOUNTED_CASH_FLOW',
  DEPRECIATED_REPLACEMENT_COST = 'DEPRECIATED_REPLACEMENT_COST',
}

export enum ValuationPurpose {
  ESTATE_PLANNING = 'ESTATE_PLANNING',
  PROBATE = 'PROBATE',
  INSURANCE = 'INSURANCE',
  MORTGAGE = 'MORTGAGE',
  COURT_EVIDENCE = 'COURT_EVIDENCE',
  TAX_ASSESSMENT = 'TAX_ASSESSMENT',
  LOAN_SECURITY = 'LOAN_SECURITY',
  SALE_PURCHASE = 'SALE_PURCHASE',
}
