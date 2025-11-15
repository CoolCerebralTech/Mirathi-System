/**
 * LEGAL TIMEFRAMES — KENYA
 * Comprehensive deadlines used across probate, intestate succession,
 * disputes, asset distribution, executor duties, and court procedures.
 *
 * Includes: severity levels, workflow control flags, extension rules,
 * and cross-referenced sections from Cap 160 (Law of Succession Act).
 */

export type TimeframeMeta = {
  description: string;
  deadline: number; // days
  lawSection: string;
  mandatory: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  consequences: string;
  requiresCourtOrder?: boolean;
  autoTriggerNext?: boolean; // triggers next workflow stage
  blocksProcess?: boolean; // cannot proceed until satisfied
  maxExtensionsAllowed?: number;
  // Add missing properties for urgent timeframes
  priority?: 'URGENT' | 'EXPEDITED' | 'EXTREMELY_URGENT' | 'STANDARD';
  requirements?: string[];
};

const TF = (opts: TimeframeMeta) => opts;

// ---------------------------------------------------------
// PROBATE PROCESS TIMEFRAMES
// ---------------------------------------------------------

export const PROBATE_TIMEFRAMES = {
  APPLICATION: {
    PROBATE_APPLICATION: TF({
      description: 'Filing for grant of probate',
      deadline: 180,
      lawSection: '51',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'DELAY_PENALTIES',
      requiresCourtOrder: false,
      blocksProcess: true,
      maxExtensionsAllowed: 1,
    }),

    LETTERS_OF_ADMINISTRATION: TF({
      description: 'Application for letters of administration',
      deadline: 180,
      lawSection: '55',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'DELAY_PENALTIES',
      blocksProcess: true,
      maxExtensionsAllowed: 1,
    }),
  },

  OBJECTION: {
    CAVEAT_PERIOD: TF({
      description: 'Period for filing caveat after gazette notice',
      deadline: 30,
      lawSection: '67',
      mandatory: false,
      severity: 'MEDIUM',
      consequences: 'LOSS_OF_RIGHT_TO_OBJECT',
      blocksProcess: true,
    }),

    OPPOSITION_PERIOD: TF({
      description: 'Period for opposing a grant application',
      deadline: 30,
      lawSection: '68',
      mandatory: false,
      severity: 'MEDIUM',
      consequences: 'DEFAULT_JUDGMENT',
    }),
  },

  GRANT: {
    GRANT_ISSUANCE: TF({
      description: 'Expected timeframe for issuance of grant',
      deadline: 90,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'NONE',
      autoTriggerNext: true,
    }),

    RESEALING_FOREIGN_GRANT: TF({
      description: 'Resealing a foreign grant',
      deadline: 365,
      lawSection: '77',
      mandatory: false,
      severity: 'LOW',
      consequences: 'ADDITIONAL_REQUIREMENTS',
    }),
  },
};

// ---------------------------------------------------------
// ESTATE ADMINISTRATION TIMEFRAMES
// ---------------------------------------------------------

export const ESTATE_ADMINISTRATION = {
  NOTIFICATION: {
    HEIRS_NOTIFICATION: TF({
      description: 'Notify heirs and beneficiaries',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'CONTEMPT_OF_COURT',
      blocksProcess: true,
    }),

    CREDITORS_NOTIFICATION: TF({
      description: 'Notify creditors',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'PERSONAL_LIABILITY',
    }),
  },

  INVENTORY: {
    ESTATE_INVENTORY: TF({
      description: 'Submission of estate inventory',
      deadline: 90,
      lawSection: '83',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'CONTEMPT_OF_COURT',
      blocksProcess: true,
      autoTriggerNext: true,
    }),

    FINAL_ACCOUNTS: TF({
      description: 'Submission of final administration accounts',
      deadline: 180,
      lawSection: '83',
      mandatory: true,
      severity: 'MEDIUM',
      consequences: 'SURCHARGE',
    }),
  },

  DEBTS: {
    CREDITOR_CLAIMS: TF({
      description: 'Claims filing period for creditors',
      deadline: 90,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'STATUTE_BARRED',
    }),

    DEBT_PAYMENT: TF({
      description: 'Payment of admitted debts',
      deadline: 180,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'INTEREST_ACCRUAL',
    }),
  },
};

// ---------------------------------------------------------
// DISTRIBUTION TIMEFRAMES
// ---------------------------------------------------------

export const DISTRIBUTION_TIMEFRAMES = {
  GENERAL: {
    DISTRIBUTION_COMPLETION: TF({
      description: 'Full completion of distribution of estate',
      deadline: 365,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'CONTEMPT_OF_COURT',
      blocksProcess: true,
    }),

    INTERIM_DISTRIBUTION: TF({
      description: 'Emergency support for dependants',
      deadline: 90,
      lawSection: 'None',
      mandatory: false,
      severity: 'MEDIUM',
      consequences: 'NONE',
    }),
  },

  SPECIFIC_ASSETS: {
    TRANSFER_OF_LAND: TF({
      description: 'Land title transfer to beneficiaries',
      deadline: 180,
      lawSection: 'None',
      mandatory: true,
      severity: 'MEDIUM',
      consequences: 'PENALTY_INTEREST',
    }),

    FINANCIAL_ASSETS: TF({
      description: 'Transfer of cash, shares & securities',
      deadline: 90,
      lawSection: 'None',
      mandatory: true,
      severity: 'MEDIUM',
      consequences: 'LOST_INTEREST',
    }),
  },
};

// ---------------------------------------------------------
// DISPUTE TIMEFRAMES
// ---------------------------------------------------------

export const DISPUTE_TIMEFRAMES = {
  WILL_CONTESTS: {
    CONTEST_FILING: TF({
      description: 'Filing a will contest',
      deadline: 60,
      lawSection: 'None',
      mandatory: false,
      severity: 'HIGH',
      consequences: 'LOSS_OF_RIGHT',
    }),

    PROOF_IN_SOLEMN_FORM: TF({
      description: 'Application for solemn form proof',
      deadline: 30,
      lawSection: 'None',
      mandatory: false,
      severity: 'MEDIUM',
      consequences: 'DEFAULT',
    }),
  },

  GENERAL_DISPUTES: {
    MEDIATION_PERIOD: TF({
      description: 'Court-ordered mediation period',
      deadline: 90,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'COURT_INTERVENTION',
    }),

    COURT_HEARING: TF({
      description: 'Scheduling main hearing',
      deadline: 180,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'ADJOURNMENT',
    }),
  },
};

// ---------------------------------------------------------
// EXECUTOR & ADMINISTRATOR TIMEFRAMES
// ---------------------------------------------------------

export const EXECUTOR_TIMEFRAMES = {
  APPOINTMENT: {
    EXECUTOR_ACCEPTANCE: TF({
      description: ' Executor must accept appointment',
      deadline: 30,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'APPOINTMENT_LAPSE',
    }),

    BOND_FILING: TF({
      description: 'Executor/administrator bond filing',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'CRITICAL',
      consequences: 'APPOINTMENT_REVOCATION',
      blocksProcess: true,
    }),
  },

  DUTIES: {
    ASSET_PROTECTION: TF({
      description: 'Securing all estate assets',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'CRITICAL',
      consequences: 'NEGLIGENCE_LIABILITY',
      blocksProcess: true,
    }),

    TAX_FILING: TF({
      description: 'Final tax returns filing',
      deadline: 90,
      lawSection: 'None',
      mandatory: true,
      severity: 'MEDIUM',
      consequences: 'PENALTIES_INTEREST',
    }),
  },
};

// ---------------------------------------------------------
// COURT TIMEFRAMES
// ---------------------------------------------------------

export const COURT_TIMEFRAMES = {
  HEARINGS: {
    MENTION_DATE: TF({
      description: 'First mention date',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'MEDIUM',
      consequences: 'STRIKE_OUT',
    }),

    HEARING_DATE: TF({
      description: 'Main hearing date',
      deadline: 180,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'ADJOURNMENT',
    }),
  },

  JUDGMENT: {
    JUDGMENT_DELIVERY: TF({
      description: 'Court delivering judgment',
      deadline: 90,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'APPEAL_RIGHTS',
    }),

    ORDER_EXECUTION: TF({
      description: 'Execution of ordered remedies',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'CONTEMPT_OF_COURT',
      blocksProcess: true,
    }),
  },
};

// ---------------------------------------------------------
// APPEALS, STORAGE, MISC
// ---------------------------------------------------------

export const MISCELLANEOUS_TIMEFRAMES = {
  DOCUMENTATION: {
    WILL_STORAGE: TF({
      description: 'Minimum storage period for wills',
      deadline: 25 * 365,
      lawSection: 'None',
      mandatory: false,
      severity: 'LOW',
      consequences: 'NONE',
    }),

    RECORD_RETENTION: TF({
      description: 'Retention of estate administration records',
      deadline: 7 * 365,
      lawSection: 'None',
      mandatory: true,
      severity: 'LOW',
      consequences: 'LEGAL_PENALTIES',
    }),
  },

  APPEALS: {
    APPEAL_FILING: TF({
      description: 'Filing notice of appeal',
      deadline: 30,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'LOSS_OF_APPEAL_RIGHT',
    }),

    RECORD_OF_APPEAL: TF({
      description: 'Filing record of appeal',
      deadline: 60,
      lawSection: 'None',
      mandatory: true,
      severity: 'HIGH',
      consequences: 'DISMISSAL_FOR_WANT_OF_PROSECUTION',
    }),
  },
};

// ---------------------------------------------------------
// DEADLINE CALCULATION RULES
// ---------------------------------------------------------

export const TIMEFRAME_CALCULATION = {
  BUSINESS_DAYS: {
    includeSaturdays: false,
    includeSundays: false,
    includeHolidays: false,
    holidayCalendar: 'KENYAN_PUBLIC_HOLIDAYS',
  },

  DEADLINE_RULES: {
    exclusionRule: 'LAST_DAY_EXCLUSION',
    extensionGrounds: ['COURT_CLOSURE', 'PUBLIC_HOLIDAY', 'UNAVOIDABLE_DELAY', 'PARTIES_CONSENT'],
    extensionProcess: 'COURT_APPLICATION',
  },
};

// ---------------------------------------------------------
// URGENT MATTERS (INJUNCTIONS & PRESERVATION)
// ---------------------------------------------------------

export const URGENT_TIMEFRAMES = {
  INJUNCTIONS: {
    TEMPORARY_INJUNCTION: TF({
      description: 'Hearing for temporary injunction',
      deadline: 7,
      lawSection: 'None',
      mandatory: false,
      priority: 'URGENT',
      severity: 'CRITICAL',
      requirements: ['IRREPARABLE_HARM', 'PRIMA_FACIE_CASE'],
      consequences: 'NONE',
    }),

    INTERLOCUTORY_ORDERS: TF({
      description: 'Interlocutory orders hearing',
      deadline: 14,
      lawSection: 'None',
      mandatory: false,
      priority: 'EXPEDITED',
      severity: 'CRITICAL',
      requirements: ['PENDING_MAIN_SUIT'],
      consequences: 'NONE',
    }),
  },

  PRESERVATION_ORDERS: {
    ASSET_PRESERVATION: TF({
      description: 'Asset preservation order',
      deadline: 7,
      lawSection: 'None',
      mandatory: false,
      priority: 'URGENT',
      severity: 'CRITICAL',
      requirements: ['IMMINENT_DISSIPATION'],
      consequences: 'NONE',
    }),

    ANTI_DISSIPATION: TF({
      description: 'Anti-dissipation emergency order',
      deadline: 3,
      lawSection: 'None',
      mandatory: false,
      priority: 'EXTREMELY_URGENT',
      severity: 'CRITICAL',
      requirements: ['CLEAR_EVIDENCE_OF_RISK'],
      consequences: 'NONE',
    }),
  },
};

export default {
  PROBATE_TIMEFRAMES,
  ESTATE_ADMINISTRATION,
  DISTRIBUTION_TIMEFRAMES,
  DISPUTE_TIMEFRAMES,
  EXECUTOR_TIMEFRAMES,
  COURT_TIMEFRAMES,
  MISCELLANEOUS_TIMEFRAMES,
  TIMEFRAME_CALCULATION,
  URGENT_TIMEFRAMES,
};
