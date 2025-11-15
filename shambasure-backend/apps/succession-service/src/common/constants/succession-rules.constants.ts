/**
 * Succession System Core Rules
 * Covers: wills, executors, beneficiaries, witnesses, disputes, and distribution.
 * Based on Kenyan succession practice (Cap 160) + general estate planning standards.
 */

/* -----------------------------------------------------
 * 1. Will Status Lifecycle
 * --------------------------------------------------- */
export const WILL_STATUS = {
  DRAFT: {
    allowedActions: ['UPDATE', 'DELETE', 'ADD_ASSET', 'ADD_BENEFICIARY', 'ADD_WITNESS'],
    nextStatus: ['PENDING_WITNESS', 'DRAFT'],
  },

  PENDING_WITNESS: {
    allowedActions: ['ADD_WITNESS', 'SIGN_WITNESS', 'UPDATE'],
    nextStatus: ['WITNESSED', 'DRAFT'],
  },

  WITNESSED: {
    allowedActions: ['ACTIVATE', 'UPDATE'],
    nextStatus: ['ACTIVE', 'DRAFT'],
  },

  ACTIVE: {
    allowedActions: ['REVOKE', 'SUPERSEDE', 'EXECUTE'],
    nextStatus: ['REVOKED', 'SUPERSEDED', 'EXECUTED'],
  },

  REVOKED: {
    allowedActions: [],
    nextStatus: [],
  },

  EXECUTED: {
    allowedActions: [],
    nextStatus: [],
  },
} as const;

/* -----------------------------------------------------
 * 2. Asset Ownership Rules
 * --------------------------------------------------- */
export const ASSET_OWNERSHIP_RULES = {
  SOLE: {
    transferable: true,
    requiresConsent: false,
    sharePercentage: 100,
  },

  JOINT_TENANCY: {
    transferable: true,
    requiresConsent: true,
    rightOfSurvivorship: true,
    sharePercentage: null, // equal shares
  },

  TENANCY_IN_COMMON: {
    transferable: true,
    requiresConsent: false,
    rightOfSurvivorship: false,
    sharePercentage: 'DEFINED', // user-provided per owner
  },

  COMMUNITY_PROPERTY: {
    transferable: true,
    requiresConsent: true,
    maritalProperty: true,
    sharePercentage: 50,
  },
} as const;

/* -----------------------------------------------------
 * 3. Beneficiary Assignment Rules
 * --------------------------------------------------- */
export const BENEFICIARY_RULES = {
  MAX_BENEFICIARIES: 50,
  MIN_SHARE_PERCENTAGE: 0.01, // 1%
  MAX_SHARE_PERCENTAGE: 100,
  RESIDUARY_REQUIREMENT: true,
  DEPENDANT_MINIMUM_SHARE: 0.3, // 30% minimum for dependants (aligns with Section 26 intentions)

  RELATIONSHIP_PRIORITY: [
    'SPOUSE',
    'CHILD',
    'ADOPTED_CHILD',
    'PARENT',
    'SIBLING',
    'OTHER',
  ] as const,

  CONDITIONAL_BEQUESTS: {
    MAX_CONDITIONS: 5,
    ALLOWED_CONDITION_TYPES: ['AGE_REQUIREMENT', 'EDUCATION', 'MARRIAGE', 'SURVIVAL'] as const,
    MAX_CONDITION_DURATION_YEARS: 25,
  },
} as const;

/* -----------------------------------------------------
 * 4. Executor & Administrator Rules
 * --------------------------------------------------- */
export const EXECUTOR_RULES = {
  MAX_EXECUTORS: 4,
  MIN_EXECUTORS: 1,
  ALTERNATE_REQUIREMENT: true,

  ELIGIBILITY: {
    MIN_AGE: 18,
    MENTAL_CAPACITY: true,
    NO_FELONY_CONVICTIONS: true,
    KENYAN_RESIDENT: false, // non-residents allowed
  },

  DUTIES: [
    'LOCATE_WILL',
    'NOTIFY_HEIRS',
    'INVENTORY_ASSETS',
    'PAY_DEBTS',
    'FILE_TAXES',
    'DISTRIBUTE_ASSETS',
    'FILE_FINAL_ACCOUNTS',
  ] as const,

  COMPENSATION: {
    MIN_PERCENTAGE: 0.01,
    MAX_PERCENTAGE: 0.05,
    COURT_APPROVAL_REQUIRED: true,
  },
} as const;

/* -----------------------------------------------------
 * 5. Witness Requirements
 * --------------------------------------------------- */
export const WITNESS_RULES = {
  MIN_WITNESSES: 2,
  MAX_WITNESSES: 5,

  ELIGIBILITY: {
    MIN_AGE: 18,
    MENTAL_CAPACITY: true,
    NOT_BENEFICIARY: true,
    NOT_SPOUSE_OF_BENEFICIARY: true,
    INDEPENDENT: true,
  },

  SIGNATURE: {
    REQUIRED: true,
    WITNESS_EACH_OTHER: true,
    PRESENCE_OF_TESTATOR: true,
  },
} as const;

/* -----------------------------------------------------
 * 6. Dispute Resolution Rules
 * --------------------------------------------------- */
export const DISPUTE_RULES = {
  VALID_GROUNDS: [
    'UNDUE_INFLUENCE',
    'LACK_CAPACITY',
    'FRAUD',
    'FORGERY',
    'IMPROPER_EXECUTION',
    'OMITTED_HEIR',
  ] as const,

  FILING_DEADLINE_DAYS: 60,
  MEDIATION_REQUIRED: true,
  COURT_HEARING_DAYS: 180,

  RESOLUTION_METHODS: ['MEDIATION', 'ARBITRATION', 'COURT_PROCEEDING', 'SETTLEMENT'] as const,
} as const;

/* -----------------------------------------------------
 * 7. Distribution Rules (Probate)
 * --------------------------------------------------- */
export const DISTRIBUTION_RULES = {
  DEBT_PRIORITY: [
    'FUNERAL_EXPENSES',
    'TAX_OBLIGATIONS',
    'SECURED_DEBTS',
    'UNSECURED_DEBTS',
  ] as const,

  TIMEFRAMES: {
    NOTIFICATION_DAYS: 30,
    INVENTORY_DAYS: 90,
    DISTRIBUTION_DAYS: 365,
    FINAL_ACCOUNTS_DAYS: 180,
  },

  MINOR_PROTECTION: {
    TRUST_REQUIREMENT: true,
    GUARDIAN_APPOINTMENT: true,
    AGE_OF_MAJORITY: 18,
  },
} as const;

/* -----------------------------------------------------
 * 8. System Business Rules (Limits & Constraints)
 * --------------------------------------------------- */
export const BUSINESS_RULES = {
  WILL: {
    MAX_ASSETS: 100,
    MAX_BENEFICIARIES: 50,
    MAX_VERSION_HISTORY: 10,
    AUTO_SAVE_MINUTES: 5,
  },

  FAMILY: {
    MAX_MEMBERS: 200,
    MAX_GENERATIONS: 6,
    MAX_MARRIAGES_PER_PERSON: 4,
  },

  ASSET: {
    MAX_VALUATION_HISTORY: 10,
    MIN_UPDATE_FREQUENCY_DAYS: 30,
  },
} as const;

/* -----------------------------------------------------
 * Default Export
 * --------------------------------------------------- */
export default {
  WILL_STATUS,
  ASSET_OWNERSHIP_RULES,
  BENEFICIARY_RULES,
  EXECUTOR_RULES,
  WITNESS_RULES,
  DISPUTE_RULES,
  DISTRIBUTION_RULES,
  BUSINESS_RULES,
};
