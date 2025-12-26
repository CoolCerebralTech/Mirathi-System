// src/estate-service/src/domain/enums/evidence-type.enum.ts

/**
 * Evidence Type Enum
 *
 * Categories of evidence accepted for dependant claims.
 */
export enum EvidenceType {
  // Identity & Relationship
  MARRIAGE_CERTIFICATE = 'MARRIAGE_CERTIFICATE',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',

  // Legal Documents
  COURT_ORDER = 'COURT_ORDER',
  AFFIDAVIT = 'AFFIDAVIT',
  DIVORCE_DECREE = 'DIVORCE_DECREE',
  ADOPTION_CERTIFICATE = 'ADOPTION_CERTIFICATE',
  DNA_TEST_RESULT = 'DNA_TEST_RESULT',

  // Financial Dependence
  BANK_STATEMENTS = 'BANK_STATEMENTS',
  PAYSLIPS = 'PAYSLIPS',
  MONEY_TRANSFER_RECEIPTS = 'MONEY_TRANSFER_RECEIPTS',
  SCHOOL_FEE_RECEIPTS = 'SCHOOL_FEE_RECEIPTS',
  MEDICAL_BILLS = 'MEDICAL_BILLS',

  // Medical Evidence
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  DISABILITY_CERTIFICATE = 'DISABILITY_CERTIFICATE',
  DOCTORS_AFFIDAVIT = 'DOCTORS_AFFIDAVIT',

  // Other
  PHOTOGRAPHS = 'PHOTOGRAPHS',
  LETTERS_CORRESPONDENCE = 'LETTERS_CORRESPONDENCE',
  WITNESS_STATEMENT = 'WITNESS_STATEMENT',
  OTHER = 'OTHER',
}

/**
 * Evidence Type Helper Methods
 */
export class EvidenceTypeHelper {
  /**
   * Get base credibility score for evidence type
   */
  static getBaseCredibilityScore(type: EvidenceType): number {
    const scores: Record<EvidenceType, number> = {
      // Official documents (high credibility)
      [EvidenceType.MARRIAGE_CERTIFICATE]: 90,
      [EvidenceType.BIRTH_CERTIFICATE]: 95,
      [EvidenceType.DEATH_CERTIFICATE]: 95,
      [EvidenceType.NATIONAL_ID]: 85,
      [EvidenceType.PASSPORT]: 85,

      // Legal documents
      [EvidenceType.COURT_ORDER]: 100,
      [EvidenceType.AFFIDAVIT]: 70,
      [EvidenceType.DIVORCE_DECREE]: 90,
      [EvidenceType.ADOPTION_CERTIFICATE]: 95,
      [EvidenceType.DNA_TEST_RESULT]: 99,

      // Financial documents
      [EvidenceType.BANK_STATEMENTS]: 80,
      [EvidenceType.PAYSLIPS]: 75,
      [EvidenceType.MONEY_TRANSFER_RECEIPTS]: 65,
      [EvidenceType.SCHOOL_FEE_RECEIPTS]: 70,
      [EvidenceType.MEDICAL_BILLS]: 70,

      // Medical evidence
      [EvidenceType.MEDICAL_REPORT]: 85,
      [EvidenceType.DISABILITY_CERTIFICATE]: 90,
      [EvidenceType.DOCTORS_AFFIDAVIT]: 75,

      // Other evidence
      [EvidenceType.PHOTOGRAPHS]: 40,
      [EvidenceType.LETTERS_CORRESPONDENCE]: 30,
      [EvidenceType.WITNESS_STATEMENT]: 50,
      [EvidenceType.OTHER]: 20,
    };

    return scores[type] || 50;
  }

  /**
   * Check if evidence type is official document
   */
  static isOfficialDocument(type: EvidenceType): boolean {
    const officialTypes = [
      EvidenceType.MARRIAGE_CERTIFICATE,
      EvidenceType.BIRTH_CERTIFICATE,
      EvidenceType.DEATH_CERTIFICATE,
      EvidenceType.NATIONAL_ID,
      EvidenceType.PASSPORT,
      EvidenceType.COURT_ORDER,
      EvidenceType.ADOPTION_CERTIFICATE,
    ];

    return officialTypes.includes(type);
  }

  /**
   * Check if evidence type proves relationship
   */
  static provesRelationship(type: EvidenceType): boolean {
    const relationshipTypes = [
      EvidenceType.MARRIAGE_CERTIFICATE,
      EvidenceType.BIRTH_CERTIFICATE,
      EvidenceType.ADOPTION_CERTIFICATE,
      EvidenceType.DNA_TEST_RESULT,
      EvidenceType.DIVORCE_DECREE,
    ];

    return relationshipTypes.includes(type);
  }

  /**
   * Check if evidence type proves financial dependence
   */
  static provesFinancialDependence(type: EvidenceType): boolean {
    const financialTypes = [
      EvidenceType.BANK_STATEMENTS,
      EvidenceType.PAYSLIPS,
      EvidenceType.MONEY_TRANSFER_RECEIPTS,
      EvidenceType.SCHOOL_FEE_RECEIPTS,
      EvidenceType.MEDICAL_BILLS,
    ];

    return financialTypes.includes(type);
  }

  /**
   * Get typical expiry date for evidence type
   */
  static getExpiryDate(type: EvidenceType): Date | undefined {
    const now = new Date();

    switch (type) {
      case EvidenceType.MEDICAL_REPORT:
        // Medical reports valid for 6 months
        return new Date(now.setMonth(now.getMonth() + 6));

      case EvidenceType.AFFIDAVIT:
      case EvidenceType.DOCTORS_AFFIDAVIT:
        // Affidavits valid for 1 year
        return new Date(now.setFullYear(now.getFullYear() + 1));

      case EvidenceType.PHOTOGRAPHS:
      case EvidenceType.LETTERS_CORRESPONDENCE:
        // Informal evidence valid for 2 years
        return new Date(now.setFullYear(now.getFullYear() + 2));

      default:
        // Most official documents don't expire
        return undefined;
    }
  }

  /**
   * Get required evidence types for relationship type
   */
  static getRequiredEvidenceForRelationship(relationship: string): EvidenceType[] {
    switch (relationship) {
      case 'SPOUSE':
        return [EvidenceType.MARRIAGE_CERTIFICATE, EvidenceType.NATIONAL_ID];

      case 'CHILD':
        return [EvidenceType.BIRTH_CERTIFICATE, EvidenceType.NATIONAL_ID];

      case 'ADOPTED_CHILD':
        return [EvidenceType.ADOPTION_CERTIFICATE, EvidenceType.BIRTH_CERTIFICATE];

      case 'PARENT':
        return [
          EvidenceType.BIRTH_CERTIFICATE, // Child's birth certificate
          EvidenceType.NATIONAL_ID,
        ];

      default:
        return [EvidenceType.AFFIDAVIT, EvidenceType.BANK_STATEMENTS];
    }
  }

  /**
   * Get human-readable description
   */
  static getDescription(type: EvidenceType): string {
    const descriptions: Record<EvidenceType, string> = {
      [EvidenceType.MARRIAGE_CERTIFICATE]: 'Official marriage certificate',
      [EvidenceType.BIRTH_CERTIFICATE]: 'Official birth certificate',
      [EvidenceType.DEATH_CERTIFICATE]: 'Death certificate of deceased',
      [EvidenceType.NATIONAL_ID]: 'National ID card',
      [EvidenceType.PASSPORT]: 'Passport',
      [EvidenceType.COURT_ORDER]: 'Court order or judgment',
      [EvidenceType.AFFIDAVIT]: 'Sworn affidavit',
      [EvidenceType.DIVORCE_DECREE]: 'Divorce decree',
      [EvidenceType.ADOPTION_CERTIFICATE]: 'Adoption certificate',
      [EvidenceType.DNA_TEST_RESULT]: 'DNA test results',
      [EvidenceType.BANK_STATEMENTS]: 'Bank statements showing financial support',
      [EvidenceType.PAYSLIPS]: 'Payslips of deceased showing dependant',
      [EvidenceType.MONEY_TRANSFER_RECEIPTS]: 'Money transfer receipts',
      [EvidenceType.SCHOOL_FEE_RECEIPTS]: 'School fee payment receipts',
      [EvidenceType.MEDICAL_BILLS]: 'Medical bills paid by deceased',
      [EvidenceType.MEDICAL_REPORT]: 'Medical report on dependant',
      [EvidenceType.DISABILITY_CERTIFICATE]: 'Disability certificate',
      [EvidenceType.DOCTORS_AFFIDAVIT]: "Doctor's sworn affidavit",
      [EvidenceType.PHOTOGRAPHS]: 'Family photographs',
      [EvidenceType.LETTERS_CORRESPONDENCE]: 'Letters and correspondence',
      [EvidenceType.WITNESS_STATEMENT]: 'Witness statement',
      [EvidenceType.OTHER]: 'Other supporting documents',
    };

    return descriptions[type] || 'Supporting document';
  }

  /**
   * Get all valid evidence types
   */
  static getAllTypes(): EvidenceType[] {
    return Object.values(EvidenceType);
  }

  /**
   * Validate if a string is a valid EvidenceType
   */
  static isValid(type: string): type is EvidenceType {
    return Object.values(EvidenceType).includes(type as EvidenceType);
  }
}
