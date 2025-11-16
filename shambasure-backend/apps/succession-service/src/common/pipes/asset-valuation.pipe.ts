import {
  PipeTransform,
  Injectable,
  Inject,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import successionConfig from '../config/succession.config';

/**
 * Validates and sanitizes numeric valuation fields from incoming DTOs.
 * - Removes currency symbols, commas, and whitespace.
 * - Enforces non-negative and non-zero constraints.
 * - Enforces a configurable maximum valuation limit.
 * - Rounds the final value to 2 decimal places.
 */
@Injectable()
export class AssetValuationPipe implements PipeTransform {
  constructor(
    @Inject(successionConfig.KEY)
    private readonly config: ConfigType<typeof successionConfig>,
  ) {}

  public transform(value: unknown, metadata: ArgumentMetadata): number {
    const fieldName = metadata.data || 'The provided value';
    return this.validate(value, fieldName);
  }

  private validate(rawValue: unknown, fieldName: string): number {
    // ✅ FIXED: Better null/undefined checking
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      throw new BadRequestException(`${fieldName} must be provided and cannot be empty.`);
    }

    // ✅ FIXED: Check if value is already a number
    if (typeof rawValue === 'number') {
      return this.validateNumber(rawValue, fieldName);
    }

    // ✅ FIXED: Only process string values, reject objects and other types
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(
        `${fieldName} must be a string or number, received ${typeof rawValue}.`,
      );
    }

    // ✅ FIXED: Safe string processing
    return this.processStringValue(rawValue, fieldName);
  }

  private validateNumber(numericValue: number, fieldName: string): number {
    if (isNaN(numericValue)) {
      throw new BadRequestException(`${fieldName} must be a valid numeric amount.`);
    }

    if (numericValue < 0) {
      throw new BadRequestException(`${fieldName} cannot be a negative value.`);
    }

    const maxValuation = this.config.validation.maxAssetValuation;

    if (numericValue > maxValuation) {
      throw new BadRequestException(
        `${fieldName} exceeds the maximum allowable valuation limit of ${maxValuation.toLocaleString()}.`,
      );
    }

    // Standardize to 2 decimal places for financial calculations
    return Math.round(numericValue * 100) / 100;
  }

  private processStringValue(stringValue: string, fieldName: string): number {
    // ✅ FIXED: More robust sanitization
    const sanitized = stringValue
      .replace(/,/g, '') // Remove commas
      .replace(/(KES|KSH|SH|\s)/gi, '') // Remove currency symbols and whitespace
      .trim();

    if (sanitized === '') {
      throw new BadRequestException(`${fieldName} must contain a valid numeric amount.`);
    }

    // ✅ FIXED: Use parseFloat for better number parsing
    const numericValue = parseFloat(sanitized);

    if (isNaN(numericValue)) {
      throw new BadRequestException(
        `${fieldName} must be a valid numeric amount. Received: "${stringValue}"`,
      );
    }

    return this.validateNumber(numericValue, fieldName);
  }
}
