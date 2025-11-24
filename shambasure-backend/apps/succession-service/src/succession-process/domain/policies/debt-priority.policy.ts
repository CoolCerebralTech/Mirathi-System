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
  getInterestRate?(): number;
  getDueDate?(): Date;
  // NEW: Kenyan-specific debt properties
  isStatutory?(): boolean;
  isCooperative?(): boolean;
}

@Injectable()
export class DebtPriorityPolicy {
  private readonly debtPriority: Map<DebtType, number> = new Map([
    ['FUNERAL_EXPENSE', 1], // First charge - Reasonable funeral expenses
    ['TAX_OBLIGATION', 2], // Second charge - Government taxes (includes NHIF, NSSF)
    ['MEDICAL_BILL', 3], // Third charge - Last illness medical expenses
    ['MORTGAGE', 4], // Secured debts - Specific asset charges
    ['BUSINESS_DEBT', 5], // Business debts with security (includes cooperative loans)
    ['PERSONAL_LOAN', 6], // Unsecured personal loans
    ['CREDIT_CARD', 7], // Credit card debts
    ['OTHER', 8], // Other unsecured debts
  ]);

  /**
   * Enhanced debt priority calculation with Kenyan context
   */
  private getEnhancedDebtPriority(debt: Debt): number {
    const basePriority = this.debtPriority.get(debt.getType()) || 99;

    // Adjust priority based on Kenyan-specific characteristics
    if (debt.isStatutory?.()) {
      // Statutory debts (like NHIF, NSSF) get higher priority
      return Math.max(2, basePriority - 1); // Promote to near tax obligation level
    }

    if (debt.isCooperative?.()) {
      // Cooperative loans get moderate priority adjustment
      return Math.max(4, basePriority - 0.5); // Slight promotion
    }

    return basePriority;
  }

  /**
   * Sorts debts by payment priority under Kenyan law (Section 83)
   */
  sortDebts(debts: Debt[]): { priority: number; debt: Debt }[] {
    return debts
      .map((debt) => ({
        priority: this.getEnhancedDebtPriority(debt),
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

    // 3. Check statutory debts specifically
    const statutoryDebts = outstandingDebts.filter((debt) => debt.isStatutory?.());
    if (statutoryDebts.length > 0) {
      const unpaidStatutory = statutoryDebts.filter((debt) => debt.getOutstandingBalance() > 0);
      if (unpaidStatutory.length > 0) {
        warnings.push(
          'Statutory obligations (NHIF, NSSF, etc.) should be prioritized to avoid penalties',
        );
      }
    }

    // 4. Check secured debts
    const securedDebts = outstandingDebts.filter((debt) => debt.isSecured());
    if (securedDebts.length > 0) {
      warnings.push(
        'Secured debts should be settled or arrangements made with creditors before distribution',
      );
    }

    // 5. Check overall debt burden
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
    const debtPriority = this.getEnhancedDebtPriority(debt);
    if (debtPriority <= 3 && settlementRatio < 1) {
      return {
        valid: false,
        reason: 'Priority debts (funeral, taxes, medical) must be paid in full',
        recommendation: 'Seek court approval for partial settlement',
      };
    }

    // Statutory debts require special handling
    if (debt.isStatutory?.() && settlementRatio < 1) {
      return {
        valid: false,
        reason: 'Statutory obligations require full payment or formal settlement agreement',
        recommendation: 'Contact the relevant statutory body for settlement options',
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

  /**
   * Kenyan law compliance validation for settlements
   */
  validateKenyanSettlementCompliance(
    debt: Debt,
    settlementAmount: number,
  ): { compliant: boolean; legalRequirements: string[] } {
    const legalRequirements: string[] = [];

    // Kenyan law: Funeral expenses must be "reasonable"
    if (debt.getType() === 'FUNERAL_EXPENSE' && settlementAmount > 500000) {
      legalRequirements.push('Funeral expenses exceeding KES 500,000 require court approval');
    }

    // Kenyan law: Tax obligations cannot be settled for less than full amount without KRA approval
    if (debt.getType() === 'TAX_OBLIGATION' && settlementAmount < debt.getOutstandingBalance()) {
      legalRequirements.push(
        'Tax obligations require full payment or formal KRA settlement agreement',
      );
    }

    // Statutory debts (NHIF, NSSF) have specific rules
    if (debt.isStatutory?.() && settlementAmount < debt.getOutstandingBalance()) {
      legalRequirements.push(
        'Statutory debts require full payment or formal settlement with the institution',
      );
    }

    return {
      compliant: legalRequirements.length === 0,
      legalRequirements,
    };
  }

  /**
   * Enhanced debt analysis with Kenyan context
   */
  analyzeDebtPortfolio(
    debts: Debt[],
    estateValue: number,
  ): {
    summary: {
      totalDebt: number;
      priorityDebt: number;
      securedDebt: number;
      statutoryDebt: number;
      cooperativeDebt: number;
      debtToEstateRatio: number;
    };
    recommendations: string[];
    risks: string[];
  } {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);
    const priorityDebt = debts
      .filter((debt) => this.getEnhancedDebtPriority(debt) <= 3)
      .reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);
    const securedDebt = debts
      .filter((debt) => debt.isSecured())
      .reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);
    const statutoryDebt = debts
      .filter((debt) => debt.isStatutory?.())
      .reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);
    const cooperativeDebt = debts
      .filter((debt) => debt.isCooperative?.())
      .reduce((sum, debt) => sum + debt.getOutstandingBalance(), 0);

    const debtToEstateRatio = totalDebt / estateValue;

    const recommendations: string[] = [];
    const risks: string[] = [];

    // Risk assessment
    if (debtToEstateRatio > 0.7) {
      risks.push('High debt burden: Estate may be insolvent');
      recommendations.push('Consider filing for insolvency administration');
    }

    if (priorityDebt > estateValue * 0.5) {
      risks.push('Priority debts consume significant portion of estate');
      recommendations.push('Focus on liquidating assets to cover priority obligations');
    }

    // Kenyan-specific recommendations based on debt characteristics
    if (statutoryDebt > 0) {
      recommendations.push(
        'Contact relevant statutory bodies (KRA, NHIF, NSSF) for debt verification',
      );
    }

    if (cooperativeDebt > 0) {
      recommendations.push('Contact cooperative society for potential restructuring options');
    }

    // General recommendations
    if (securedDebt > 0) {
      recommendations.push('Consider asset sales to cover secured debts and avoid foreclosure');
    }

    return {
      summary: {
        totalDebt,
        priorityDebt,
        securedDebt,
        statutoryDebt,
        cooperativeDebt,
        debtToEstateRatio,
      },
      recommendations,
      risks,
    };
  }

  /**
   * Helper method to identify statutory debts from description
   */
  isLikelyStatutoryDebt(debt: Debt): boolean {
    const description = debt.getDescription().toLowerCase();
    const statutoryKeywords = ['nhif', 'nssf', 'kra', 'tax', 'statutory', 'government', 'revenue'];
    return statutoryKeywords.some((keyword) => description.includes(keyword));
  }

  /**
   * Helper method to identify cooperative debts from description
   */
  isLikelyCooperativeDebt(debt: Debt): boolean {
    const description = debt.getDescription().toLowerCase();
    const cooperativeKeywords = ['cooperative', 'sacco', 'chama', 'society'];
    return cooperativeKeywords.some((keyword) => description.includes(keyword));
  }
}
