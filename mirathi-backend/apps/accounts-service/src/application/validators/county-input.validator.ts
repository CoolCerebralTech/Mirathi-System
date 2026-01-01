// src/application/validators/county-input.validator.ts
import { Injectable } from '@nestjs/common';
import { KenyanCounty } from '@prisma/client';

import { County } from '../../domain/value-objects';
import { InvalidInputException } from '../exceptions/user.exception';

@Injectable()
export class CountyInputValidator {
  /**
   * Validate and create County value object
   */
  validateAndCreate(county: string): County {
    try {
      return County.create(county);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidInputException('county', error.message);
      }
      throw error;
    }
  }

  /**
   * Validate county enum value
   */
  validateEnum(county: string): void {
    const validCounties = Object.values(KenyanCounty);
    const normalized = county.toUpperCase().replace(/\s+/g, '_');

    if (!validCounties.includes(normalized as KenyanCounty)) {
      throw new InvalidInputException(
        'county',
        `Invalid county. Must be one of the 47 Kenyan counties`,
      );
    }
  }
}
