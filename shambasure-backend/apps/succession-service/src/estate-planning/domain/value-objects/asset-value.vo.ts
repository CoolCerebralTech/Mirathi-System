export class AssetValue {
  private readonly amount: number;
  private readonly currency: string;
  private readonly valuationDate: Date;

  constructor(amount: number, currency: string = 'KES', valuationDate: Date = new Date()) {
    if (amount < 0) {
      throw new Error('Asset value cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    if (valuationDate > new Date()) {
      throw new Error('Valuation date cannot be in the future');
    }

    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase();
    this.valuationDate = new Date(valuationDate);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  getValuationDate(): Date {
    return new Date(this.valuationDate);
  }

  equals(other: AssetValue): boolean {
    return (
      this.amount === other.getAmount() &&
      this.currency === other.getCurrency() &&
      this.valuationDate.getTime() === other.getValuationDate().getTime()
    );
  }

  toString(): string {
    return `${this.currency} ${this.amount.toLocaleString()} (${this.valuationDate.toISOString().split('T')[0]})`;
  }

  // Business logic methods
  convertToCurrency(targetCurrency: string, exchangeRate: number): AssetValue {
    if (exchangeRate <= 0) {
      throw new Error('Exchange rate must be positive');
    }
    const convertedAmount = this.amount * exchangeRate;
    return new AssetValue(convertedAmount, targetCurrency, this.valuationDate);
  }

  isCurrent(maxAgeInMonths: number = 6): boolean {
    const now = new Date();
    const monthsDiff =
      (now.getFullYear() - this.valuationDate.getFullYear()) * 12 +
      (now.getMonth() - this.valuationDate.getMonth());
    return monthsDiff <= maxAgeInMonths;
  }

  add(other: AssetValue): AssetValue {
    if (this.currency !== other.getCurrency()) {
      throw new Error('Cannot add values in different currencies');
    }

    const latestDate =
      this.valuationDate > other.getValuationDate() ? this.valuationDate : other.getValuationDate();

    return new AssetValue(this.amount + other.getAmount(), this.currency, latestDate);
  }

  subtract(other: AssetValue): AssetValue {
    if (this.currency !== other.getCurrency()) {
      throw new Error('Cannot subtract values in different currencies');
    }

    const result = this.amount - other.getAmount();
    if (result < 0) {
      throw new Error('Resulting value cannot be negative');
    }

    const latestDate =
      this.valuationDate > other.getValuationDate() ? this.valuationDate : other.getValuationDate();

    return new AssetValue(result, this.currency, latestDate);
  }

  formatForKenya(): string {
    if (this.currency === 'KES') {
      return `KSh ${this.amount.toLocaleString('en-KE')}`;
    }
    return this.toString();
  }
}
