// =============================================================================
// WILL VALIDATOR SERVICE
// =============================================================================
import { Injectable } from '@nestjs/common';

import { WillCompleteness } from '../value-objects/will-completeness.vo';

@Injectable()
export class WillValidatorService {
  constructor() {}

  /**
   * Validates will completeness and legal compliance
   */
  validateCompleteness(
    hasExecutor: boolean,
    beneficiaryCount: number,
    witnessCount: number,
  ): WillCompleteness {
    return WillCompleteness.calculate(hasExecutor, beneficiaryCount, witnessCount);
  }

  /**
   * Checks if witness is eligible (not a beneficiary)
   */
  validateWitnessEligibility(
    witnessId: string,
    beneficiaryIds: string[],
  ): { isEligible: boolean; reason?: string } {
    if (beneficiaryIds.includes(witnessId)) {
      return {
        isEligible: false,
        reason: 'Witness cannot be a beneficiary (S.11 LSA)',
      };
    }

    return { isEligible: true };
  }

  /**
   * Generates warnings and recommendations
   */
  generateRecommendations(
    hasExecutor: boolean,
    beneficiaryCount: number,
    witnessCount: number,
    hasSpecialInstructions: boolean,
  ): string[] {
    const recommendations: string[] = [];

    if (!hasExecutor) {
      recommendations.push('💡 Consider appointing a trusted executor to manage your estate');
    }

    if (beneficiaryCount === 0) {
      recommendations.push('💡 Add beneficiaries to specify who should inherit your assets');
    }

    if (witnessCount < 2) {
      recommendations.push('⚠️ CRITICAL: Add 2 witnesses to make your will legally valid');
    }

    if (!hasSpecialInstructions) {
      recommendations.push('💡 Consider adding funeral wishes or special instructions');
    }

    if (beneficiaryCount > 0 && !hasExecutor) {
      recommendations.push(
        '⚠️ You have beneficiaries but no executor. Who will distribute your estate?',
      );
    }

    return recommendations;
  }
}
