import { BadRequestException } from '@nestjs/common';

/**
 * A collection of reusable validation utility functions.
 */
export class ValidationUtils {
  /**
   * Validates that an array of percentage shares adds up to 100.
   * Throws a BadRequestException if the total is incorrect.
   * @param shares An array of numbers representing percentages.
   * @param entityName The name of the entity being shared, for the error message.
   */
  static validateTotalPercentage(shares: number[], entityName: string = 'Asset'): void {
    if (!shares || shares.length === 0) {
      return; // Nothing to validate
    }

    const total = shares.reduce((sum, value) => sum + value, 0);

    // Use a small epsilon for floating-point comparisons
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException(
        `The shares for this ${entityName} must total exactly 100%. Current total: ${total.toFixed(2)}%`,
      );
    }
  }
}
