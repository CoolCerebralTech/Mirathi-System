export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'KES',
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Cannot subtract more than available');
    }
    return new Money(result, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('Cannot operate on different currencies');
    }
  }

  toJSON() {
    return { amount: this.amount, currency: this.currency };
  }
}
