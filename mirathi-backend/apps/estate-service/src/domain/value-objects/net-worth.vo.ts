import { Money } from './money.vo';

export class NetWorth {
  constructor(
    public readonly totalAssets: Money,
    public readonly totalDebts: Money,
    public readonly netWorth: Money,
    public readonly isInsolvent: boolean,
  ) {}

  static calculate(totalAssets: Money, totalDebts: Money): NetWorth {
    const netWorthAmount = totalAssets.amount - totalDebts.amount;
    const isInsolvent = netWorthAmount < 0;

    return new NetWorth(
      totalAssets,
      totalDebts,
      new Money(Math.max(0, netWorthAmount)),
      isInsolvent,
    );
  }
}
