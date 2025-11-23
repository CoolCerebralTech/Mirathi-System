import { Injectable } from '@nestjs/common';
import { DebtType } from '@prisma/client';

export interface Debt {
  getId(): string;
  getType(): DebtType;
  getDescription(): string;
  getOutstandingBalance(): number;
  getPriority(): number;
  isSecured(): boolean;
  hasPreferentialStatus(): boolean;
}

@Injectable()
export class DebtPriorityPolicy {
  private readonly debtPriority: Map<DebtType, number> = new Map([
    ['FUNERAL_EXPENSE', 1], // First charge - Reasonable funeral expenses
    ['TAX_OBLIGATION', 2], // Second charge - Government taxes
    ['MEDICAL_BILL', 3], // Third charge - Last illness medical expenses
    ['MORTGAGE', 4], // Secured debts - Specific asset charges
    ['BUSINESS_DEBT', 5], // Business debts with security
    ['PERSONAL_LOAN', 6], // Unsecured personal loans
    ['CREDIT_CARD', 7], // Credit card debts
    ['OTHER', 8], // Other unsecured debts
  ]);

  /**
   * Sorts debts by payment priority under Kenyan law (Section 83)
   */
  sortDebts(debts: Debt[]): { priority: number; debt: Debt }[] {
    return debts
      .map((debt) => ({
        priority: this.getDebtPriority(debt),
        debt,
      }))
      .sort((a, b) => a.priority - b.priority)
      .map((item, index) => ({
        ...item,
        priority: index + 1, // Re-number sequentially
      }));
  }

  /**
   * Validates if estate can proceed with distribution
   */
  canDistributeAssets(
    outstandingDebts: Debt[],
    estateLiquidAssets: number,
  ): { allowed: boolean; blockingReasons: string[]; warnings: string[] } {
    const blockingReasons: string[] = [];
    const warnings: string[] = [];

    // Sort debts by priority
    const sortedDebts = this.sortDebts(outstandingDebts);

    // Calculate total debt and priority debt amounts
    const totalDebt = outstandingDebts.reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);
    const priorityDebt = sortedDebts
      .filter((item) => item.priority <= 3) // First three priority levels
      .reduce((sum, item) => sum + item.debt.getOutstandingBalance(), 0);

    // 1. Check if priority debts can be paid
    if (priorityDebt > estateLiquidAssets) {
      blockingReasons.push(
        `Insufficient liquid assets (KES ${estateLiquidAssets.toLocaleString()}) to cover priority debts (KES ${priorityDebt.toLocaleString()})`,
      );
    }

    // 2. Check specific blocking debts
    const blockingDebts = outstandingDebts.filter(
      (debt) => debt.getType() === 'FUNERAL_EXPENSE' || debt.getType() === 'TAX_OBLIGATION',
    );

    if (blockingDebts.length > 0) {
      const unpaidBlocking = blockingDebts.filter((debt) => debt.getOutstandingBalance() > 0);
      if (unpaidBlocking.length > 0) {
        blockingReasons.push(
          'First charge debts (funeral expenses and taxes) must be fully settled before distribution',
        );
      }
    }

    // 3. Check secured debts
    const securedDebts = outstandingDebts.filter((debt) => debt.isSecured());
    if (securedDebts.length > 0) {
      warnings.push(
        'Secured debts should be settled or arrangements made with creditors before distribution',
      );
    }

    // 4. Check overall debt burden
    if (totalDebt > estateLiquidAssets * 0.8) {
      warnings.push('High debt burden: Consider creditor negotiations or asset sales');
    }

    return {
      allowed: blockingReasons.length === 0,
      blockingReasons,
      warnings,
    };
  }

  /**
   * Calculates payment schedule for debts
   */
  calculatePaymentSchedule(
    debts: Debt[],
    availableFunds: number,
  ): { debt: Debt; amountToPay: number; priority: number }[] {
    const sortedDebts = this.sortDebts(debts);
    const paymentSchedule: { debt: Debt; amountToPay: number; priority: number }[] = [];
    let remainingFunds = availableFunds;

    for (const { debt, priority } of sortedDebts) {
      const outstanding = debt.getOutstandingBalance();

      if (remainingFunds <= 0) break;

      const amountToPay = Math.min(outstanding, remainingFunds);
      paymentSchedule.push({ debt, amountToPay, priority });
      remainingFunds -= amountToPay;
    }

    return paymentSchedule;
  }

  /**
   * Validates if a debt settlement is reasonable
   */
  validateSettlement(
    debt: Debt,
    settlementAmount: number,
    outstandingBalance: number,
  ): { valid: boolean; reason?: string; recommendation?: string } {
    const settlementRatio = settlementAmount / outstandingBalance;

    // Full payment for priority debts
    if (this.getDebtPriority(debt) <= 3 && settlementRatio < 1) {
      return {
        valid: false,
        reason: 'Priority debts (funeral, taxes, medical) must be paid in full',
        recommendation: 'Seek court approval for partial settlement',
      };
    }

    // Reasonable settlement for unsecured debts
    if (settlementRatio < 0.3) {
      return {
        valid: false,
        reason: 'Settlement offer too low (less than 30%)',
        recommendation: 'Negotiate for higher settlement or seek court approval',
      };
    }

    if (settlementRatio > 1) {
      return {
        valid: false,
        reason: 'Settlement amount exceeds outstanding balance',
        recommendation: 'Verify debt amount and interest calculations',
      };
    }

    return { valid: true };
  }

  private getDebtPriority(debt: Debt): number {
    return this.debtPriority.get(debt.getType()) || 99;
  }
}
