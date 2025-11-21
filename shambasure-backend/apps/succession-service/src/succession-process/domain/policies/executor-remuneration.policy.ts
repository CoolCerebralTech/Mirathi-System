import { Injectable } from '@nestjs/common';
import { EstateValuation } from '../value-objects/estate-valuation.vo';

@Injectable()
export class ExecutorRemunerationPolicy {
  validateFee(
    valuation: EstateValuation,
    proposedFee: number,
  ): { acceptable: boolean; limit: number; warning?: string } {
    const grossValue = valuation.getGrossAmount();

    // Standard guideline: 5% of Gross Assets
    const maxStandardFee = grossValue * 0.05;

    if (proposedFee > maxStandardFee) {
      return {
        acceptable: false,
        limit: maxStandardFee,
        warning: 'Proposed fee exceeds standard 5%. Requires special application to Court.',
      };
    }

    return { acceptable: true, limit: maxStandardFee };
  }
}
