// =============================================================================
// KENYAN SUCCESSION RULES SERVICE
// Implements S.45 Law of Succession Act (Debt Priority)
// =============================================================================
import { Injectable } from '@nestjs/common';

import { DebtCategory, DebtPriority } from '../entities/debt.entity';

@Injectable()
export class KenyanSuccessionRulesService {
  /**
   * Determines debt priority based on S.45 LSA
   * Order: Funeral → Taxes → Secured → Unsecured
   */
  determineDebtPriority(category: DebtCategory, isSecured: boolean): DebtPriority {
    // S.45(a) - Funeral expenses and testamentary expenses
    if (category === DebtCategory.FUNERAL_EXPENSES) {
      return DebtPriority.CRITICAL;
    }

    // S.45(a) - Taxes, rates, and wages
    if (category === DebtCategory.TAXES_OWED) {
      return DebtPriority.CRITICAL;
    }

    // S.45(b) - Secured debts
    if (isSecured || category === DebtCategory.MORTGAGE) {
      return DebtPriority.HIGH;
    }

    // S.45(c) - Priority unsecured debts
    if (category === DebtCategory.MEDICAL_BILLS) {
      return DebtPriority.MEDIUM;
    }

    // S.45(d) - General unsecured debts
    return DebtPriority.LOW;
  }

  /**
   * Validates if a will meets Kenyan legal requirements
   */
  validateWillRequirements(
    hasExecutor: boolean,
    witnessCount: number,
    beneficiaryCount: number,
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Kenyan Law Requirement: Must have at least 2 witnesses
    if (witnessCount < 2) {
      violations.push('Will must be witnessed by at least 2 people (S.11 LSA)');
    }

    // Recommended: Should have an executor
    if (!hasExecutor) {
      violations.push('Will should appoint an executor');
    }

    // Recommended: Should have beneficiaries
    if (beneficiaryCount === 0) {
      violations.push('Will should specify at least one beneficiary');
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Checks if estate is solvent (can pay all debts)
   */
  checkSolvency(
    totalAssets: number,
    totalDebts: number,
  ): {
    isSolvent: boolean;
    netPosition: number;
    message: string;
  } {
    const netPosition = totalAssets - totalDebts;
    const isSolvent = netPosition >= 0;

    return {
      isSolvent,
      netPosition,
      message: isSolvent
        ? `Estate is solvent with net value of KES ${netPosition.toLocaleString()}`
        : `Estate is insolvent. Debts exceed assets by KES ${Math.abs(netPosition).toLocaleString()}`,
    };
  }
}
