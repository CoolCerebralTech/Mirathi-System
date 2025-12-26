// src/estate-service/src/domain/value-objects/tax-status.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Tax Status Value Object
 *
 * "The Bouncer" Logic:
 * - Only CLEARED or EXEMPT allow the Estate to proceed to Distribution.
 */
export class TaxStatusVO extends SimpleValueObject<string> {
  static readonly PENDING = 'PENDING'; // Initial state
  static readonly ASSESSED = 'ASSESSED'; // KRA has said "Pay X"
  static readonly PARTIALLY_PAID = 'PARTIALLY_PAID';
  static readonly CLEARED = 'CLEARED'; // "The Bouncer" opens the gate
  static readonly DISPUTED = 'DISPUTED'; // Freezes distribution
  static readonly EXEMPT = 'EXEMPT'; // "The Bouncer" opens the gate

  private static readonly VALID_STATUSES = [
    TaxStatusVO.PENDING,
    TaxStatusVO.ASSESSED,
    TaxStatusVO.PARTIALLY_PAID,
    TaxStatusVO.CLEARED,
    TaxStatusVO.DISPUTED,
    TaxStatusVO.EXEMPT,
  ];

  constructor(value: string) {
    super(value.toUpperCase());
  }

  protected validate(): void {
    if (!TaxStatusVO.VALID_STATUSES.includes(this.props.value)) {
      throw new ValueObjectValidationError(`Invalid Tax Status: ${this.props.value}`, 'taxStatus');
    }
  }

  /**
   * The "Gatekeeper" check.
   * Returns TRUE if the Estate can proceed to calculateFinalDistribution().
   */
  isClearedForDistribution(): boolean {
    return [TaxStatusVO.CLEARED, TaxStatusVO.EXEMPT].includes(this.props.value);
  }

  /**
   * If true, the Estate Solvency Calculation must include this liability.
   */
  isLiability(): boolean {
    return [TaxStatusVO.ASSESSED, TaxStatusVO.PARTIALLY_PAID].includes(this.props.value);
  }

  static cleared(): TaxStatusVO {
    return new TaxStatusVO(TaxStatusVO.CLEARED);
  }
  static pending(): TaxStatusVO {
    return new TaxStatusVO(TaxStatusVO.PENDING);
  }
}
