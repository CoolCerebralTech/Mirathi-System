import { AssetValue } from '../../../estate-planning/domain/value-objects/asset-value.vo';

export class EstateValuation {
  private readonly grossValue: AssetValue;
  private readonly netValue: AssetValue;
  private readonly valuationDate: Date;
  private readonly valuator: string;

  constructor(
    gross: AssetValue,
    net: AssetValue,
    valuationDate: Date = new Date(),
    valuator: string = 'System Generated',
  ) {
    if (gross.getCurrency() !== 'KES' || net.getCurrency() !== 'KES') {
      throw new Error('Kenyan estate valuations must be in KES.');
    }

    if (gross.getAmount() < net.getAmount()) {
      throw new Error('Gross value cannot be less than net value.');
    }

    this.grossValue = gross;
    this.netValue = net;
    this.valuationDate = valuationDate;
    this.valuator = valuator;
  }

  /**
   * Returns the required Court Level based on Pecuniary Jurisdiction
   */
  getRequiredCourtLevel(): 'HIGH_COURT' | 'CHIEF_MAGISTRATE' | 'PRINCIPAL_MAGISTRATE' {
    const grossAmount = this.grossValue.getAmount();

    if (grossAmount > 20000000) {
      return 'HIGH_COURT';
    } else if (grossAmount > 10000000) {
      return 'CHIEF_MAGISTRATE';
    } else {
      return 'PRINCIPAL_MAGISTRATE';
    }
  }

  /**
   * Calculates court fees based on estate value
   */
  calculateCourtFees(): number {
    const value = this.grossValue.getAmount();

    if (value <= 1000000) return 1050; // Fixed fee for small estates
    if (value <= 10000000) return value * 0.001; // 0.1% for medium estates
    return value * 0.002; // 0.2% for large estates
  }

  /**
   * Calculates executor/administrator commission
   */
  calculateExecutorCommission(percentage: number = 2.5): AssetValue {
    if (percentage < 2 || percentage > 4) {
      throw new Error('Executor commission must be between 2% and 4% in Kenya.');
    }

    const commissionAmount = (this.netValue.getAmount() * percentage) / 100;

    // Use the factory method to create a valid AssetValue
    return AssetValue.create(commissionAmount, 'KES', this.valuationDate);
  }

  /**
   * Validates if estate can support debts and distributions
   */
  isSolvent(): boolean {
    return this.netValue.getAmount() > 0;
  }

  /**
   * Gets the estate duty calculation (future-proofing)
   */
  calculateEstateDuty(): AssetValue {
    // Kenya currently has no estate duty
    return AssetValue.create(0, 'KES', this.valuationDate);
  }

  getGrossAmount(): number {
    return this.grossValue.getAmount();
  }

  getNetAmount(): number {
    return this.netValue.getAmount();
  }

  getLiabilitiesAmount(): number {
    return this.grossValue.getAmount() - this.netValue.getAmount();
  }

  getValuationDate(): Date {
    return new Date(this.valuationDate);
  }

  getValuator(): string {
    return this.valuator;
  }

  toString(): string {
    return `Gross: ${this.grossValue.toString()}, Net: ${this.netValue.toString()}, Valuator: ${this.valuator}`;
  }
}
