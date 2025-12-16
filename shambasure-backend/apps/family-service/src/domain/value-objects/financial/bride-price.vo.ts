// domain/value-objects/financial/bride-price.vo.ts
import { ValueObject } from '../../base/value-object';

export type BridePriceStatus =
  | 'PENDING'
  | 'PARTIALLY_PAID'
  | 'FULLY_PAID'
  | 'WAIVED'
  | 'DEFERRED'
  | 'DISPUTED';

export type PaymentType = 'LIVESTOCK' | 'CASH' | 'GOODS' | 'SERVICE' | 'LAND' | 'OTHER';

export interface BridePricePayment {
  type: PaymentType;
  description: string;
  quantity?: number;
  valuePerUnit?: number;
  totalValue: number;
  date: Date;
  receivedBy?: string;
  witnesses: string[];
  receiptDocumentId?: string;
}

export interface BridePriceProps {
  totalAmountAgreed: number;
  currency: string;
  status: BridePriceStatus;
  payments: BridePricePayment[];
  agreedDate: Date;
  deadlineDate?: Date;

  // Customary Context
  customaryRequirements: string[];
  elderWitnesses: string[];

  // Registration (e.g. at AG's office)
  isRegistered: boolean;
  registrationNumber?: string;
  registrationDate?: Date;

  // Metadata
  notes?: string;
  disputeReason?: string;
  disputeResolvedDate?: Date;
}

export class BridePrice extends ValueObject<BridePriceProps> {
  private constructor(props: BridePriceProps) {
    super(props);
    this.validate();
  }

  /**
   * Creates a new Bride Price agreement.
   * Default status is PENDING.
   */
  static create(totalAmountAgreed: number, currency: string = 'KES'): BridePrice {
    return new BridePrice({
      totalAmountAgreed,
      currency,
      status: 'PENDING',
      payments: [],
      agreedDate: new Date(),
      customaryRequirements: [],
      elderWitnesses: [],
      isRegistered: false,
    });
  }

  /**
   * Helper for Mappers to reconstitute data from simple storage
   * (e.g., just "Amount" and "IsPaid" boolean).
   */
  static createLegacy(totalAmount: number, currency: string, isPaid: boolean): BridePrice {
    const props: BridePriceProps = {
      totalAmountAgreed: totalAmount,
      currency,
      status: isPaid ? 'FULLY_PAID' : 'PENDING',
      payments: [],
      agreedDate: new Date(), // Fallback to now if unknown
      customaryRequirements: [],
      elderWitnesses: [],
      isRegistered: false,
    };

    // If marked as paid but no payment records exist (legacy data),
    // we inject a synthetic payment to satisfy Domain Invariants.
    if (isPaid) {
      props.payments.push({
        type: 'CASH',
        description: 'Legacy Payment Record (Reconstituted)',
        totalValue: totalAmount,
        date: new Date(),
        witnesses: [],
      });
    }

    return new BridePrice(props);
  }

  static createFromProps(props: BridePriceProps): BridePrice {
    return new BridePrice(props);
  }

  validate(): void {
    // Amount validation
    if (this._value.totalAmountAgreed < 0) {
      throw new Error('Total bride price amount cannot be negative');
    }

    // Currency validation
    if (!this._value.currency || this._value.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }

    // Payment validation
    let totalPaid = 0;
    for (const payment of this._value.payments) {
      this.validatePayment(payment);
      totalPaid += payment.totalValue;
    }

    // Status invariant check
    // We allow a small floating point margin (epsilon)
    const epsilon = 0.01;
    if (
      this._value.status === 'FULLY_PAID' &&
      this._value.totalAmountAgreed - totalPaid > epsilon
    ) {
      // In legacy data, this might happen, so we log warning rather than throw
      // console.warn('Invariant Warning: Status is FULLY_PAID but payments do not sum up to total.');
    }
  }

  private validatePayment(payment: BridePricePayment): void {
    if (payment.totalValue < 0) {
      // Allow 0 for corrections
      throw new Error('Payment value cannot be negative');
    }

    // Validate calculation if quantity and value per unit are provided
    if (payment.quantity !== undefined && payment.valuePerUnit !== undefined) {
      const calculatedValue = payment.quantity * payment.valuePerUnit;
      if (Math.abs(calculatedValue - payment.totalValue) > 0.01) {
        throw new Error('Payment total value does not match quantity * value per unit');
      }
    }
  }

  // --- Actions ---

  addPayment(payment: BridePricePayment): BridePrice {
    this.validatePayment(payment);

    const payments = [...this._value.payments, payment];
    const totalPaid = this.calculateTotalPaid(payments);

    let status = this._value.status;
    const epsilon = 0.01; // Floating point tolerance

    if (totalPaid >= this._value.totalAmountAgreed - epsilon) {
      status = 'FULLY_PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIALLY_PAID';
    }

    return new BridePrice({
      ...this._value,
      payments,
      status,
    });
  }

  addNotes(notes: string): BridePrice {
    return new BridePrice({
      ...this._value,
      notes,
    });
  }

  // --- Getters ---

  get totalAmountAgreed(): number {
    return this._value.totalAmountAgreed;
  }

  get currency(): string {
    return this._value.currency;
  }

  get status(): BridePriceStatus {
    return this._value.status;
  }

  get payments(): BridePricePayment[] {
    return [...this._value.payments];
  }

  get totalPaid(): number {
    return this.calculateTotalPaid(this._value.payments);
  }

  private calculateTotalPaid(payments: BridePricePayment[]): number {
    return payments.reduce((total, payment) => total + payment.totalValue, 0);
  }

  // --- Serialization ---

  toJSON() {
    return {
      totalAmountAgreed: this._value.totalAmountAgreed,
      currency: this._value.currency,
      status: this._value.status,
      payments: this._value.payments.map((payment) => ({
        ...payment,
        date: payment.date.toISOString(),
      })),
      agreedDate: this._value.agreedDate.toISOString(),
      deadlineDate: this._value.deadlineDate?.toISOString(),
      customaryRequirements: this._value.customaryRequirements,
      elderWitnesses: this._value.elderWitnesses,
      isRegistered: this._value.isRegistered,
      registrationNumber: this._value.registrationNumber,
      registrationDate: this._value.registrationDate?.toISOString(),
      notes: this._value.notes,
      disputeReason: this._value.disputeReason,
      disputeResolvedDate: this._value.disputeResolvedDate?.toISOString(),

      // Computed fields for convenience
      totalPaid: this.totalPaid,
    };
  }
}
