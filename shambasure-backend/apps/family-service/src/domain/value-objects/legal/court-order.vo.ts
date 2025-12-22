// domain/value-objects/legal/court-order.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

/**
 * Court Order Value Object
 *
 * Represents a Kenyan court order with validation
 *
 * KENYAN COURT ORDER FORMAT:
 * - Order Number: Unique identifier (e.g., "SUCC 123/2024")
 * - Court Station: Which court issued it (e.g., "Nairobi High Court")
 * - Order Date: When it was issued
 *
 * LEGAL SIGNIFICANCE:
 * - Court orders are immutable legal documents
 * - Must be verifiable against court records
 * - Required for S.71 court-appointed guardians
 */

interface CourtOrderProps {
  orderNumber: string; // e.g., "SUCC 123/2024", "P&A 456/2024"
  courtStation: string; // e.g., "Nairobi High Court", "Kiambu Magistrate Court"
  orderDate: Date; // When order was issued
  orderType?: string; // e.g., "GUARDIAN_APPOINTMENT", "BOND_REQUIREMENT"
  issuingJudge?: string; // Judge who issued the order
}

export class CourtOrder extends ValueObject<CourtOrderProps> {
  private constructor(props: CourtOrderProps) {
    super(props);
  }

  public static create(props: CourtOrderProps): CourtOrder {
    return new CourtOrder(props);
  }

  protected validate(): void {
    // Order number is required and should have format
    if (!this.props.orderNumber || this.props.orderNumber.trim().length === 0) {
      throw new ValueObjectValidationError('Court order number is required', 'orderNumber');
    }

    // Validate Kenyan court order format (basic validation)
    // Format: PREFIX NUMBER/YEAR (e.g., SUCC 123/2024, P&A 456/2024)
    const orderNumberPattern = /^[A-Z&\s]+\d+\/\d{4}$/;
    if (!orderNumberPattern.test(this.props.orderNumber.trim())) {
      console.warn(
        `Court order number "${this.props.orderNumber}" doesn't match standard Kenyan format (e.g., "SUCC 123/2024")`,
      );
    }

    // Court station is required
    if (!this.props.courtStation || this.props.courtStation.trim().length === 0) {
      throw new ValueObjectValidationError('Court station is required', 'courtStation');
    }

    // Order date must be in the past or today
    if (this.props.orderDate > new Date()) {
      throw new ValueObjectValidationError('Court order date cannot be in the future', 'orderDate');
    }

    // Order date shouldn't be too old (warn if > 100 years)
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
    if (this.props.orderDate < hundredYearsAgo) {
      console.warn(
        `Court order date ${this.props.orderDate.toISOString()} is unusually old (>100 years)`,
      );
    }
  }

  // === GETTERS ===

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get courtStation(): string {
    return this.props.courtStation;
  }

  get orderDate(): Date {
    return this.props.orderDate;
  }

  get orderType(): string | undefined {
    return this.props.orderType;
  }

  get issuingJudge(): string | undefined {
    return this.props.issuingJudge;
  }

  // === BUSINESS LOGIC ===

  /**
   * Check if order is from High Court
   * (High Court has broader jurisdiction)
   */
  public isHighCourtOrder(): boolean {
    return this.props.courtStation.toLowerCase().includes('high court');
  }

  /**
   * Check if order is from Magistrate Court
   */
  public isMagistrateCourtOrder(): boolean {
    return this.props.courtStation.toLowerCase().includes('magistrate');
  }

  /**
   * Get court level (for jurisdiction validation)
   */
  public getCourtLevel(): 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'KADHI_COURT' | 'UNKNOWN' {
    const station = this.props.courtStation.toLowerCase();

    if (station.includes('high court')) return 'HIGH_COURT';
    if (station.includes('magistrate')) return 'MAGISTRATE_COURT';
    if (station.includes('kadhi')) return 'KADHI_COURT';

    return 'UNKNOWN';
  }

  /**
   * Check if order is recent (within specified days)
   */
  public isRecentOrder(withinDays: number = 30): boolean {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - withinDays);
    return this.props.orderDate >= daysAgo;
  }

  /**
   * Get age of order in days
   */
  public getAgeInDays(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.props.orderDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // === SERIALIZATION ===

  public toJSON(): Record<string, any> {
    return {
      orderNumber: this.props.orderNumber,
      courtStation: this.props.courtStation,
      orderDate: this.props.orderDate.toISOString(),
      orderType: this.props.orderType,
      issuingJudge: this.props.issuingJudge,
      courtLevel: this.getCourtLevel(),
      ageInDays: this.getAgeInDays(),
    };
  }

  public toString(): string {
    return `${this.props.orderNumber} (${this.props.courtStation})`;
  }
}
