import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class KenyanPhonePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'body' && this.isPhoneField(metadata.data)) {
      return this.validateAndFormatPhone(value, metadata.data || 'phone');
    }
    return value;
  }

  private isPhoneField(fieldName?: string): boolean {
    if (!fieldName) return false;

    const phoneFields = ['phone', 'phoneNumber', 'mobile', 'contactNumber', 'phoneVerified'];
    return phoneFields.some((field) => fieldName.toLowerCase().includes(field.toLowerCase()));
  }

  private validateAndFormatPhone(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }

    // Remove any non-digit characters
    const cleanNumber = value.replace(/\D/g, '');

    // Kenyan phone number validation
    let formattedNumber: string;

    if (cleanNumber.startsWith('254') && cleanNumber.length === 12) {
      // Format: 254712345678
      formattedNumber = `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('07') && cleanNumber.length === 10) {
      // Format: 0712345678 -> +254712345678
      formattedNumber = `+254${cleanNumber.substring(1)}`;
    } else if (cleanNumber.startsWith('7') && cleanNumber.length === 9) {
      // Format: 712345678 -> +254712345678
      formattedNumber = `+254${cleanNumber}`;
    } else {
      throw new BadRequestException(
        `${fieldName} must be a valid Kenyan phone number format: ` +
          `+254712345678, 0712345678, or 712345678`,
      );
    }

    // Validate mobile prefix (Kenyan mobile numbers start with 7 or 1)
    const prefix = formattedNumber.substring(4, 5);
    if (!['7', '1'].includes(prefix)) {
      throw new BadRequestException(`${fieldName} must be a valid Kenyan mobile number`);
    }

    return formattedNumber;
  }

  // Static method for manual validation
  static isValidKenyanPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    const kenyanPhoneRegex = /^(\+254|0|254)?[17]\d{8}$/;
    return kenyanPhoneRegex.test(cleanPhone);
  }
}
