/**
 * Succession System Core Rules
 * Covers: executors, beneficiaries, witnesses, disputes, and distribution.
 * Based on Kenyan succession practice (Cap 160) + general estate planning standards.
 */
import { MINOR_PROTECTION } from './distribution-rules.constants';
import { KENYAN_LEGAL_REQUIREMENTS } from './kenyan-law.constants';
import { SUCCESSION_TIMEFRAMES } from './kenyan-law.constants';
import { INTESTATE_PRIORITY } from './relationship-types.constants';

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
  MIN_SHARE_PERCENTAGE: 0.01, // 1%
  MAX_SHARE_PERCENTAGE: 100,
  RESIDUARY_REQUIREMENT: true,
  DEPENDANT_MINIMUM_SHARE: 0.3, // 30% minimum for dependants (aligns with Section 26 intentions)

  RELATIONSHIP_PRIORITY: INTESTATE_PRIORITY,

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
  MAX_EXECUTORS: KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MAX_EXECUTORS,
  MIN_EXECUTORS: 1, // System rule
  ALTERNATE_REQUIREMENT: true, // System rule

  ELIGIBILITY: {
    MIN_AGE: KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.MINIMUM_AGE,
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
    MIN_PERCENTAGE: KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.FEE_PERCENTAGE.MIN,
    MAX_PERCENTAGE: KENYAN_LEGAL_REQUIREMENTS.EXECUTOR_REQUIREMENTS.FEE_PERCENTAGE.MAX,
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
    MIN_AGE: KENYAN_LEGAL_REQUIREMENTS.MINIMUM_TESTATOR_AGE,
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

  FILING_DEADLINE_DAYS: SUCCESSION_TIMEFRAMES.DISPUTES.FILING_DEADLINE,
  MEDIATION_REQUIRED: true,
  COURT_HEARING_DAYS: SUCCESSION_TIMEFRAMES.DISPUTES.COURT_HEARING,

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
    NOTIFICATION_DAYS: SUCCESSION_TIMEFRAMES.WILL_EXECUTION.DEATH_NOTIFICATION,
    INVENTORY_DAYS: SUCCESSION_TIMEFRAMES.WILL_EXECUTION.INVENTORY_SUBMISSION,
    DISTRIBUTION_DAYS: SUCCESSION_TIMEFRAMES.PROBATE.DISTRIBUTION_DEADLINE,
    FINAL_ACCOUNTS_DAYS: SUCCESSION_TIMEFRAMES.WILL_EXECUTION.FINAL_ACCOUNTS,
  },

  MINOR_PROTECTION: {
    TRUST_REQUIREMENT: true,
    GUARDIAN_APPOINTMENT: true,
    AGE_OF_MAJORITY: MINOR_PROTECTION.MINORS.ageLimit,
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
    DRAFT_EXPIRY_DAYS: 365,
    WITNESS_INVITATION_EXPIRY_DAYS: 90,
  },

  FAMILY: {
    MAX_MEMBERS: 200,
    MAX_GENERATIONS: 6,
    MAX_MARRIAGES_PER_PERSON: 4, // Aligns with Islamic Law max
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
  ASSET_OWNERSHIP_RULES,
  BENEFICIARY_RULES,
  EXECUTOR_RULES,
  WITNESS_RULES,
  DISPUTE_RULES,
  DISTRIBUTION_RULES,
  BUSINESS_RULES,
};
