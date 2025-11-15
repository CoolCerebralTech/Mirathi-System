import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Validates numeric valuation fields across the system.
 * Handles currency formatting, sanitization, and strict constraints for KES.
 *
 * Used for:
 *  - assets
 *  - shares
 *  - compensation
 *  - distribution amounts
 */
@Injectable()
export class AssetValuationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const fieldName = metadata.data;

    if (metadata.type === 'body' && this.isValuationField(fieldName)) {
      return this.validate(value, fieldName);
    }

    return value;
  }

  /**
   * Identifies valuation-related fields anywhere in DTOs.
   */
  private isValuationField(fieldName?: string): boolean {
    if (!fieldName) return false;

    const valuationFields = [
      'value',
      'estimatedValue',
      'valuation',
      'initialValue',
      'marketValue',
      'declaredValue',
      'amount',
      'shareValue',
      'compensationAmount',
      'payoutAmount',
      'distributionAmount',
    ];

    return valuationFields.some((field) => fieldName.toLowerCase().includes(field.toLowerCase()));
  }

  /**
   * Core numeric + formatting validations.
   */
  private validate(rawValue: unknown, fieldName: string): number {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      throw new BadRequestException(`${fieldName} cannot be empty`);
    }

    // Convert to string safely
    const stringValue = String(rawValue);

    // Remove commas, spaces, and currency prefix (KES, KSh, SH, etc.)
    const sanitized = stringValue
      .replace(/,/g, '')
      .replace(/(KES|KSH|SH|\s)/gi, '')
      .trim();

    const numericValue = Number(sanitized);

    if (isNaN(numericValue)) {
      throw new BadRequestException(`${fieldName} must be a valid numeric amount`);
    }

    if (numericValue < 0) {
      throw new BadRequestException(`${fieldName} cannot be negative`);
    }

    if (numericValue === 0) {
      throw new BadRequestException(`${fieldName} must be greater than zero`);
    }

    // Realistic valuation ceiling for Kenyan estate system
    // (KES 10 trillion — covers large land portfolios)
    const MAX_VALUATION = 10_000_000_000_000;

    if (numericValue > MAX_VALUATION) {
      throw new BadRequestException(`${fieldName} exceeds the allowable valuation limit`);
    }

    // Round to 2 decimal places
    return Math.round(numericValue * 100) / 100;
  }
}
