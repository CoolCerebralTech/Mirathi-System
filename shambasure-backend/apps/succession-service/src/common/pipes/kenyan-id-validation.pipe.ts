import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class KenyanIdValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if ((metadata.type === 'param' || metadata.type === 'body') && metadata.data) {
      return this.validateKenyanId(value, metadata.data);
    }
    return value;
  }

  private validateKenyanId(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    // Kenyan ID format: 1-8 digits (old format) or new format with check digit
    const kenyanIdRegex = /^\d{1,8}$/;

    if (!kenyanIdRegex.test(value)) {
      throw new BadRequestException(`${fieldName} must be a valid 1-8 digit Kenyan National ID`);
    }

    // Additional validation for new ID format (if implemented)
    if (value.length === 8) {
      const isValid = this.validateIdWithCheckDigit(value);
      if (!isValid) {
        throw new BadRequestException(`${fieldName} has invalid format`);
      }
    }

    return value;
  }

  private validateIdWithCheckDigit(id: string): boolean {
    // Simple check digit validation for Kenyan ID
    // In reality, this would use the official algorithm
    const digits = id.split('').map(Number);
    const checkDigit = digits.pop(); // Last digit is check digit

    // Simple validation example - replace with actual algorithm
    const sum = digits.reduce((acc, digit) => acc + digit, 0);
    const calculatedCheckDigit = sum % 10;

    return checkDigit === calculatedCheckDigit;
  }
}
