/**
 * WILL STATUS + WORKFLOW CONSTANTS
 * Kenya Succession Law
 */
import { BUSINESS_RULES } from './succession-rules.constants';

export type WillStatusCode =
  | 'DRAFT'
  | 'PENDING_WITNESS'
  | 'WITNESSED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'EXECUTED'
  | 'CONTESTED'
  | 'PROBATE';

export interface WillStatusDefinition {
  code: WillStatusCode;
  label: string;
  description: string;
  legalStatus: string;
  editable: boolean;
  executable: boolean;
  allowedActions: string[];
  nextStatus: WillStatusCode[];
  timeline: string;
}

/* -------------------------------------------------------------------------- */
/*                           WILL STATUS DEFINITIONS                          */
/* -------------------------------------------------------------------------- */

export const WILL_STATUS: Record<WillStatusCode, WillStatusDefinition> = {
  DRAFT: {
    code: 'DRAFT',
    label: 'Draft',
    description: 'Will is being created or edited',
    legalStatus: 'NOT_VALID',
    editable: true,
    executable: false,
    allowedActions: ['SAVE', 'UPDATE', 'DELETE', 'ADD_ASSET', 'ADD_BENEFICIARY'],
    nextStatus: ['PENDING_WITNESS', 'DRAFT'],
    timeline: 'NO_DEADLINE',
  },

  PENDING_WITNESS: {
    code: 'PENDING_WITNESS',
    label: 'Pending Witness',
    description: 'Awaiting witness signatures and attestation',
    legalStatus: 'NOT_VALID',
    editable: true,
    executable: false,
    allowedActions: ['ADD_WITNESS', 'SIGN_WITNESS', 'UPDATE', 'REVERT_DRAFT'],
    nextStatus: ['WITNESSED', 'DRAFT'],
    timeline: '90_DAYS',
  },

  WITNESSED: {
    code: 'WITNESSED',
    label: 'Witnessed',
    description: 'Will has been properly witnessed but not activated',
    legalStatus: 'CONDITIONALLY_VALID',
    editable: false,
    executable: false,
    allowedActions: ['ACTIVATE', 'REVERT_DRAFT'],
    nextStatus: ['ACTIVE', 'DRAFT'],
    timeline: 'NO_DEADLINE',
  },

  ACTIVE: {
    code: 'ACTIVE',
    label: 'Active',
    description: 'Will is legally valid and enforceable',
    legalStatus: 'VALID',
    editable: false,
    executable: true,
    allowedActions: ['REVOKE', 'SUPERSEDE', 'VIEW', 'PRINT'],
    nextStatus: ['REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE'],
    timeline: 'UNTIL_DEATH_OR_REVOCATION',
  },

  REVOKED: {
    code: 'REVOKED',
    label: 'Revoked',
    description: 'Will has been legally revoked',
    legalStatus: 'INVALID',
    editable: false,
    executable: false,
    allowedActions: ['VIEW_HISTORY'],
    nextStatus: [],
    timeline: 'PERMANENT',
  },

  SUPERSEDED: {
    code: 'SUPERSEDED',
    label: 'Superseded',
    description: 'Replaced by a newer will',
    legalStatus: 'INVALID',
    editable: false,
    executable: false,
    allowedActions: ['VIEW_HISTORY', 'COMPARE_VERSIONS'],
    nextStatus: [],
    timeline: 'PERMANENT',
  },

  EXECUTED: {
    code: 'EXECUTED',
    label: 'Executed',
    description: "Will has been executed after testator's death",
    legalStatus: 'EXECUTED',
    editable: false,
    executable: false,
    allowedActions: ['VIEW_DISTRIBUTION', 'AUDIT_TRAIL'],
    nextStatus: [],
    timeline: 'PERMANENT',
  },

  CONTESTED: {
    code: 'CONTESTED',
    label: 'Contested',
    description: 'Will is being challenged in court',
    legalStatus: 'SUSPENDED',
    editable: false,
    executable: false,
    allowedActions: ['VIEW', 'COURT_PROCEEDINGS'],
    nextStatus: ['ACTIVE', 'REVOKED', 'EXECUTED'],
    timeline: 'COURT_DETERMINED',
  },

  PROBATE: {
    code: 'PROBATE',
    label: 'In Probate',
    description: 'Will is undergoing probate in court',
    legalStatus: 'UNDER_REVIEW',
    editable: false,
    executable: false,
    allowedActions: ['VIEW', 'COURT_UPDATES'],
    nextStatus: ['EXECUTED', 'CONTESTED'],
    timeline: 'COURT_DETERMINED',
  },
};

/* -------------------------------------------------------------------------- */
/*                           STATE TRANSITION RULES                           */
/* -------------------------------------------------------------------------- */

export const STATUS_TRANSITIONS = {
  DRAFT: {
    to: ['PENDING_WITNESS'],
    requirements: ['MINIMUM_CONTENT', 'TESTATOR_DETAILS'],
    restrictions: [],
  },

  PENDING_WITNESS: {
    to: ['WITNESSED', 'DRAFT'],
    requirements: ['WITNESS_INVITED'],
    restrictions: ['MAX_WITNESS_PENDING_DAYS'],
  },

  WITNESSED: {
    to: ['ACTIVE', 'DRAFT'],
    requirements: ['MINIMUM_WITNESSES', 'PROPER_ATTESTATION'],
    restrictions: ['TESTATOR_CAPACITY'],
  },

  ACTIVE: {
    to: ['REVOKED', 'SUPERSEDED', 'EXECUTED', 'CONTESTED', 'PROBATE'],
    requirements: [],
    restrictions: ['TESTATOR_ALIVE_FOR_REVOCATION'],
  },

  REVOKED: {
    to: [],
    requirements: ['REVOCATION_DOCUMENT'],
    restrictions: [],
  },

  CONTESTED: {
    to: ['ACTIVE', 'REVOKED', 'EXECUTED'],
    requirements: ['COURT_PROCEEDINGS'],
    restrictions: ['COURT_JURISDICTION'],
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                              VALIDATION RULES                              */
/* -------------------------------------------------------------------------- */

export const STATUS_RULES = {
  MINIMUM_REQUIREMENTS: {
    DRAFT: ['TESTATOR_IDENTITY', 'WILL_TITLE', 'BASIC_CONTENT'],
    PENDING_WITNESS: ['COMPLETE_CONTENT', 'TESTATOR_SIGNATURE', 'WITNESS_INVITATIONS'],
    WITNESSED: ['MINIMUM_WITNESSES_SIGNED', 'PROPER_ATTESTATION', 'TESTATOR_SIGNATURE_VERIFIED'],
    ACTIVE: ['TESTATOR_CAPACITY_CONFIRMED', 'NO_UNDUE_INFLUENCE', 'COMPLIANCE_WITH_LAW'],
  },

  LEGAL_COMPLIANCE: {
    DRAFT: { lawSection: 'NONE', requirements: [] },
    WITNESSED: {
      lawSection: 'Section 11',
      requirements: ['WRITING_REQUIREMENT', 'TESTATOR_SIGNATURE', 'WITNESS_ATTESTATION'],
    },
    ACTIVE: {
      lawSection: 'Sections 5–8',
      requirements: ['TESTATOR_CAPACITY', 'FREE_WILL', 'NO_UNDUE_INFLUENCE'],
    },
  },

  TIMEFRAMES: {
    DRAFT_EXPIRY_DAYS: BUSINESS_RULES.WILL.DRAFT_EXPIRY_DAYS,
    WITNESS_INVITATION_EXPIRY_DAYS: BUSINESS_RULES.WILL.WITNESS_INVITATION_EXPIRY_DAYS,
    ACTIVATION_DEADLINE: 0,
    REVOCATION_PERIOD: 0,
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                                UI CONFIG                                   */
/* -------------------------------------------------------------------------- */

export const STATUS_UI = {
  COLORS: {
    DRAFT: '#6B7280',
    PENDING_WITNESS: '#F59E0B',
    WITNESSED: '#3B82F6',
    ACTIVE: '#10B981',
    REVOKED: '#EF4444',
    SUPERSEDED: '#8B5CF6',
    EXECUTED: '#059669',
    CONTESTED: '#DC2626',
    PROBATE: '#7C3AED',
  },

  ICONS: {
    DRAFT: 'edit',
    PENDING_WITNESS: 'person_add',
    WITNESSED: 'check_circle_outline',
    ACTIVE: 'verified',
    REVOKED: 'cancel',
    SUPERSEDED: 'upgrade',
    EXECUTED: 'assignment_turned_in',
    CONTESTED: 'gavel',
    PROBATE: 'balance',
  },

  BADGES: {
    DRAFT: 'secondary',
    PENDING_WITNESS: 'warning',
    WITNESSED: 'info',
    ACTIVE: 'success',
    REVOKED: 'error',
    SUPERSEDED: 'secondary',
    EXECUTED: 'success',
    CONTESTED: 'error',
    PROBATE: 'info',
  },
} as const;

/* -------------------------------------------------------------------------- */
/*                               WORKFLOW FLOWS                               */
/* -------------------------------------------------------------------------- */

export const STATUS_WORKFLOW = {
  CREATION: ['DRAFT', 'PENDING_WITNESS', 'WITNESSED', 'ACTIVE'],
  REVOCATION: ['ACTIVE', 'REVOKED'],
  SUPERSESSION: ['ACTIVE', 'SUPERSEDED'],
  EXECUTION: ['ACTIVE', 'EXECUTED'],
  CONTESTATION: ['ACTIVE', 'CONTESTED'],
  PROBATE: ['ACTIVE', 'PROBATE', 'EXECUTED'],
} as const;

export default {
  WILL_STATUS,
  STATUS_TRANSITIONS,
  STATUS_RULES,
  STATUS_UI,
  STATUS_WORKFLOW,
};
