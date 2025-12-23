// domain/value-objects/share-percentage.vo.ts
import { SimpleValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Share Percentage Value Object
 *
 * Represents ownership/inheritance shares
 *
 * Kenyan Legal Context:
 * - S.35 LSA: Spouse gets life interest, children share remainder
 * - S.40 LSA: Polygamous houses get proportional shares
 * - Beneficiary assignments specify share percentages
 *
 * Business Rules:
 * - Must be between 0 and 100 (inclusive)
 * - Precision: 4 decimal places (e.g., 33.3333%)
 * - Multiple shares must sum to 100% (validated at aggregate level)
 *
 * Design: Store as basis points (10000 = 100%)
 * This prevents: 33.33 + 33.33 + 33.33 = 99.99
 */

export class SharePercentage extends SimpleValueObject<number> {
  private static readonly BASIS_POINTS_PER_PERCENT = 100;
  private static readonly MAX_BASIS_POINTS = 10000; // 100%

  private readonly basisPoints: number;

  private constructor(percentage: number) {
    super(percentage);
    this.basisPoints = Math.round(percentage * SharePercentage.BASIS_POINTS_PER_PERCENT);
  }

  /**
   * Create from percentage (e.g., 25.5 = 25.5%)
   */
  public static fromPercentage(percentage: number): SharePercentage {
    if (!Number.isFinite(percentage)) {
      throw new ValueObjectValidationError('Percentage must be a finite number', 'percentage');
    }

    if (percentage < 0 || percentage > 100) {
      throw new ValueObjectValidationError(
        `Percentage must be between 0 and 100. Got: ${percentage}`,
        'percentage',
      );
    }

    return new SharePercentage(percentage);
  }

  /**
   * Create from basis points (internal use)
   */
  public static fromBasisPoints(basisPoints: number): SharePercentage {
    if (!Number.isInteger(basisPoints)) {
      throw new ValueObjectValidationError('Basis points must be an integer');
    }

    if (basisPoints < 0 || basisPoints > SharePercentage.MAX_BASIS_POINTS) {
      throw new ValueObjectValidationError(
        `Basis points must be between 0 and ${SharePercentage.MAX_BASIS_POINTS}`,
      );
    }

    const percentage = basisPoints / SharePercentage.BASIS_POINTS_PER_PERCENT;
    return new SharePercentage(percentage);
  }

  /**
   * Factory methods for common shares
   */
  public static full(): SharePercentage {
    return SharePercentage.fromPercentage(100);
  }

  public static half(): SharePercentage {
    return SharePercentage.fromPercentage(50);
  }

  public static third(): SharePercentage {
    return SharePercentage.fromPercentage(33.3333);
  }

  public static quarter(): SharePercentage {
    return SharePercentage.fromPercentage(25);
  }

  public static zero(): SharePercentage {
    return SharePercentage.fromPercentage(0);
  }

  protected validate(): void {
    if (!Number.isFinite(this.props.value)) {
      throw new ValueObjectValidationError('Percentage must be a finite number');
    }

    if (this.props.value < 0 || this.props.value > 100) {
      throw new ValueObjectValidationError(
        `Percentage must be between 0 and 100. Got: ${this.props.value}`,
      );
    }
  }

  /**
   * Get percentage as decimal (e.g., 25.5)
   */
  public getPercentage(): number {
    return this.props.value;
  }

  /**
   * Get as decimal fraction (e.g., 0.255 for 25.5%)
   */
  public getDecimal(): number {
    return this.props.value / 100;
  }

  /**
   * Get basis points (e.g., 2550 for 25.5%)
   */
  public getBasisPoints(): number {
    return this.basisPoints;
  }

  /**
   * Add shares (returns new SharePercentage)
   */
  public add(other: SharePercentage): SharePercentage {
    const totalBasisPoints = this.basisPoints + other.basisPoints;

    if (totalBasisPoints > SharePercentage.MAX_BASIS_POINTS) {
      throw new ValueObjectValidationError(
        `Total share cannot exceed 100%. Got: ${totalBasisPoints / 100}%`,
      );
    }

    return SharePercentage.fromBasisPoints(totalBasisPoints);
  }

  /**
   * Subtract shares (returns new SharePercentage)
   */
  public subtract(other: SharePercentage): SharePercentage {
    const resultBasisPoints = this.basisPoints - other.basisPoints;

    if (resultBasisPoints < 0) {
      throw new ValueObjectValidationError(
        `Share cannot be negative. Attempted: ${resultBasisPoints / 100}%`,
      );
    }

    return SharePercentage.fromBasisPoints(resultBasisPoints);
  }

  /**
   * Multiply by scalar
   */
  public multiply(multiplier: number): SharePercentage {
    if (!Number.isFinite(multiplier) || multiplier < 0) {
      throw new ValueObjectValidationError('Multiplier must be a positive finite number');
    }

    const resultBasisPoints = Math.round(this.basisPoints * multiplier);
    return SharePercentage.fromBasisPoints(resultBasisPoints);
  }

  /**
   * Divide by scalar
   */
  public divide(divisor: number): SharePercentage {
    if (divisor === 0) {
      throw new ValueObjectValidationError('Cannot divide by zero');
    }

    if (!Number.isFinite(divisor) || divisor < 0) {
      throw new ValueObjectValidationError('Divisor must be a positive finite number');
    }

    const resultBasisPoints = Math.round(this.basisPoints / divisor);
    return SharePercentage.fromBasisPoints(resultBasisPoints);
  }

  /**
   * Check if represents full ownership
   */
  public isFull(): boolean {
    return this.basisPoints === SharePercentage.MAX_BASIS_POINTS;
  }

  /**
   * Check if zero
   */
  public isZero(): boolean {
    return this.basisPoints === 0;
  }

  /**
   * Compare shares
   */
  public greaterThan(other: SharePercentage): boolean {
    return this.basisPoints > other.basisPoints;
  }

  public greaterThanOrEqual(other: SharePercentage): boolean {
    return this.basisPoints >= other.basisPoints;
  }

  public lessThan(other: SharePercentage): boolean {
    return this.basisPoints < other.basisPoints;
  }

  public lessThanOrEqual(other: SharePercentage): boolean {
    return this.basisPoints <= other.basisPoints;
  }

  /**
   * Allocate shares proportionally (for S.35/S.40)
   * Example: Divide 100% among 3 children = [33.33%, 33.33%, 33.34%]
   */
  public static allocateEqually(count: number): SharePercentage[] {
    if (!Number.isInteger(count) || count <= 0) {
      throw new ValueObjectValidationError('Count must be a positive integer');
    }

    const shares: SharePercentage[] = [];
    const basisPointsPerShare = Math.floor(SharePercentage.MAX_BASIS_POINTS / count);
    const remainder = SharePercentage.MAX_BASIS_POINTS - basisPointsPerShare * count;

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const basisPoints = isLast ? basisPointsPerShare + remainder : basisPointsPerShare;

      shares.push(SharePercentage.fromBasisPoints(basisPoints));
    }

    return shares;
  }

  /**
   * Allocate by ratio (for S.40 polygamous distribution)
   * Example: Ratio [2, 3, 5] = [20%, 30%, 50%]
   */
  public static allocateByRatio(ratios: number[]): SharePercentage[] {
    if (ratios.length === 0) {
      throw new ValueObjectValidationError('Ratios cannot be empty');
    }

    if (ratios.some((r) => r < 0 || !Number.isFinite(r))) {
      throw new ValueObjectValidationError('All ratios must be non-negative finite numbers');
    }

    const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
    if (totalRatio === 0) {
      throw new ValueObjectValidationError('Total ratio cannot be zero');
    }

    const shares: SharePercentage[] = [];
    let remainingBasisPoints = SharePercentage.MAX_BASIS_POINTS;

    for (let i = 0; i < ratios.length; i++) {
      const isLast = i === ratios.length - 1;

      if (isLast) {
        shares.push(SharePercentage.fromBasisPoints(remainingBasisPoints));
      } else {
        const basisPoints = Math.floor((SharePercentage.MAX_BASIS_POINTS * ratios[i]) / totalRatio);
        shares.push(SharePercentage.fromBasisPoints(basisPoints));
        remainingBasisPoints -= basisPoints;
      }
    }

    return shares;
  }

  /**
   * Validate that shares sum to 100%
   */
  public static validateSumTo100(shares: SharePercentage[]): void {
    const totalBasisPoints = shares.reduce((sum, share) => sum + share.getBasisPoints(), 0);

    if (totalBasisPoints !== SharePercentage.MAX_BASIS_POINTS) {
      throw new ValueObjectValidationError(
        `Shares must sum to 100%. Got: ${totalBasisPoints / 100}%`,
      );
    }
  }

  /**
   * Format for display
   */
  public format(): string {
    return `${this.props.value.toFixed(2)}%`;
  }

  /**
   * Format for legal documents (4 decimal places)
   */
  public formatForLegal(): string {
    return `${this.props.value.toFixed(4)}%`;
  }

  public toString(): string {
    return this.format();
  }
}
