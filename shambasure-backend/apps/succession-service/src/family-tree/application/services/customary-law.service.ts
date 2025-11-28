import { Injectable } from '@nestjs/common';

import { CustomaryMarriagePolicy } from '../../domain/policies/customary-marriage.policy';
import { CustomaryRites } from '../../domain/value-objects/customary-rites.vo';

export interface CustomaryAssessmentDto {
  dowryPaymentStatus: 'NONE' | 'PARTIAL' | 'FULL';
  ceremonyDate?: Date;
  witnessedByElders: boolean;
  cohabitationStart?: Date;
  affidavitExists: boolean;
}

@Injectable()
export class CustomaryLawService {
  constructor(private readonly policy: CustomaryMarriagePolicy) {}

  /**
   * Analyzes the strength of a customary marriage claim.
   * Used for UI "Pre-flight" checks.
   */
  assessUnionLegitimacy(dto: CustomaryAssessmentDto): {
    isValid: boolean;
    status: string;
    advice: string;
  } {
    const rites = new CustomaryRites({
      dowryPaymentStatus: dto.dowryPaymentStatus,
      ceremonyDate: dto.ceremonyDate,
      witnessedByElders: dto.witnessedByElders,
      cohabitationStart: dto.cohabitationStart,
      affidavitExists: dto.affidavitExists,
    });

    return this.policy.validateCustomaryUnion(rites);
  }
}
