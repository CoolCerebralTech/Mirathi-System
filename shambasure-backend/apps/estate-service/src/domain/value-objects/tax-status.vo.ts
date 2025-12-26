// src/estate-service/src/domain/value-objects/tax-status.vo.ts
import { SimpleValueObject } from '../base/value-object';

/**
 * Tax Status Value Object for KRA compliance
 *
 * Critical for estate distribution - KRA clearance is mandatory
 * before any assets can be transferred to beneficiaries.
 */
export class TaxStatusVO extends SimpleValueObject<string> {
  static readonly PENDING = 'PENDING';
  static readonly ASSESSED = 'ASSESSED';
  static readonly PARTIALLY_PAID = 'PARTIALLY_PAID';
  static readonly CLEARED = 'CLEARED';
  static readonly DISPUTED = 'DISPUTED';
  static readonly EXEMPT = 'EXEMPT';

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
      throw new ValueObjectValidationError(
        `Invalid tax status: ${this.props.value}. Valid statuses: ${TaxStatusVO.VALID_STATUSES.join(', ')}`,
        'taxStatus',
      );
    }
  }

  /**
   * Check if distribution is allowed with this tax status
   */
  allowsDistribution(): boolean {
    return [TaxStatusVO.CLEARED, TaxStatusVO.EXEMPT].includes(this.props.value);
  }

  /**
   * Check if tax payment is required
   */
  requiresPayment(): boolean {
    return [TaxStatusVO.PENDING, TaxStatusVO.ASSESSED, TaxStatusVO.PARTIALLY_PAID].includes(
      this.props.value,
    );
  }

  /**
   * Check if there's a tax dispute
   */
  isDisputed(): boolean {
    return this.props.value === TaxStatusVO.DISPUTED;
  }

  /**
   * Check if tax is fully cleared
   */
  isCleared(): boolean {
    return this.props.value === TaxStatusVO.CLEARED;
  }

  /**
   * Get next status in workflow
   */
  getNextStatus(): TaxStatusVO | null {
    const workflow: Record<string, string> = {
      [TaxStatusVO.PENDING]: TaxStatusVO.ASSESSED,
      [TaxStatusVO.ASSESSED]: TaxStatusVO.PARTIALLY_PAID,
      [TaxStatusVO.PARTIALLY_PAID]: TaxStatusVO.CLEARED,
      [TaxStatusVO.DISPUTED]: TaxStatusVO.ASSESSED,
    };

    const next = workflow[this.props.value];
    return next ? new TaxStatusVO(next) : null;
  }

  /**
   * Mark as cleared (final status)
   */
  static cleared(): TaxStatusVO {
    return new TaxStatusVO(TaxStatusVO.CLEARED);
  }

  /**
   * Mark as pending (initial status)
   */
  static pending(): TaxStatusVO {
    return new TaxStatusVO(TaxStatusVO.PENDING);
  }

  /**
   * Get status with description
   */
  getDescription(): string {
    const descriptions: Record<string, string> = {
      [TaxStatusVO.PENDING]: 'Tax assessment pending from KRA',
      [TaxStatusVO.ASSESSED]: 'Tax liability assessed, payment required',
      [TaxStatusVO.PARTIALLY_PAID]: 'Partial payment made, balance outstanding',
      [TaxStatusVO.CLEARED]: 'All taxes paid, KRA clearance certificate issued',
      [TaxStatusVO.DISPUTED]: 'Tax assessment disputed with KRA',
      [TaxStatusVO.EXEMPT]: 'Estate qualifies for tax exemption',
    };

    return descriptions[this.props.value] || 'Unknown tax status';
  }
}
