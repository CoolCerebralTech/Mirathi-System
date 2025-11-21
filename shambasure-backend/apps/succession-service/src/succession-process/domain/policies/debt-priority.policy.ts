import { Injectable } from '@nestjs/common';
import { Debt } from '../entities/creditor-claim.entity'; // Assuming mapped to Debt entity logic or specific Claim entity
import { DebtType } from '@prisma/client';

@Injectable()
export class DebtPriorityPolicy {
  /**
   * Sorts debts by payment priority under Section 83.
   */
  sortDebts(debts: Debt[]): Debt[] {
    const priorityMap: Record<DebtType, number> = {
      FUNERAL_EXPENSE: 1,
      TAX_OBLIGATION: 2,
      MORTGAGE: 3, // Secured
      BUSINESS_DEBT: 4, // Usually Secured or Preferred
      MEDICAL_BILL: 5,
      CREDIT_CARD: 6,
      PERSONAL_LOAN: 6,
      OTHER: 7,
    };

    return [...debts].sort((a, b) => {
      const pA = priorityMap[a.getType()] || 99;
      const pB = priorityMap[b.getType()] || 99;
      return pA - pB;
    });
  }

  /**
   * Checks if the estate is ready for distribution.
   * Blocking Rule: All Funeral and Tax debts must be paid.
   */
  canDistributeAssets(outstandingDebts: Debt[]): { allowed: boolean; blockingReason?: string } {
    const blocking = outstandingDebts.find(
      (d) => d.getType() === 'FUNERAL_EXPENSE' || d.getType() === 'TAX_OBLIGATION',
    );

    if (blocking) {
      return {
        allowed: false,
        blockingReason: `First Charge debts must be settled before distribution: ${blocking.getDescription()} (${blocking.getType()})`,
      };
    }

    return { allowed: true };
  }
}
