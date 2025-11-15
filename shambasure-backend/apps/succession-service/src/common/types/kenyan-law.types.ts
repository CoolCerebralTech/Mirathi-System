/**
 * Kenyan Law – Strongly Typed Definitions
 * Covers: Law of Succession Act, Marriage Act, Probate Rules, Court Process.
 */

/* -------------------------------------------------------------------------- */
/*                        LAW OF SUCCESSION ACT SECTIONS                      */
/* -------------------------------------------------------------------------- */

export type LawSection =
  | '3' // Definitions: child, spouse, dependant
  | '5' // Testamentary freedom & capacity
  | '7' // Capacity to make a will
  | '8' // Sound mind
  | '9' // Special provisions for privileged wills
  | '11' // Will formalities
  | '12' // Witness competency
  | '14' // Alterations & interlineations
  | '16' // Revocation of will
  | '26' // Provision for dependants
  | '27' // Power of court to make orders for dependants
  | '29' // Definition of dependants
  | '35' // Intestate: spouse + children
  | '36' // Intestate: spouse & no children
  | '37' // Power of spouse to dispose of property
  | '38' // Intestate: children only
  | '39' // Intestate: relatives only
  | '40' // Intestate: polygamous households
  | '51' // Application for grant
  | '55' // Restrictions on distribution before confirmation
  | '66' // Order of priority for grants
  | '71' // Confirmation of grant
  | '79' // Executor powers vesting
  | '82' // Powers of personal representatives
  | '83' // Duties of personal representatives
  | '81'; // Executor removal

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

export type DependantType =
  | 'SPOUSE'
  | 'CHILD'
  | 'ADOPTED_CHILD'
  | 'STEPCHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'OTHER_DEPENDANT';

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

export type ExecutorStatus =
  | 'NOMINATED'
  | 'APPOINTED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REMOVED'
  | 'DECLINED'
  | 'COMPLETED';

export type ExecutorDutyType =
  | 'LOCATE_WILL'
  | 'NOTIFY_HEIRS'
  | 'INVENTORY_ASSETS'
  | 'MANAGE_ASSETS'
  | 'PAY_DEBTS'
  | 'FILE_TAXES'
  | 'DISTRIBUTE_ASSETS'
  | 'FILE_ACCOUNTS'
  | 'CLOSE_ESTATE';

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
  | 'REVOCATION_ISSUE';

export type DisputeStatus =
  | 'FILED'
  | 'UNDER_REVIEW'
  | 'MEDIATION'
  | 'COURT_HEARING'
  | 'SETTLEMENT'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'APPEALED';

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

export type HearingType = 'MENTION' | 'DIRECTIONS' | 'HEARING' | 'RULING' | 'JUDGMENT';

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

export type KenyanCounty =
  | 'BARINGO'
  | 'BOMET'
  | 'BUNGOMA'
  | 'BUSIA'
  | 'ELGEYO_MARAKWET'
  | 'EMBU'
  | 'GARISSA'
  | 'HOMA_BAY'
  | 'ISIOLO'
  | 'KAJIADO'
  | 'KAKAMEGA'
  | 'KERICHO'
  | 'KIAMBU'
  | 'KILIFI'
  | 'KIRINYAGA'
  | 'KISII'
  | 'KISUMU'
  | 'KITUI'
  | 'KWALE'
  | 'LAIKIPIA'
  | 'LAMU'
  | 'MACHAKOS'
  | 'MAKUENI'
  | 'MANDERA'
  | 'MARSABIT'
  | 'MERU'
  | 'MIGORI'
  | 'MOMBASA'
  | 'MURANGA'
  | 'NAIROBI'
  | 'NAKURU'
  | 'NANDI'
  | 'NAROK'
  | 'NYAMIRA'
  | 'NYANDARUA'
  | 'NYERI'
  | 'SAMBURU'
  | 'SIAYA'
  | 'TAITA_TAVETA'
  | 'TANA_RIVER'
  | 'THARAKA_NITHI'
  | 'TRANS_NZOIA'
  | 'TURKANA'
  | 'UASIN_GISHU'
  | 'VIHIGA'
  | 'WAJIR'
  | 'WEST_POKOT';

export type KenyanIDType =
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'ALIEN_ID'
  | 'BIRTH_CERTIFICATE'
  | 'MILITARY_ID';

/* -------------------------------------------------------------------------- */
/*                               TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

export const isLawSection = (section: string): section is LawSection => {
  const valid: LawSection[] = [
    '3',
    '5',
    '7',
    '8',
    '9',
    '11',
    '14',
    '16',
    '26',
    '27',
    '29',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '51',
    '55',
    '66',
    '71',
    '79',
    '82',
    '83',
    '81',
  ];
  return valid.includes(section as LawSection);
};

export const isKenyanCounty = (county: string): county is KenyanCounty => {
  return (
    [
      'BARINGO',
      'BOMET',
      'BUNGOMA',
      'BUSIA',
      'ELGEYO_MARAKWET',
      'EMBU',
      'GARISSA',
      'HOMA_BAY',
      'ISIOLO',
      'KAJIADO',
      'KAKAMEGA',
      'KERICHO',
      'KIAMBU',
      'KILIFI',
      'KIRINYAGA',
      'KISII',
      'KISUMU',
      'KITUI',
      'KWALE',
      'LAIKIPIA',
      'LAMU',
      'MACHAKOS',
      'MAKUENI',
      'MANDERA',
      'MARSABIT',
      'MERU',
      'MIGORI',
      'MOMBASA',
      'MURANGA',
      'NAIROBI',
      'NAKURU',
      'NANDI',
      'NAROK',
      'NYAMIRA',
      'NYANDARUA',
      'NYERI',
      'SAMBURU',
      'SIAYA',
      'TAITA_TAVETA',
      'TANA_RIVER',
      'THARAKA_NITHI',
      'TRANS_NZOIA',
      'TURKANA',
      'UASIN_GISHU',
      'VIHIGA',
      'WAJIR',
      'WEST_POKOT',
    ] as KenyanCounty[]
  ).includes(county.toUpperCase() as KenyanCounty);
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
