import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Validates and sanitizes a numeric field to ensure it is a valid percentage (0-100).
 * - Handles both string and number inputs.
 * - Rounds the final value to 2 decimal places.
 */
@Injectable()
export class SharePercentagePipe implements PipeTransform<unknown, number> {
  // --- IMPROVEMENT: Aligned with our professional architecture ---
  // The pipe is now a proper injectable service with a constructor.
  constructor() {}

  public transform(value: unknown, metadata: ArgumentMetadata): number {
    const fieldName = metadata.data || 'The percentage field';
    return this.validateSharePercentage(value, fieldName);
  }

  private validateSharePercentage(value: unknown, fieldName: string): number {
    let numericValue: number;

    if (typeof value === 'string') {
      // Allow empty strings to be handled by DTO validators like @IsNotEmpty()
      if (value.trim() === '') {
        throw new BadRequestException(`${fieldName} must be a valid number and cannot be empty.`);
      }
      numericValue = parseFloat(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      throw new BadRequestException(`${fieldName} must be a number or a numeric string.`);
    }

    if (isNaN(numericValue)) {
      throw new BadRequestException(`${fieldName} must be a valid number.`);
    }

    if (numericValue < 0 || numericValue > 100) {
      throw new BadRequestException(`${fieldName} must be a value between 0 and 100.`);
    }

    // Standardize to 2 decimal places for financial precision
    return Math.round(numericValue * 100) / 100;
  }
}
