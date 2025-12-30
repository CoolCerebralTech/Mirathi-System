import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsPhoneNumber, Matches } from 'class-validator';

const KENYA_PHONE_REGEX = /^(\+254|0)(7[0-9]|1[0-1])\d{7}$/;

export function IsKenyanPhoneNumber() {
  return applyDecorators(
    IsPhoneNumber('KE', { message: 'Please provide a valid Kenyan phone number.' }),
    Matches(KENYA_PHONE_REGEX, {
      message: 'Phone number must be a valid Kenyan number (e.g., +254712345678 or 0712345678).',
    }),
    Transform(({ value }: { value: string }) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('0')) {
          return `+254${trimmed.substring(1)}`;
        }
        return trimmed;
      }
      return value;
    }),
  );
}
