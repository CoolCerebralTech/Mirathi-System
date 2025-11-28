import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Validates and sanitizes a string to ensure it is a valid Kenyan phone number.
 * - Accepts formats: +2547..., 07..., 7...
 * - Normalizes the number to the E.164 international format (+254...).
 * - Rejects invalid formats or non-mobile prefixes.
 */
@Injectable()
export class KenyanPhonePipe implements PipeTransform<string, string> {
  // --- IMPROVEMENT: Aligned with our professional architecture ---
  // The pipe is now a proper injectable service with a constructor,
  // making it consistent and future-proofing it for any potential dependencies.
  constructor() {}

  public transform(value: string, metadata: ArgumentMetadata): string {
    const fieldName = metadata.data || 'The phone number field';
    return this.validateAndFormatPhone(value, fieldName);
  }

  private validateAndFormatPhone(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !value) {
      throw new BadRequestException(`${fieldName} must be a non-empty string.`);
    }

    // Sanitize the input by removing all non-digit characters
    const cleanNumber = value.replace(/\D/g, '');

    let formattedNumber: string;

    // Normalize different valid Kenyan formats to the E.164 standard
    if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
      // Input: 254712345678 -> +254712345678
      formattedNumber = `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0') && cleanNumber.length === 10) {
      // Input: 0712345678 -> +254712345678
      formattedNumber = `+254${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9) {
      // Input: 712345678 -> +254712345678
      formattedNumber = `+254${cleanNumber}`;
    } else {
      throw new BadRequestException(
        `${fieldName} appears to be an invalid Kenyan phone number format.`,
      );
    }

    // Final validation for length and prefix (Safaricom, Airtel, Telkom)
    // Kenyan numbers are +254 followed by 9 digits. Prefixes start with 7 or 1.
    const kenyanRegex = /^\+254[17]\d{8}$/;
    if (!kenyanRegex.test(formattedNumber)) {
      throw new BadRequestException(
        `${fieldName} must be a valid Kenyan mobile number (e.g., starting with +2547... or +2541...).`,
      );
    }

    return formattedNumber;
  }
}
