// src/estate-service/src/domain/value-objects/asset-details/financial-asset-details.vo.ts
import { ValueObject, ValueObjectValidationError } from '../../base/value-object';

export interface FinancialAssetDetailsProps {
  institutionName: string;
  accountNumber: string;
  accountType: string; // e.g., SAVINGS, CURRENT, SHARES, FIXED_DEPOSIT
  branchName?: string;
  accountHolderName: string;
  currency: string;
  interestRate?: number;
  maturityDate?: Date;
  isJointAccount: boolean;
  jointAccountHolders?: string[];
}

/**
 * Financial Asset Details
 *
 * Handles Bank Accounts, SACCO Shares, and Investment Accounts.
 */
export class FinancialAssetDetailsVO extends ValueObject<FinancialAssetDetailsProps> {
  constructor(props: FinancialAssetDetailsProps) {
    super(props);
  }
  public static create(props: FinancialAssetDetailsProps): FinancialAssetDetailsVO {
    return new FinancialAssetDetailsVO(props);
  }
  protected validate(): void {
    if (!this.props.institutionName?.trim())
      throw new ValueObjectValidationError('Institution Name Required', 'institutionName');
    if (!this.props.accountNumber?.trim())
      throw new ValueObjectValidationError('Account Number Required', 'accountNumber');
    if (!this.props.accountType?.trim())
      throw new ValueObjectValidationError('Account Type Required', 'accountType');

    if (
      this.props.isJointAccount &&
      (!this.props.jointAccountHolders || this.props.jointAccountHolders.length === 0)
    ) {
      throw new ValueObjectValidationError(
        'Joint accounts must specify holders',
        'jointAccountHolders',
      );
    }
  }

  isBankAccount(): boolean {
    const type = this.props.accountType.toUpperCase();
    return ['SAVINGS', 'CURRENT', 'CHECKING', 'TRANSACTIONAL'].some((t) => type.includes(t));
  }

  isInvestmentAccount(): boolean {
    const type = this.props.accountType.toUpperCase();
    return ['SHARES', 'BOND', 'MUTUAL_FUND', 'UNIT_TRUST', 'FIXED_DEPOSIT', 'SACCO'].some((t) =>
      type.includes(t),
    );
  }

  /**
   * Returns the "Liquidity Tier" - How fast can this be turned into cash?
   * 1 = Instant (Cash/Bank), 2 = Fast (Shares), 3 = Slow (Fixed Deposit/Bonds)
   */
  getLiquidityTier(): number {
    if (this.isBankAccount()) return 1;
    if (this.props.maturityDate && this.props.maturityDate > new Date()) return 3; // Locked
    return 2;
  }

  requiresCourtOrderToLiquidate(): boolean {
    // Almost all deceased accounts require Grant of Letters of Administration
    return true;
  }

  toJSON(): Record<string, any> {
    return {
      ...this.props,
      isJoint: this.props.isJointAccount,
      category: this.isBankAccount() ? 'BANKING' : 'INVESTMENT',
    };
  }
}
