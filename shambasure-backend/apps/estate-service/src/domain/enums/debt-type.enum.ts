// src/estate-service/src/domain/entities/enums/debt-type.enum.ts

/**
 * Debt Type Enum
 *
 * Legal Context:
 * - Different debt types have different priority under S.45
 * - Secured debts require asset liquidation
 * - Funeral expenses have highest priority
 */
export enum DebtType {
  // Funeral & Death Expenses (S.45(a))
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES', // Burial, coffin, transport
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE', // Death certificate costs
  OBITUARY = 'OBITUARY', // Newspaper notices

  // Testamentary Expenses (S.45(a))
  PROBATE_FEES = 'PROBATE_FEES', // Court filing fees
  LEGAL_FEES = 'LEGAL_FEES', // Lawyer fees for succession
  EXECUTOR_FEES = 'EXECUTOR_FEES', // Executor remuneration

  // Secured Debts (S.45(b))
  MORTGAGE = 'MORTGAGE', // Property mortgage
  CAR_LOAN = 'CAR_LOAN', // Vehicle loan (secured)
  LOGBOOK_LOAN = 'LOGBOOK_LOAN', // Logbook loan

  // Taxes & Rates (S.45(c))
  INCOME_TAX = 'INCOME_TAX', // Outstanding income tax
  PROPERTY_RATES = 'PROPERTY_RATES', // County government rates
  LAND_RATES = 'LAND_RATES', // Land rates arrears
  VAT = 'VAT', // Value Added Tax

  // Wages & Salaries (S.45(c))
  EMPLOYEE_WAGES = 'EMPLOYEE_WAGES', // Unpaid employee wages
  PENSION_CONTRIBUTIONS = 'PENSION_CONTRIBUTIONS', // Unpaid pension

  // Unsecured Debts (S.45(d))
  PERSONAL_LOAN = 'PERSONAL_LOAN', // Unsecured personal loan
  CREDIT_CARD = 'CREDIT_CARD', // Credit card debt
  UTILITY_BILLS = 'UTILITY_BILLS', // Electricity, water, internet
  MEDICAL_BILLS = 'MEDICAL_BILLS', // Hospital/medical expenses
  SCHOOL_FEES = 'SCHOOL_FEES', // Unpaid school fees

  // Business Debts
  BUSINESS_LOAN = 'BUSINESS_LOAN', // Business financing
  SUPPLIER_DEBT = 'SUPPLIER_DEBT', // Unpaid supplier invoices
  RENT_ARREARS = 'RENT_ARREARS', // Unpaid rent

  // Other
  FAMILY_LOAN = 'FAMILY_LOAN', // Loan from family member
  FRIEND_LOAN = 'FRIEND_LOAN', // Loan from friend
  OTHER = 'OTHER', // Other unspecified debt
}

/**
 * Debt Type Helper Methods
 */
export class DebtTypeHelper {
  /**
   * Get S.45 tier for debt type
   */
  static getTier(debtType: DebtType): string {
    const tierMap: Record<DebtType, string> = {
      // S.45(a) - Funeral & Testamentary
      [DebtType.FUNERAL_EXPENSES]: 'FUNERAL_EXPENSES',
      [DebtType.DEATH_CERTIFICATE]: 'FUNERAL_EXPENSES',
      [DebtType.OBITUARY]: 'FUNERAL_EXPENSES',
      [DebtType.PROBATE_FEES]: 'TESTAMENTARY_EXPENSES',
      [DebtType.LEGAL_FEES]: 'TESTAMENTARY_EXPENSES',
      [DebtType.EXECUTOR_FEES]: 'TESTAMENTARY_EXPENSES',

      // S.45(b) - Secured
      [DebtType.MORTGAGE]: 'SECURED_DEBTS',
      [DebtType.CAR_LOAN]: 'SECURED_DEBTS',
      [DebtType.LOGBOOK_LOAN]: 'SECURED_DEBTS',

      // S.45(c) - Taxes, Rates, Wages
      [DebtType.INCOME_TAX]: 'TAXES_RATES_WAGES',
      [DebtType.PROPERTY_RATES]: 'TAXES_RATES_WAGES',
      [DebtType.LAND_RATES]: 'TAXES_RATES_WAGES',
      [DebtType.VAT]: 'TAXES_RATES_WAGES',
      [DebtType.EMPLOYEE_WAGES]: 'TAXES_RATES_WAGES',
      [DebtType.PENSION_CONTRIBUTIONS]: 'TAXES_RATES_WAGES',

      // S.45(d) - Unsecured
      [DebtType.PERSONAL_LOAN]: 'UNSECURED_GENERAL',
      [DebtType.CREDIT_CARD]: 'UNSECURED_GENERAL',
      [DebtType.UTILITY_BILLS]: 'UNSECURED_GENERAL',
      [DebtType.MEDICAL_BILLS]: 'UNSECURED_GENERAL',
      [DebtType.SCHOOL_FEES]: 'UNSECURED_GENERAL',
      [DebtType.BUSINESS_LOAN]: 'UNSECURED_GENERAL',
      [DebtType.SUPPLIER_DEBT]: 'UNSECURED_GENERAL',
      [DebtType.RENT_ARREARS]: 'UNSECURED_GENERAL',
      [DebtType.FAMILY_LOAN]: 'UNSECURED_GENERAL',
      [DebtType.FRIEND_LOAN]: 'UNSECURED_GENERAL',
      [DebtType.OTHER]: 'UNSECURED_GENERAL',
    };

    return tierMap[debtType] || 'UNSECURED_GENERAL';
  }

  /**
   * Check if debt type is secured
   */
  static isSecured(debtType: DebtType): boolean {
    const securedTypes = [DebtType.MORTGAGE, DebtType.CAR_LOAN, DebtType.LOGBOOK_LOAN];
    return securedTypes.includes(debtType);
  }

  /**
   * Check if debt type is funeral expense
   */
  static isFuneralExpense(debtType: DebtType): boolean {
    const funeralTypes = [DebtType.FUNERAL_EXPENSES, DebtType.DEATH_CERTIFICATE, DebtType.OBITUARY];
    return funeralTypes.includes(debtType);
  }

  /**
   * Check if debt type is testamentary expense
   */
  static isTestamentaryExpense(debtType: DebtType): boolean {
    const testamentaryTypes = [DebtType.PROBATE_FEES, DebtType.LEGAL_FEES, DebtType.EXECUTOR_FEES];
    return testamentaryTypes.includes(debtType);
  }

  /**
   * Check if debt type is tax-related
   */
  static isTaxDebt(debtType: DebtType): boolean {
    const taxTypes = [
      DebtType.INCOME_TAX,
      DebtType.PROPERTY_RATES,
      DebtType.LAND_RATES,
      DebtType.VAT,
    ];
    return taxTypes.includes(debtType);
  }

  /**
   * Get typical interest rate for debt type (annual percentage)
   */
  static getTypicalInterestRate(debtType: DebtType): number {
    const rates: Record<DebtType, number> = {
      [DebtType.MORTGAGE]: 0.12, // 12% typical mortgage
      [DebtType.CAR_LOAN]: 0.15, // 15% vehicle loan
      [DebtType.LOGBOOK_LOAN]: 0.2, // 20% logbook loan
      [DebtType.PERSONAL_LOAN]: 0.18, // 18% personal loan
      [DebtType.CREDIT_CARD]: 0.24, // 24% credit card
      [DebtType.BUSINESS_LOAN]: 0.14, // 14% business loan
      // Other types typically have no or minimal interest
    };

    return rates[debtType] || 0;
  }

  /**
   * Get limitation period for debt type (years)
   * Under Limitation Act Cap 22
   */
  static getLimitationPeriod(debtType: DebtType): number {
    // Secured debts: 12 years, Unsecured: 6 years
    if (DebtTypeHelper.isSecured(debtType)) {
      return 12;
    }
    return 6;
  }

  /**
   * Get debt type description
   */
  static getDescription(debtType: DebtType): string {
    const descriptions: Record<DebtType, string> = {
      [DebtType.FUNERAL_EXPENSES]: 'Funeral and burial expenses',
      [DebtType.DEATH_CERTIFICATE]: 'Death certificate issuance costs',
      [DebtType.OBITUARY]: 'Newspaper obituary notices',
      [DebtType.PROBATE_FEES]: 'Court fees for probate application',
      [DebtType.LEGAL_FEES]: 'Legal fees for succession process',
      [DebtType.EXECUTOR_FEES]: 'Executor remuneration and expenses',
      [DebtType.MORTGAGE]: 'Property mortgage loan',
      [DebtType.CAR_LOAN]: 'Vehicle purchase loan',
      [DebtType.LOGBOOK_LOAN]: 'Logbook loan secured by vehicle',
      [DebtType.INCOME_TAX]: 'Outstanding income tax',
      [DebtType.PROPERTY_RATES]: 'County property rates',
      [DebtType.LAND_RATES]: 'Land rates arrears',
      [DebtType.VAT]: 'Value Added Tax arrears',
      [DebtType.EMPLOYEE_WAGES]: 'Unpaid employee wages',
      [DebtType.PENSION_CONTRIBUTIONS]: 'Unpaid pension contributions',
      [DebtType.PERSONAL_LOAN]: 'Unsecured personal loan',
      [DebtType.CREDIT_CARD]: 'Credit card debt',
      [DebtType.UTILITY_BILLS]: 'Electricity, water, internet bills',
      [DebtType.MEDICAL_BILLS]: 'Hospital and medical expenses',
      [DebtType.SCHOOL_FEES]: 'Unpaid school fees',
      [DebtType.BUSINESS_LOAN]: 'Business financing loan',
      [DebtType.SUPPLIER_DEBT]: 'Unpaid supplier invoices',
      [DebtType.RENT_ARREARS]: 'Unpaid rent',
      [DebtType.FAMILY_LOAN]: 'Loan from family member',
      [DebtType.FRIEND_LOAN]: 'Loan from friend',
      [DebtType.OTHER]: 'Other unspecified debt',
    };
    return descriptions[debtType] || 'Unknown debt type';
  }
}
