import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { legalRulesConfig } from '../config/legal-rules.config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Kenyan ID validation result with detailed information
 */
export interface KenyanIdValidationResult {
  isValid: boolean;
  sanitizedId: string;
  idType: 'NATIONAL_ID' | 'OLD_GENERATION_ID' | 'NEW_GENERATION_ID';
  estimatedAge?: number;
  estimatedDateOfBirth?: Date;
  isMinor?: boolean;
  warnings?: string[];
  metadata?: {
    length: number;
    hasCheckDigit: boolean;
    generationSeries?: string;
  };
}

/**
 * Options for ID validation
 */
export interface KenyanIdValidationOptions {
  allowOldGeneration?: boolean; // Allow 7-digit IDs (pre-2011)
  requireCheckDigit?: boolean; // Enforce check digit validation
  checkAge?: boolean; // Estimate and validate age
  minAge?: number; // Minimum age requirement
  maxAge?: number; // Maximum age requirement
  strictFormat?: boolean; // Strict format validation
}

// ============================================================================
// KENYAN ID VALIDATION PIPE
// ============================================================================

/**
 * Validates and sanitizes Kenyan National ID numbers according to:
 * - Registration of Persons Act (Cap 107)
 * - National Registration Bureau standards
 * - Huduma Number system (new generation IDs)
 *
 * Kenyan ID Format:
 * - Old Generation (pre-2011): 7-8 digits (e.g., 12345678)
 * - New Generation (2011+): 8 digits (e.g., 12345678)
 * - Huduma Number (2015+): Alphanumeric (e.g., HUD-12345678-A)
 *
 * Features:
 * - Format validation (7-8 digits or Huduma format)
 * - Sanitization (removes spaces, hyphens, special characters)
 * - Check digit validation using Luhn-like algorithm
 * - Age estimation from ID sequence
 * - Minor detection (under 18)
 * - Old vs new generation ID detection
 * - Comprehensive error messages
 *
 * @example
 * // Basic usage
 * @Body('idNumber', KenyanIdValidationPipe) idNumber: string
 *
 * @example
 * // With options
 * @Body('idNumber', new KenyanIdValidationPipe(config, { minAge: 18 }))
 * idNumber: string
 */
@Injectable()
export class KenyanIdValidationPipe implements PipeTransform<string, string> {
  // ID patterns for validation
  private readonly NATIONAL_ID_PATTERN = /^\d{7,8}$/;
  private readonly HUDUMA_NUMBER_PATTERN = /^HUD-\d{8}-[A-Z]$/i;

  // Generation ranges (approximate)
  private readonly OLD_GENERATION_MAX = 9999999; // 7 digits
  private readonly NEW_GENERATION_MIN = 10000000; // 8 digits

  // Age estimation constants (approximate, based on issuance patterns)
  private readonly ID_ISSUANCE_START_YEAR = 1964; // When ID system started
  private readonly AVERAGE_ID_ISSUANCE_AGE = 18; // Typical age when getting ID

  constructor(
    @Inject(legalRulesConfig.KEY)
    private readonly rules: ConfigType<typeof legalRulesConfig>,
    private readonly options?: KenyanIdValidationOptions,
  ) {}

  /**
   * Main transformation method
   */
  public transform(value: string, metadata: ArgumentMetadata): string {
    const fieldName = metadata.data || 'National ID';

    try {
      const result = this.validateKenyanIdWithDetails(value, fieldName);

      // Log warnings if any
      if (result.warnings && result.warnings.length > 0) {
        console.warn(`ID validation warnings for ${fieldName}:`, result.warnings);
      }

      return result.sanitizedId;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      throw new BadRequestException(`Failed to validate ${fieldName}: ${errorMessage}`);
    }
  }

  /**
   * Validates Kenyan ID with detailed results
   */
  public validateKenyanIdWithDetails(
    value: unknown,
    fieldName: string = 'National ID',
  ): KenyanIdValidationResult {
    // Step 1: Basic type validation
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} must be a non-empty string.`);
    }

    // Step 2: Sanitize input
    const sanitized = this.sanitizeId(value);

    // Step 3: Detect ID type and format
    const idType = this.detectIdType(sanitized);

    // Step 4: Validate format
    this.validateFormat(sanitized, idType, fieldName);

    // Step 5: Validate check digit (if enabled)
    if (this.options?.requireCheckDigit !== false && idType !== 'OLD_GENERATION_ID') {
      this.validateCheckDigit(sanitized, fieldName);
    }

    // Step 6: Estimate age (if enabled)
    let estimatedAge: number | undefined;
    let estimatedDateOfBirth: Date | undefined;
    let isMinor: boolean | undefined;

    if (this.options?.checkAge !== false && idType === 'NATIONAL_ID') {
      const ageInfo = this.estimateAge(sanitized);
      estimatedAge = ageInfo.age;
      estimatedDateOfBirth = ageInfo.dateOfBirth;
      isMinor = ageInfo.age < this.rules.assetDistribution.minorProtection.ageOfMajority;

      // Validate age requirements
      if (this.options?.minAge && estimatedAge < this.options.minAge) {
        throw new BadRequestException(
          `${fieldName} holder must be at least ${this.options.minAge} years old. ` +
            `Estimated age: ${estimatedAge} years.`,
        );
      }

      if (this.options?.maxAge && estimatedAge > this.options.maxAge) {
        throw new BadRequestException(
          `${fieldName} holder must be at most ${this.options.maxAge} years old. ` +
            `Estimated age: ${estimatedAge} years.`,
        );
      }
    }

    // Step 7: Generate warnings
    const warnings = this.generateWarnings(sanitized, idType, estimatedAge);

    return {
      isValid: true,
      sanitizedId: sanitized,
      idType,
      estimatedAge,
      estimatedDateOfBirth,
      isMinor,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        length: sanitized.length,
        hasCheckDigit: this.hasValidCheckDigit(sanitized),
        generationSeries: this.getGenerationSeries(sanitized),
      },
    };
  }

  // ============================================================================
  // SANITIZATION
  // ============================================================================

  /**
   * Sanitizes ID by removing common separators and converting to uppercase
   */
  private sanitizeId(value: string): string {
    return value
      .trim()
      .toUpperCase()
      .replace(/[\s\-_.,]/g, '') // Remove spaces, hyphens, underscores, dots, commas
      .replace(/[^\dA-Z]/g, ''); // Keep only digits and letters
  }

  // ============================================================================
  // ID TYPE DETECTION
  // ============================================================================

  /**
   * Detects the type of Kenyan ID
   */
  private detectIdType(sanitizedId: string): KenyanIdValidationResult['idType'] {
    // Check for Huduma Number format
    if (this.HUDUMA_NUMBER_PATTERN.test(sanitizedId)) {
      return 'NEW_GENERATION_ID';
    }

    // Check for numeric ID
    if (this.NATIONAL_ID_PATTERN.test(sanitizedId)) {
      const idNumber = parseInt(sanitizedId, 10);

      // Old generation IDs are 7 digits (issued before 2011)
      if (sanitizedId.length === 7 || idNumber <= this.OLD_GENERATION_MAX) {
        return 'OLD_GENERATION_ID';
      }

      // New generation IDs are 8 digits
      return 'NEW_GENERATION_ID';
    }

    return 'NATIONAL_ID'; // Default
  }

  // ============================================================================
  // FORMAT VALIDATION
  // ============================================================================

  /**
   * Validates ID format based on type
   */
  private validateFormat(
    sanitizedId: string,
    idType: KenyanIdValidationResult['idType'],
    fieldName: string,
  ): void {
    // Check old generation allowance
    if (idType === 'OLD_GENERATION_ID' && this.options?.allowOldGeneration === false) {
      throw new BadRequestException(
        `${fieldName} must be a new generation (8-digit) National ID. ` +
          `Old generation (7-digit) IDs are not accepted in this context.`,
      );
    }

    // Validate numeric ID format
    if (idType === 'OLD_GENERATION_ID' || idType === 'NEW_GENERATION_ID') {
      if (!this.NATIONAL_ID_PATTERN.test(sanitizedId)) {
        throw new BadRequestException(
          `${fieldName} must be a valid 7 or 8-digit Kenyan National ID number. ` +
            `Received: ${sanitizedId}`,
        );
      }

      // Check for obviously invalid patterns
      if (this.hasInvalidPattern(sanitizedId)) {
        throw new BadRequestException(
          `${fieldName} contains an invalid pattern. ` + `Please verify the ID number is correct.`,
        );
      }
    }

    // Validate Huduma Number format (if applicable)
    if (sanitizedId.startsWith('HUD')) {
      if (!this.HUDUMA_NUMBER_PATTERN.test(sanitizedId)) {
        throw new BadRequestException(
          `${fieldName} must be a valid Huduma Number format (HUD-########-X). ` +
            `Received: ${sanitizedId}`,
        );
      }
    }

    // Strict format validation
    if (this.options?.strictFormat) {
      this.validateStrictFormat(sanitizedId, fieldName);
    }
  }

  /**
   * Checks for obviously invalid ID patterns
   */
  private hasInvalidPattern(sanitizedId: string): boolean {
    // All zeros
    if (/^0+$/.test(sanitizedId)) {
      return true;
    }

    // All same digit (e.g., 11111111)
    if (/^(\d)\1+$/.test(sanitizedId)) {
      return true;
    }

    // Sequential ascending (e.g., 12345678)
    if (sanitizedId === '12345678' || sanitizedId === '1234567') {
      return true;
    }

    // Sequential descending (e.g., 87654321)
    if (sanitizedId === '87654321' || sanitizedId === '7654321') {
      return true;
    }

    return false;
  }

  /**
   * Validates strict format requirements
   */
  private validateStrictFormat(sanitizedId: string, fieldName: string): void {
    // New generation IDs must be exactly 8 digits
    if (this.options?.allowOldGeneration === false && sanitizedId.length !== 8) {
      throw new BadRequestException(
        `${fieldName} must be exactly 8 digits for new generation IDs.`,
      );
    }

    // Must not start with 0 (except for very old IDs)
    if (sanitizedId.startsWith('0') && sanitizedId.length === 8) {
      throw new BadRequestException(`${fieldName} cannot start with 0 for 8-digit IDs.`);
    }
  }

  // ============================================================================
  // CHECK DIGIT VALIDATION
  // ============================================================================

  /**
   * Validates check digit using Luhn-like algorithm
   * Note: This is an approximation as the exact Kenyan ID algorithm is proprietary
   */
  private validateCheckDigit(sanitizedId: string, fieldName: string): void {
    if (!this.hasValidCheckDigit(sanitizedId)) {
      throw new BadRequestException(
        `${fieldName} has an invalid check digit. ` + `Please verify the ID number is correct.`,
      );
    }
  }

  /**
   * Checks if ID has valid check digit using modified Luhn algorithm
   */
  private hasValidCheckDigit(sanitizedId: string): boolean {
    // Skip check for Huduma Numbers (different algorithm)
    if (sanitizedId.startsWith('HUD')) {
      return true; // Assume valid for now
    }

    // Skip check for IDs shorter than 7 digits
    if (sanitizedId.length < 7) {
      return false;
    }

    try {
      const digits = sanitizedId.split('').map((d) => parseInt(d, 10));
      let sum = 0;
      let isEven = false;

      // Process from right to left
      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = digits[i];

        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        isEven = !isEven;
      }

      // Valid if sum is divisible by 10
      return sum % 10 === 0;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // AGE ESTIMATION
  // ============================================================================

  /**
   * Estimates age based on ID sequence number
   * Note: This is approximate as IDs are not issued in strict chronological order
   */
  private estimateAge(sanitizedId: string): {
    age: number;
    dateOfBirth: Date;
  } {
    const idNumber = parseInt(sanitizedId, 10);
    const currentYear = new Date().getFullYear();

    // Estimate issuance year based on ID number sequence
    // This is a rough approximation
    let estimatedIssuanceYear: number;

    if (idNumber < 1000000) {
      // Very old IDs (1960s-1970s)
      estimatedIssuanceYear = this.ID_ISSUANCE_START_YEAR + Math.floor(idNumber / 50000);
    } else if (idNumber < 10000000) {
      // Old generation (1980s-2010)
      estimatedIssuanceYear = 1980 + Math.floor((idNumber - 1000000) / 300000);
    } else {
      // New generation (2011+)
      estimatedIssuanceYear = 2011 + Math.floor((idNumber - 10000000) / 1000000);
    }

    // Cap at current year
    estimatedIssuanceYear = Math.min(estimatedIssuanceYear, currentYear);

    // Estimate birth year (typically get ID at age 18)
    const estimatedBirthYear = estimatedIssuanceYear - this.AVERAGE_ID_ISSUANCE_AGE;
    const estimatedAge = currentYear - estimatedBirthYear;

    // Create approximate date of birth (use January 1st)
    const estimatedDateOfBirth = new Date(estimatedBirthYear, 0, 1);

    return {
      age: Math.max(0, estimatedAge),
      dateOfBirth: estimatedDateOfBirth,
    };
  }

  // ============================================================================
  // GENERATION SERIES
  // ============================================================================

  /**
   * Gets the generation series of the ID
   */
  private getGenerationSeries(sanitizedId: string): string {
    const idNumber = parseInt(sanitizedId, 10);

    if (sanitizedId.startsWith('HUD')) {
      return 'HUDUMA_NUMBER';
    }

    if (idNumber < this.OLD_GENERATION_MAX) {
      return 'OLD_GENERATION';
    }

    if (idNumber >= this.NEW_GENERATION_MIN) {
      return 'NEW_GENERATION';
    }

    return 'UNKNOWN';
  }

  // ============================================================================
  // WARNINGS
  // ============================================================================

  /**
   * Generates validation warnings
   */
  private generateWarnings(
    sanitizedId: string,
    idType: KenyanIdValidationResult['idType'],
    estimatedAge?: number,
  ): string[] {
    const warnings: string[] = [];

    // Old generation ID warning
    if (idType === 'OLD_GENERATION_ID') {
      warnings.push(
        'Old generation (7-digit) National ID detected. ' +
          'Consider upgrading to a new generation ID card.',
      );
    }

    // Minor warning
    if (
      estimatedAge !== undefined &&
      estimatedAge < this.rules.assetDistribution.minorProtection.ageOfMajority
    ) {
      warnings.push(
        `ID holder is estimated to be a minor (age ${estimatedAge}). ` +
          `Special legal provisions may apply.`,
      );
    }

    // Age estimation accuracy warning
    if (estimatedAge !== undefined) {
      warnings.push(
        'Age estimation is approximate based on ID sequence. ' +
          'Verify with birth certificate or other official documents for legal purposes.',
      );
    }

    // Check digit warning
    if (!this.hasValidCheckDigit(sanitizedId)) {
      warnings.push(
        'ID check digit validation failed. ' + 'This may indicate a typo or invalid ID number.',
      );
    }

    return warnings;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Checks if ID belongs to a minor
   */
  public isMinorId(idNumber: string): boolean {
    try {
      const sanitized = this.sanitizeId(idNumber);
      const ageInfo = this.estimateAge(sanitized);
      return ageInfo.age < this.rules.assetDistribution.minorProtection.ageOfMajority;
    } catch {
      return false;
    }
  }

  /**
   * Gets generation type of ID
   */
  public getIdGeneration(idNumber: string): 'OLD' | 'NEW' | 'HUDUMA' | 'UNKNOWN' {
    try {
      const sanitized = this.sanitizeId(idNumber);
      const idType = this.detectIdType(sanitized);

      switch (idType) {
        case 'OLD_GENERATION_ID':
          return 'OLD';
        case 'NEW_GENERATION_ID':
          return sanitized.startsWith('HUD') ? 'HUDUMA' : 'NEW';
        default:
          return 'UNKNOWN';
      }
    } catch {
      return 'UNKNOWN';
    }
  }

  /**
   * Validates multiple IDs for duplicates
   */
  public validateIdSet(idNumbers: string[]): {
    isValid: boolean;
    duplicates: string[];
    invalid: string[];
  } {
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const invalid: string[] = [];

    for (const id of idNumbers) {
      try {
        const sanitized = this.sanitizeId(id);
        this.validateFormat(sanitized, this.detectIdType(sanitized), 'ID');

        if (seen.has(sanitized)) {
          duplicates.push(sanitized);
        } else {
          seen.add(sanitized);
        }
      } catch {
        invalid.push(id);
      }
    }

    return {
      isValid: duplicates.length === 0 && invalid.length === 0,
      duplicates,
      invalid,
    };
  }

  /**
   * Formats ID for display (adds hyphens for readability)
   */
  public formatIdForDisplay(idNumber: string): string {
    try {
      const sanitized = this.sanitizeId(idNumber);

      // Format Huduma Numbers
      if (sanitized.startsWith('HUD')) {
        return sanitized.replace(/^(HUD)(\d{8})([A-Z])$/, '$1-$2-$3');
      }

      // Format 8-digit IDs (insert hyphen after 4th digit)
      if (sanitized.length === 8) {
        return sanitized.replace(/^(\d{4})(\d{4})$/, '$1-$2');
      }

      // Format 7-digit IDs
      if (sanitized.length === 7) {
        return sanitized.replace(/^(\d{3})(\d{4})$/, '$1-$2');
      }

      return sanitized;
    } catch {
      return idNumber;
    }
  }

  /**
   * Masks ID for privacy (shows only last 4 digits)
   */
  public maskIdForPrivacy(idNumber: string): string {
    try {
      const sanitized = this.sanitizeId(idNumber);

      if (sanitized.length <= 4) {
        return '****';
      }

      const visiblePart = sanitized.slice(-4);
      const maskedPart = '*'.repeat(sanitized.length - 4);

      return maskedPart + visiblePart;
    } catch {
      return '****';
    }
  }
}
