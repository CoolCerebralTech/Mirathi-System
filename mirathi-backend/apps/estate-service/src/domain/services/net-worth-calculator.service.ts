import { Injectable } from '@nestjs/common';

import { Money } from '../value-objects/money.vo';
import { NetWorth } from '../value-objects/net-worth.vo';

// =============================================================================
// NET WORTH CALCULATOR SERVICE
// =============================================================================

@Injectable()
export class NetWorthCalculatorService {
  /**
   * Calculates the net worth from assets and debts
   */
  calculate(totalAssets: number, totalDebts: number): NetWorth {
    const assets = new Money(totalAssets);
    const debts = new Money(totalDebts);
    return NetWorth.calculate(assets, debts);
  }

  /**
   * Calculates total value from array of amounts
   */
  calculateTotal(amounts: number[]): number {
    return amounts.reduce((sum, amount) => sum + amount, 0);
  }
}
