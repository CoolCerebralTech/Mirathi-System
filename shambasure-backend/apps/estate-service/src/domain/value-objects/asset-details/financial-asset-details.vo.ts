// src/estate-service/src/domain/value-objects/asset-details/financial-asset-details.vo.ts
import { ValueObject } from '../../base/value-object';
import { ValueObjectValidationError } from '../../base/value-object';

/**
 * Financial Asset Details Value Object
 *
 * Kenyan Legal Context:
 * - Bank accounts require letters of administration
 * - SACCO shares follow SACCO society rules
 * - Investments may have lock-in periods
 */
export interface FinancialAssetDetailsProps {
  institutionName: string;
  accountNumber: string;
  accountType: string;
  branchName?: string;
  accountHolderName: string;
  currency: string;
  interestRate?: number;
  maturityDate?: Date;
  isJointAccount: boolean;
  jointAccountHolders?: string[];
}

export class FinancialAssetDetailsVO extends ValueObject<FinancialAssetDetailsProps> {
  constructor(props: FinancialAssetDetailsProps) {
    super(props);
  }

  protected validate(): void {
    // Institution validation
    if (!this.props.institutionName || this.props.institutionName.trim().length === 0) {
      throw new ValueObjectValidationError(
        'Financial institution name is required',
        'institutionName',
      );
    }

    // Account number validation
    if (!this.props.accountNumber || this.props.accountNumber.trim().length < 5) {
      throw new ValueObjectValidationError('Valid account number is required', 'accountNumber');
    }

    // Account type validation
    if (!this.props.accountType || this.props.accountType.trim().length === 0) {
      throw new ValueObjectValidationError('Account type is required', 'accountType');
    }

    // Account holder validation
    if (!this.props.accountHolderName || this.props.accountHolderName.trim().length === 0) {
      throw new ValueObjectValidationError('Account holder name is required', 'accountHolderName');
    }

    // Joint account validation
    if (
      this.props.isJointAccount &&
      (!this.props.jointAccountHolders || this.props.jointAccountHolders.length === 0)
    ) {
      throw new ValueObjectValidationError(
        'Joint account must have joint account holders',
        'jointAccountHolders',
      );
    }

    // Interest rate validation
    if (this.props.interestRate && (this.props.interestRate < 0 || this.props.interestRate > 100)) {
      throw new ValueObjectValidationError(
        'Interest rate must be between 0 and 100',
        'interestRate',
      );
    }
  }

  /**
   * Check if this is a bank account
   */
  isBankAccount(): boolean {
    const banks = ['BANK', 'SACCO', 'COOPERATIVE'];
    return banks.some((bank) => this.props.institutionName.toUpperCase().includes(bank));
  }

  /**
   * Check if this is an investment account
   */
  isInvestmentAccount(): boolean {
    const investments = ['INVESTMENT', 'STOCK', 'SHARES', 'BOND', 'MUTUAL FUND'];
    return investments.some((investment) =>
      this.props.accountType.toUpperCase().includes(investment),
    );
  }

  /**
   * Check if account has restrictions
   */
  hasRestrictions(): boolean {
    return this.props.maturityDate !== undefined || this.props.isJointAccount;
  }

  /**
   * Check if account is accessible
   */
  isAccessible(): boolean {
    if (this.props.maturityDate) {
      return new Date() >= this.props.maturityDate;
    }
    return true;
  }

  /**
   * Get freeze period (days)
   */
  getFreezePeriod(): number {
    if (this.isBankAccount()) return 30; // Banks typically freeze for 30 days
    if (this.isInvestmentAccount()) return 14; // Investments may take 14 days
    return 7; // Default
  }

  /**
   * Check if requires court order
   */
  requiresCourtOrder(): boolean {
    return this.isJointAccount || !this.isAccessible();
  }

  toJSON(): Record<string, any> {
    return {
      institutionName: this.props.institutionName,
      accountNumber: this.props.accountNumber,
      accountType: this.props.accountType,
      branchName: this.props.branchName,
      accountHolderName: this.props.accountHolderName,
      currency: this.props.currency,
      interestRate: this.props.interestRate,
      maturityDate: this.props.maturityDate,
      isJointAccount: this.props.isJointAccount,
      jointAccountHolders: this.props.jointAccountHolders,
      isBankAccount: this.isBankAccount(),
      isInvestment: this.isInvestmentAccount(),
      hasRestrictions: this.hasRestrictions(),
      isAccessible: this.isAccessible(),
      freezePeriod: this.getFreezePeriod(),
      requiresCourtOrder: this.requiresCourtOrder(),
    };
  }
}
