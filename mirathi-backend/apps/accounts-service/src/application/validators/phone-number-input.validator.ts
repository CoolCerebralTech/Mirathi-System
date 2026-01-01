// src/application/validators/phone-number-input.validator.ts
import { Injectable } from '@nestjs/common';

import { InvalidPhoneNumberError, PhoneNumber } from '../../domain/value-objects';
import { InvalidInputException } from '../exceptions/user.exception';

@Injectable()
export class PhoneNumberInputValidator {
  /**
   * Validate and create PhoneNumber value object
   * Converts domain errors to application exceptions
   */
  validateAndCreate(phoneNumber: string): PhoneNumber {
    try {
      return PhoneNumber.create(phoneNumber);
    } catch (error) {
      if (error instanceof InvalidPhoneNumberError) {
        throw new InvalidInputException('phoneNumber', error.message);
      }
      throw error;
    }
  }

  /**
   * Validate phone number format (without creating VO)
   */
  validate(phoneNumber: string): void {
    try {
      PhoneNumber.create(phoneNumber);
    } catch (error) {
      if (error instanceof InvalidPhoneNumberError) {
        throw new InvalidInputException('phoneNumber', error.message);
      }
      throw error;
    }
  }
}
