/**
 * Kenyan Law – Strongly Typed Definitions
 * Covers: Law of Succession Act, Marriage Act, Probate Rules, Court Process.
 */
import { LAW_OF_SUCCESSION_SECTIONS } from '../constants/kenyan-law.constants';
import { RELATIONSHIP_TYPES } from '../constants/relationship-types.constants';
import { KENYAN_COUNTIES_LIST } from '../constants/kenyan-law.constants';
/* -------------------------------------------------------------------------- */
/*                        LAW OF SUCCESSION ACT SECTIONS                      */
/* -------------------------------------------------------------------------- */

export type LawSection =
  (typeof LAW_OF_SUCCESSION_SECTIONS)[keyof typeof LAW_OF_SUCCESSION_SECTIONS];
/* -------------------------------------------------------------------------- */
/*                               WILL FORMALITIES                              */
/* -------------------------------------------------------------------------- */

export type WillFormalityType =
  | 'WRITING_REQUIREMENT'
  | 'TESTATOR_SIGNATURE'
  | 'WITNESS_ATTESTATION'
  | 'WITNESS_PRESENCE'
  | 'DATING_REQUIREMENT'
  | 'HANDWRITING_RULE'
  | 'NO_INTERESTED_WITNESS';

/* -------------------------------------------------------------------------- */
/*                          TESTATOR CAPACITY REQUIREMENTS                     */
/* -------------------------------------------------------------------------- */

export type TestatorCapacityType =
  | 'AGE_REQUIREMENT'
  | 'SOUND_MIND'
  | 'UNDERSTANDING'
  | 'FREE_WILL'
  | 'NO_UNDUE_INFLUENCE'
  | 'NO_COERCION';

/* -------------------------------------------------------------------------- */
/*                       INTESTATE DISTRIBUTION SCENARIOS                      */
/* -------------------------------------------------------------------------- */

export type IntestateScenarioType =
  | 'ONE_SPOUSE_WITH_CHILDREN'
  | 'MULTIPLE_SPOUSES_WITH_CHILDREN'
  | 'SPOUSE_ONLY'
  | 'CHILDREN_ONLY'
  | 'RELATIVES_ONLY'
  | 'NO_SURVIVORS';

/* -------------------------------------------------------------------------- */
/*                              SUCCESSION SHARES                              */
/* -------------------------------------------------------------------------- */

export type ShareType =
  | 'PERSONAL_EFFECTS'
  | 'LIFE_INTEREST'
  | 'ABSOLUTE_INTEREST'
  | 'RESIDUARY_INTEREST'
  | 'SPECIFIC_GIFT'
  | 'CONDITIONAL_INTEREST'
  | 'CONTINGENT_INTEREST';

/* -------------------------------------------------------------------------- */
/*                                 DEPENDANTS                                  */
/* -------------------------------------------------------------------------- */

export type DependantType = keyof typeof RELATIONSHIP_TYPES;
/* -------------------------------------------------------------------------- */
/*                                  PROBATE                                    */
/* -------------------------------------------------------------------------- */

export type ProbateCaseType = 'TESTATE' | 'INTESTATE' | 'MIXED';

export type GrantType =
  | 'PROBATE'
  | 'LETTERS_OF_ADMINISTRATION'
  | 'LETTERS_OF_ADMINISTRATION_WITH_WILL'
  | 'LIMITED_GRANT'
  | 'SPECIAL_GRANT';

/* -------------------------------------------------------------------------- */
/*                                COURT TYPES                                  */
/* -------------------------------------------------------------------------- */

export type CourtJurisdiction =
  | 'HIGH_COURT'
  | 'MAGISTRATE_COURT'
  | 'KADHIS_COURT'
  | 'ENVIRONMENT_LAND_COURT';

export type ProbateStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'HEARING_SCHEDULED'
  | 'GRANT_ISSUED'
  | 'OBJECTION_FILED'
  | 'APPEALED'
  | 'CLOSED';

/* -------------------------------------------------------------------------- */
/*                        EXECUTOR / ADMINISTRATOR TYPES                       */
/* -------------------------------------------------------------------------- */

export type ExecutorDutyType =
  | 'FILE_INVENTORY'
  | 'PAY_DEBTS'
  | 'DISTRIBUTE_ASSETS'
  | 'FILE_ACCOUNTS'
  | 'OBTAIN_GRANT'
  | 'MANAGE_PROPERTY';

export type CompensationType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'HOURLY_RATE' | 'COURT_DETERMINED';

/* -------------------------------------------------------------------------- */
/*                              DISPUTE HANDLING                               */
/* -------------------------------------------------------------------------- */

export type DisputeGrounds =
  | 'UNDUE_INFLUENCE'
  | 'LACK_CAPACITY'
  | 'FRAUD'
  | 'FORGERY'
  | 'IMPROPER_EXECUTION'
  | 'OMITTED_HEIR'
  | 'AMBIGUOUS_TERMS'
  | 'CONTRADICTORY_CLAUSES'
  | 'REVOCATION_ISSUE'
  | 'CONCEALMENT_OF_FACT'
  | 'FALSE_STATEMENT'
  | 'DEFECTIVE_PROCESS'
  | 'PROCEDURAL_IRREGULARITY'
  | 'INADEQUATE_PROVISION'
  | 'DEPENDANT_MAINTENANCE'
  | 'ASSET_VALUATION'
  | 'EXECUTOR_MISCONDUCT'
  | 'OTHER';

export type ResolutionMethod =
  | 'MEDIATION'
  | 'ARBITRATION'
  | 'COURT_JUDGMENT'
  | 'SETTLEMENT_AGREEMENT'
  | 'WITHDRAWN';

/* -------------------------------------------------------------------------- */
/*                               MARRIAGE TYPES                                */
/* -------------------------------------------------------------------------- */

export type MarriageType = 'CIVIL' | 'CHRISTIAN' | 'CUSTOMARY' | 'HINDU' | 'ISLAMIC';

export type CustomaryMarriageStatus =
  | 'INITIATED'
  | 'BRIDE_PRICE_PAID'
  | 'CEREMONY_COMPLETE'
  | 'REGISTERED'
  | 'RECOGNIZED';

export type PolygamousStatus = 'MONOGAMOUS' | 'POLYGAMOUS' | 'BIGAMOUS'; // Illegal but important for disputes

/* -------------------------------------------------------------------------- */
/*                           COURT & LEGAL PROCEDURE                           */
/* -------------------------------------------------------------------------- */

export type HearingType =
  | 'MENTION' // Brief appearance to confirm filing
  | 'DIRECTIONS' // Case management and scheduling
  | 'CONFIRMATION_OF_GRANT' // Confirm grant of probate/letters
  | 'PROOF_OF_WILL' // Prove validity of will
  | 'OBJECTION_HEARING' // Hear objections to grant
  | 'DISTRIBUTION_CONFIRMATION' // Confirm distribution schedule
  | 'EXECUTOR_ACCOUNTING' // Review executor's accounts
  | 'DEPENDANTS_PROVISION' // Section 26 application
  | 'REVOCATION_APPLICATION' // Application to revoke grant
  | 'CAVEAT_HEARING' // Hearing on caveat proceedings
  | 'MEDIATION_REFERRAL' // Refer to mediation
  | 'FINAL_SETTLEMENT'; // Final estate settlement

export interface HearingOutcome {
  orders: string[];
  rulings: string[];
  nextSteps: string[];
  complianceDeadline?: Date;
}
export type LegalDocumentType =
  | 'AFFIDAVIT'
  | 'SUMMONS'
  | 'PETITION'
  | 'AFFIRMATION'
  | 'COUNTER_AFFIDAVIT'
  | 'SUPPORTING_AFFIDAVIT';

export type FeeType =
  | 'FILING_FEE'
  | 'AD_VALOREM_FEE'
  | 'PROCESS_SERVER_FEE'
  | 'COMMISSIONER_FEE'
  | 'MISCELLANEOUS_FEE';

/* -------------------------------------------------------------------------- */
/*                     COMPLIANCE & LEGAL RISK CLASSIFICATIONS                 */
/* -------------------------------------------------------------------------- */

export type ComplianceLevel =
  | 'FULLY_COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'NON_COMPLIANT'
  | 'NOT_APPLICABLE';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO' | 'SUGGESTION';

export type LegalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/* -------------------------------------------------------------------------- */
/*                           KENYAN SPECIFIC UTILITY TYPES                     */
/* -------------------------------------------------------------------------- */

export type KenyanCurrency = 'KES';

export type KenyanCounty = (typeof KENYAN_COUNTIES_LIST)[number];

export type KenyanIDType =
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'ALIEN_ID'
  | 'BIRTH_CERTIFICATE'
  | 'MILITARY_ID';

/* -------------------------------------------------------------------------- */
/*                               TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

const LAW_SECTIONS_ARRAY = Object.values(LAW_OF_SUCCESSION_SECTIONS);
export const isLawSection = (section: string): section is LawSection => {
  return LAW_SECTIONS_ARRAY.includes(section as LawSection);
};

export const isKenyanCounty = (county: string): county is KenyanCounty => {
  // The `as readonly string[]` is a trick to help TypeScript's type inference
  return (KENYAN_COUNTIES_LIST as readonly string[]).includes(county.toUpperCase());
};

export const isValidGrantType = (grantType: string): grantType is GrantType => {
  return (
    [
      'PROBATE',
      'LETTERS_OF_ADMINISTRATION',
      'LETTERS_OF_ADMINISTRATION_WITH_WILL',
      'LIMITED_GRANT',
      'SPECIAL_GRANT',
    ] as GrantType[]
  ).includes(grantType as GrantType);
};
