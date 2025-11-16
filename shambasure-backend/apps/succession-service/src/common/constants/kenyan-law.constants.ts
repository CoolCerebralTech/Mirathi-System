/**
 * Comprehensive Kenyan Legal Constants:
 * - Succession Act (Cap. 160)
 * - Marriage Act (2014)
 * - Probate & Administration Rules
 * - Court Jurisdiction
 * - Asset Classification
 * - Legal Timeframes
 *
 * All optimized for system integration and rule engines.
 */

// ------------------------------------------------------------
// 1. LAW OF SUCCESSION ACT: KEY SECTIONS
// ------------------------------------------------------------
export const LAW_OF_SUCCESSION_SECTIONS = {
  // Part II – Wills
  TESTATOR_CAPACITY: '7',
  WILL_FORMALITIES: '11',
  PRIVILEGED_WILLS: '13',
  WILL_REVOCATION: '16',
  DEPENDANTS_RELIEF: '26',

  // Part III – Dependants
  DEPENDANTS_DEFINITION: '29',
  COURT_POWERS_DEPENDANTS: '27',
  REVISION_OF_PROVISION: '28',

  // Part V – Intestate Succession
  INTESTATE_ONE_SPOUSE_CHILDREN: '35',
  INTESTATE_SPOUSE_CHILDREN_POLYGAMY: '40',
  INTESTATE_SPOUSE_ONLY: '36',
  INTESTATE_RELATIVES_ONLY: '39',
  ORDER_OF_SUCCESSION: '39',
  TRUSTS_FOR_MINORS: '41',
  GIFTS_IN_ADVANCEMENT: '42',

  // Part VI – Grants
  GRANT_OF_PROBATE: '51',
  LETTERS_OF_ADMINISTRATION: '53',
  RESTRICTIONS_ON_GRANT: '55',
  PERSONS_ENTITLED_TO_GRANT: '66',
  REVOCATION_OF_GRANTS: '76',

  // Part VII – Executors & Administrators
  EXECUTOR_POWERS: '79',
  EXECUTOR_DUTIES: '83',
  EXECUTOR_REMOVAL: '81',

  // Part VIII – Miscellaneous
  SURVIVORSHIP_RULE: '46', // simultaneous death
} as const;

// ------------------------------------------------------------
// 2. GENERAL LEGAL REQUIREMENTS & THRESHOLDS
// ------------------------------------------------------------
export const KENYAN_LEGAL_REQUIREMENTS = {
  MINIMUM_TESTATOR_AGE: 18,
  MINIMUM_WITNESSES: 2,
  MAXIMUM_WITNESSES: 5,

  OBJECTION_PERIOD_DAYS: 30,
  WILL_STORAGE_DURATION_YEARS: 25,

  FUNERAL_EXPENSE_REASONABLE_CAP: 500000,

  EXECUTOR_REQUIREMENTS: {
    MINIMUM_AGE: 18,
    MAX_EXECUTORS: 4,
    FEE_PERCENTAGE: {
      MIN: 0.01,
      MAX: 0.05,
      DEFAULT: 0.03,
    },
  },

  COURT_JURISDICTION: {
    // Note: Pecuniary jurisdiction is subject to change by the Chief Justice.
    MAGISTRATE_LIMIT: 5000000, // 5M
    HIGH_COURT_MINIMUM: 5000001, // Anything above magistrate cap
  },
} as const;

// ------------------------------------------------------------
// 3. FAMILY LAW (Marriage Act 2014 + Customary + Islamic)
// ------------------------------------------------------------
export const KENYAN_FAMILY_LAW = {
  MARRIAGE_TYPES: [
    'CIVIL_MARRIAGE',
    'CUSTOMARY_MARRIAGE',
    'CHRISTIAN_MARRIAGE',
    'ISLAMIC_MARRIAGE',
    'HINDU_MARRIAGE',
  ] as const,

  CUSTOMARY_MARRIAGE: {
    MINIMUM_AGE: 18,
    CONSENT_REQUIRED: true,
    BRIDE_PRICE_OPTIONAL: true,
    REGISTRATION_DEADLINE_DAYS: 90,
  },

  ISLAMIC_MARRIAGE: {
    POLYGAMY_ALLOWED: true,
    MAX_SPOUSES: 4,
    WIFE_CONSENT_REQUIRED: false,
  },

  CIVIL_MARRIAGE: {
    POLYGAMY_ALLOWED: false,
    MONOGAMOUS_BY_LAW: true,
  },

  GENERAL_RULES: {
    EQUAL_TREATMENT_OF_CHILDREN: true, // Adopted, illegitimate, customary
    PROOF_OF_MARRIAGE_REQUIRED: true, // Certificates, affidavits, witnesses
    COHABITATION_RECOGNIZED_AS_MARRIAGE: true, // after strong case law trend
  },
  POLYGAMOUS_MARRIAGE_TYPES: ['CUSTOMARY_MARRIAGE', 'ISLAMIC_MARRIAGE'],
} as const;

// ------------------------------------------------------------
// 4. ASSET CLASSIFICATION (Highly Expanded)
// ------------------------------------------------------------
export const KENYAN_ASSET_CLASSIFICATION = {
  IMMOVABLE_PROPERTY: [
    'LAND_PARCEL',
    'RESIDENTIAL_HOUSE',
    'COMMERCIAL_BUILDING',
    'AGRICULTURAL_LAND',
    'LEASEHOLD_INTEREST',
    'APARTMENT_UNIT',
  ],

  MOVABLE_PROPERTY: [
    'VEHICLE',
    'MOTORCYCLE',
    'LIVESTOCK',
    'HOUSEHOLD_GOODS',
    'FARM_EQUIPMENT',
    'INDUSTRIAL_EQUIPMENT',
  ],

  FINANCIAL_ASSETS: [
    'BANK_ACCOUNT',
    'MOBILE_MONEY',
    'SACCO_SHARES',
    'INVESTMENT_PORTFOLIOS',
    'RETIREMENT_FUNDS',
    'GOVERNMENT_SECURITIES',
  ],

  DIGITAL_ASSETS: [
    'CRYPTOCURRENCY',
    'ONLINE_ACCOUNTS',
    'NFTS',
    'DIGITAL_BUSINESSES',
    'DOMAIN_NAMES',
    'CLOUD_STORAGE',
  ],

  INTELLECTUAL_PROPERTY: ['TRADEMARKS', 'COPYRIGHTS', 'PATENTS', 'LICENSING_RIGHTS', 'ROYALTIES'],

  BUSINESS_INTERESTS: [
    'PRIVATE_COMPANY_SHARES',
    'PARTNERSHIP_INTERESTS',
    'SOLE_PROPRIETORSHIP_ASSETS',
  ],
} as const;

// ------------------------------------------------------------
// 5. SUCCESSION PROCESS TIMEFRAMES (Practice Directions 2021)
// ------------------------------------------------------------
export const SUCCESSION_TIMEFRAMES = {
  PROBATE: {
    APPLICATION_DEADLINE: 180, // Days after death
    OBJECTION_PERIOD: 30, // After Gazette Notice
    GRANT_ISSUANCE: 90, // Typical processing period
    CONFIRMATION_OF_GRANT: 180, // After issuance
    DISTRIBUTION_DEADLINE: 365, // After confirmation (formerly COMPLETE_DISTRIBUTION)
  },

  WILL_EXECUTION: {
    DEATH_NOTIFICATION: 30,
    INVENTORY_SUBMISSION: 90, // Deadline for executor to submit asset inventory
    CREDITOR_NOTICE: 30, // Period for creditors to be notified
    DEBT_SETTLEMENT: 180, // Period to settle verified debts
    FINAL_ACCOUNTS: 180, // Deadline for executor to present final accounts
  },

  DISPUTES: {
    FILING_DEADLINE: 60,
    MEDIATION_PERIOD: 90,
    COURT_HEARING: 180,
  },
} as const;

// ------------------------------------------------------------
// 6. COURTS: STRUCTURE & JURISDICTION
// ------------------------------------------------------------
export const KENYAN_COURTS = {
  HIGH_COURT: {
    JURISDICTION: 'All probate matters; estates above KES 5M',
    THRESHOLD_MIN: 5000001,
    LOCATIONS: [
      'Nairobi',
      'Mombasa',
      'Kisumu',
      'Nakuru',
      'Eldoret',
      'Meru',
      'Embu',
      'Machakos',
      'Kisii',
      'Busia',
      'Garissa',
    ],
  },

  MAGISTRATE_COURT: {
    JURISDICTION: 'Probate matters up to KES 5M',
    THRESHOLD_MAX: 5000000,
    GRADES: ['SENIOR', 'PRINCIPAL', 'CHIEF', 'RESIDENT'],
  },

  KADHIS_COURT: {
    JURISDICTION: 'Muslim succession and marital law',
    APPLICABLE_LAW: 'Sharia',
    LIMITATION: 'Only for Muslims',
  },

  LAND_AND_ENVIRONMENT_COURT: {
    JURISDICTION: 'Land disputes that arise during succession',
    NOTES: 'Not for probate distribution, only disputes.',
  },
} as const;

// ------------------------------------------------------------
export default {
  LAW_OF_SUCCESSION_SECTIONS,
  KENYAN_LEGAL_REQUIREMENTS,
  KENYAN_FAMILY_LAW,
  KENYAN_ASSET_CLASSIFICATION,
  SUCCESSION_TIMEFRAMES,
  KENYAN_COURTS,
};

/* -------------------------------------------------------------------------- */
/*                           KENYAN SPECIFIC LISTS                            */
/* -------------------------------------------------------------------------- */

export const KENYAN_COUNTIES_LIST = [
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
] as const;
