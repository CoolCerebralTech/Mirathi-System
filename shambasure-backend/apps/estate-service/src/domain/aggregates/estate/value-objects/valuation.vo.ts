import { ValueObject } from '../../../base/value-object';
import { DomainException } from '../../../exceptions/base-domain.exception';
import { Money } from '../../../shared/money.vo';

export class InvalidValuationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_VALUATION');
  }
}

export enum ValuationMethod {
  MARKET_APPROACH = 'MARKET_APPROACH',
  INCOME_CAPITALIZATION = 'INCOME_CAPITALIZATION',
  COST_APPROACH = 'COST_APPROACH',
  PROFESSIONAL_JUDGMENT = 'PROFESSIONAL_JUDGMENT',
}

export enum ValuationPurpose {
  PROBATE = 'PROBATE',
  INSURANCE = 'INSURANCE',
  SALE = 'SALE',
  TAXATION = 'TAXATION',
}

interface ValuationProps {
  value: Money;
  valuationDate: Date;
  method: ValuationMethod;
  valuedBy: string;
  isRegisteredValuer: boolean;
  valuerRegistrationNumber?: string;
  purpose: ValuationPurpose;
}

export class Valuation extends ValueObject<ValuationProps> {
  private constructor(props: ValuationProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.value.amount < 0) {
      throw new InvalidValuationException('Valuation cannot be negative');
    }

    if (this.props.valuationDate > new Date()) {
      throw new InvalidValuationException('Valuation date cannot be in the future');
    }

    if (this.props.isRegisteredValuer) {
      if (!this.props.valuerRegistrationNumber) {
        throw new InvalidValuationException('Registered valuer must have a registration number');
      }
      // Strict Kenyan Valuer format: VR/YYYY/XXX
      if (!/^VR\/\d{4}\/\d{1,5}$/.test(this.props.valuerRegistrationNumber)) {
        throw new InvalidValuationException(
          'Invalid valuer registration format (Expected VR/YYYY/XXX)',
        );
      }
    }
  }

  static create(
    value: Money,
    date: Date,
    method: ValuationMethod,
    valuedBy: string,
    purpose: ValuationPurpose,
    isRegisteredValuer: boolean = false,
    regNumber?: string,
  ): Valuation {
    return new Valuation({
      value,
      valuationDate: date,
      method,
      valuedBy,
      purpose,
      isRegisteredValuer,
      valuerRegistrationNumber: regNumber,
    });
  }

  // --- Business Logic ---

  isExpired(validityMonths: number = 12): boolean {
    const expiryDate = new Date(this.props.valuationDate);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    return new Date() > expiryDate;
  }

  // --- Getters ---
  get value(): Money {
    return this.props.value;
  }
  get date(): Date {
    return this.props.valuationDate;
  }

  public toJSON(): Record<string, any> {
    return {
      amount: this.props.value.toJSON(),
      date: this.props.valuationDate,
      method: this.props.method,
      purpose: this.props.purpose,
      valuer: this.props.valuedBy,
      isRegistered: this.props.isRegisteredValuer,
      isExpired: this.isExpired(), // Default 12 months check useful for API
    };
  }
}
