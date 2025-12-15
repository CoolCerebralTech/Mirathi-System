// domain/interfaces/services/idependency-calculator.service.ts
import { DependencyCalculation } from '../../value-objects/financial/dependency-calculation.vo';

export interface FinancialRecords {
  bankStatements?: string[]; // IDs
  mobileMoneyStatements?: string[]; // IDs
  receipts?: string[]; // IDs
}

export interface IDependencyCalculatorService {
  /**
   * Analyzes financial records to determine the level of support
   * the deceased provided to the dependant.
   *
   * @param deceasedIncome - Total known income of deceased
   * @param dependantNeeds - Estimated monthly needs of dependant
   * @param proofDocuments - Financial records
   */
  calculateDependencyRatio(
    deceasedIncome: number,
    dependantNeeds: number,
    proofDocuments: FinancialRecords,
  ): Promise<DependencyCalculation>;

  /**
   * Calculates the recommended reasonable provision (S.26).
   * Used to suggest settlement amounts before court battles.
   */
  estimateReasonableProvision(
    dependencyRatio: number,
    netEstateValue: number,
    dependantAge: number,
  ): Promise<number>;
}
