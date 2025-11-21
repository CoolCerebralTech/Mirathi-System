export class AssetValue {
  public readonly amountInCents: number;
  public readonly currency: string;
  public readonly valuationDate: Date;

  public constructor(amountInCents: number, currency: string, valuationDate: Date) {
    this.amountInCents = amountInCents;
    this.currency = currency;
    this.valuationDate = valuationDate;

    Object.freeze(this);
  }

  // -----------------------------------------------------
  // Factory Method
  // -----------------------------------------------------
  static create(
    amount: number,
    currency: string = 'KES',
    valuationDate: Date = new Date(),
  ): AssetValue {
    if (amount < 0) throw new Error('Asset value cannot be negative');

    if (!currency || currency.length !== 3) throw new Error('Currency must be a 3-letter ISO code');

    // Kenya-specific rule (optional but good)
    if (currency === 'KSH') {
      throw new Error('Use KES instead of KSH (ISO 4217 standard)');
    }

    if (valuationDate.getTime() > Date.now()) {
      throw new Error('Valuation date cannot be in the future');
    }

    const normalizedCurrency = currency.toUpperCase();
    const amountInCents = Math.round(amount * 100);

    return new AssetValue(amountInCents, normalizedCurrency, new Date(valuationDate));
  }

  // -----------------------------------------------------
  // Getters
  // -----------------------------------------------------
  getAmount(): number {
    return this.amountInCents / 100;
  }

  getCurrency(): string {
    return this.currency;
  }

  getValuationDate(): Date {
    return new Date(this.valuationDate);
  }

  // -----------------------------------------------------
  // Persistence helpers (for Prisma/ORM)
  // -----------------------------------------------------
  toPrimitives() {
    return {
      amount: this.getAmount(),
      currency: this.currency,
      valuationDate: this.valuationDate.toISOString(),
    };
  }

  // -----------------------------------------------------
  // Comparison
  // -----------------------------------------------------
  equals(other: AssetValue): boolean {
    if (!other) return false;

    return (
      this.amountInCents === other.amountInCents &&
      this.currency === other.currency &&
      this.valuationDate.getTime() === other.valuationDate.getTime()
    );
  }

  // -----------------------------------------------------
  // Business Logic
  // -----------------------------------------------------
  convertToCurrency(targetCurrency: string, exchangeRate: number): AssetValue {
    if (exchangeRate <= 0) throw new Error('Exchange rate must be positive');

    const newAmount = this.getAmount() * exchangeRate;
    return AssetValue.create(newAmount, targetCurrency, this.valuationDate);
  }

  isCurrent(maxAgeInMonths: number = 6): boolean {
    const now = new Date();
    const monthsDiff =
      (now.getFullYear() - this.valuationDate.getFullYear()) * 12 +
      (now.getMonth() - this.valuationDate.getMonth());

    return monthsDiff <= maxAgeInMonths;
  }

  add(other: AssetValue): AssetValue {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add asset values with different currencies');
    }

    const latestDate =
      this.valuationDate > other.valuationDate ? this.valuationDate : other.valuationDate;

    const newAmountInCents = this.amountInCents + other.amountInCents;
    return new AssetValue(newAmountInCents, this.currency, latestDate);
  }

  subtract(other: AssetValue): AssetValue {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract asset values with different currencies');
    }

    const result = this.amountInCents - other.amountInCents;
    if (result < 0) throw new Error('Resulting value cannot be negative');

    const latestDate =
      this.valuationDate > other.valuationDate ? this.valuationDate : other.valuationDate;

    return new AssetValue(result, this.currency, latestDate);
  }

  // -----------------------------------------------------
  // Formatting helpers
  // -----------------------------------------------------
  toString(): string {
    const amount = this.getAmount().toLocaleString(undefined, { minimumFractionDigits: 2 });
    return `${this.currency} ${amount} (${this.valuationDate.toISOString().split('T')[0]})`;
  }

  formatForKenya(): string {
    if (this.currency === 'KES') {
      return `KSh ${this.getAmount().toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
    }
    return this.toString();
  }
}
