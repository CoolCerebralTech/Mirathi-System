/**
 * ========================================================================
 *   SUCCESSION SYSTEM — CORE DOMAIN TYPES
 *   Kenyan Succession Law · Wills · Probate · Executors · Beneficiaries
 * ========================================================================
 *
 *  This file contains the fundamental domain model types used across the
 *  succession module. All validations, workflows, entities and services
 *  depend on these structures.

 * ========================================================================
 */

/* -----------------------------------------------------------------------
 *  WILL & TESTAMENT TYPES
 * --------------------------------------------------------------------- */
export type WillStatus =
  | 'DRAFT'
  | 'PENDING_WITNESS'
  | 'WITNESSED'
  | 'ACTIVE'
  | 'REVOKED'
  | 'SUPERSEDED'
  | 'EXECUTED'
  | 'CONTESTED'
  | 'PROBATE';

export type WillAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ADD_ASSET'
  | 'REMOVE_ASSET'
  | 'ADD_BENEFICIARY'
  | 'REMOVE_BENEFICIARY'
  | 'ADD_WITNESS'
  | 'REMOVE_WITNESS'
  | 'SIGN'
  | 'ACTIVATE'
  | 'REVOKE'
  | 'SUPERSEDE'
  | 'EXECUTE';

export type WillClauseType =
  | 'EXECUTOR_APPOINTMENT'
  | 'BENEFICIARY_DESIGNATION'
  | 'ASSET_DISTRIBUTION'
  | 'GUARDIAN_APPOINTMENT'
  | 'FUNERAL_DIRECTIONS'
  | 'DIGITAL_ASSETS'
  | 'SPECIAL_INSTRUCTIONS'
  | 'RESIDUARY_CLAUSE';

/* -----------------------------------------------------------------------
 *  ASSET & PROPERTY TYPES
 * --------------------------------------------------------------------- */
export type AssetType =
  | 'LAND_PARCEL'
  | 'PROPERTY'
  | 'FINANCIAL_ASSET'
  | 'DIGITAL_ASSET'
  | 'BUSINESS_INTEREST'
  | 'VEHICLE'
  | 'LIVESTOCK'
  | 'PERSONAL_EFFECTS'
  | 'INTELLECTUAL_PROPERTY'
  | 'OTHER';

export type AssetOwnershipType =
  | 'SOLE'
  | 'JOINT_TENANCY'
  | 'TENANCY_IN_COMMON'
  | 'COMMUNITY_PROPERTY'
  | 'TRUST_OWNED'
  | 'CORPORATE_OWNED';

export type AssetStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ENCUMBERED'
  | 'SOLD'
  | 'TRANSFERRED'
  | 'DISTRIBUTED'
  | 'DISPUTED';

export type ValuationMethod =
  | 'MARKET_COMPARISON'
  | 'INCOME_APPROACH'
  | 'COST_APPROACH'
  | 'PROFESSIONAL_APPRAISAL'
  | 'SELF_ASSESSMENT'
  | 'GOVERNMENT_VALUATION';

export type AssetDocumentType =
  | 'TITLE_DEED'
  | 'SALE_AGREEMENT'
  | 'VALUATION_REPORT'
  | 'REGISTRATION_CERTIFICATE'
  | 'INSURANCE_POLICY'
  | 'LOAN_AGREEMENT'
  | 'OTHER';

/* -----------------------------------------------------------------------
 *  BENEFICIARY & BEQUEST TYPES
 * --------------------------------------------------------------------- */
export type BeneficiaryType = 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' | 'CHARITY' | 'ORGANIZATION';

export type BequestType =
  | 'SPECIFIC'
  | 'RESIDUARY'
  | 'CONDITIONAL'
  | 'PERCENTAGE'
  | 'TRUST'
  | 'LIFE_ESTATE';

export type BequestConditionType =
  | 'AGE_REQUIREMENT'
  | 'SURVIVAL'
  | 'EDUCATION'
  | 'MARRIAGE'
  | 'OCCUPATION'
  | 'HEALTH'
  | 'ALTERNATE'
  | 'NONE';

export type DistributionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'DEFERRED'
  | 'CANCELLED';

/* -----------------------------------------------------------------------
 *  EXECUTOR & FIDUCIARY TYPES
 * --------------------------------------------------------------------- */
export type ExecutorType = 'USER' | 'EXTERNAL' | 'CORPORATE' | 'PUBLIC_TRUSTEE';

export type ExecutorRoleType = 'PRIMARY' | 'ALTERNATE' | 'CO_EXECUTOR' | 'SUCCESSOR';

export type FiduciaryDuty = 'LOYALTY' | 'CARE' | 'OBEDIENCE' | 'ACCOUNTING' | 'CONFIDENTIALITY';

/* -----------------------------------------------------------------------
 *  WITNESS & SIGNATURE TYPES
 * --------------------------------------------------------------------- */
export type WitnessType = 'USER' | 'EXTERNAL' | 'PROFESSIONAL';

export type WitnessStatus = 'PENDING' | 'SIGNED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export type SignatureType =
  | 'DIGITAL_SIGNATURE'
  | 'ELECTRONIC_SIGNATURE'
  | 'WET_SIGNATURE'
  | 'BIOMETRIC_SIGNATURE';

/* -----------------------------------------------------------------------
 *  FAMILY & RELATIONSHIP TYPES
 * --------------------------------------------------------------------- */
export type RelationshipType =
  | 'SPOUSE'
  | 'EX_SPOUSE'
  | 'CHILD'
  | 'ADOPTED_CHILD'
  | 'STEPCHILD'
  | 'PARENT'
  | 'SIBLING'
  | 'HALF_SIBLING'
  | 'GRANDCHILD'
  | 'GRANDPARENT'
  | 'NIECE_NEPHEW'
  | 'AUNT_UNCLE'
  | 'COUSIN'
  | 'GUARDIAN'
  | 'OTHER';

export type FamilyMemberType =
  | 'REGISTERED_USER'
  | 'EXTERNAL_PERSON'
  | 'DECEASED_RELATIVE'
  | 'MINOR_CHILD';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/* -----------------------------------------------------------------------
 *  GUARDIANSHIP TYPES
 * --------------------------------------------------------------------- */
export type GuardianType =
  | 'LEGAL_GUARDIAN'
  | 'FINANCIAL_GUARDIAN'
  | 'PROPERTY_GUARDIAN'
  | 'TESTAMENTARY_GUARDIAN'
  | 'COURT_APPOINTED';

export type GuardianshipScope = 'FULL' | 'FINANCIAL' | 'MEDICAL' | 'EDUCATIONAL' | 'PERSONAL';

/* -----------------------------------------------------------------------
 *  DEBT & LIABILITY TYPES
 * --------------------------------------------------------------------- */
export type DebtType =
  | 'MORTGAGE'
  | 'PERSONAL_LOAN'
  | 'CREDIT_CARD'
  | 'BUSINESS_DEBT'
  | 'TAX_OBLIGATION'
  | 'FUNERAL_EXPENSE'
  | 'MEDICAL_BILL'
  | 'OTHER';

export type DebtPriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW';

/* -----------------------------------------------------------------------
 *  SUCCESSION PHASES
 * --------------------------------------------------------------------- */
export type SuccessionPhase =
  | 'WILL_CREATION'
  | 'ASSET_INVENTORY'
  | 'BENEFICIARY_DESIGNATION'
  | 'WILL_EXECUTION'
  | 'PROBATE_PROCESS'
  | 'ASSET_DISTRIBUTION'
  | 'ESTATE_CLOSURE';

export type ProcessStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';

/* -----------------------------------------------------------------------
 *  NOTIFICATION TYPES
 * --------------------------------------------------------------------- */
export type NotificationType =
  | 'WILL_CREATED'
  | 'WILL_UPDATED'
  | 'WILL_ACTIVATED'
  | 'BENEFICIARY_ADDED'
  | 'ASSET_ADDED'
  | 'EXECUTOR_ADDED'
  | 'WITNESS_ADDED'
  | 'DISTRIBUTION_STARTED'
  | 'DISTRIBUTION_COMPLETED'
  | 'DEADLINE_REMINDER'
  | 'COMPLIANCE_ALERT';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'LETTER';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/* -----------------------------------------------------------------------
 *  AUDIT & SECURITY TYPES
 * --------------------------------------------------------------------- */
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'SIGN'
  | 'VERIFY'
  | 'APPROVE'
  | 'REJECT';

export type SecurityLevel =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'HIGHLY_RESTRICTED';

export type AccessType = 'READ' | 'WRITE' | 'DELETE' | 'ADMIN' | 'OWNER';

/* -----------------------------------------------------------------------
 *  VALIDATION & ERROR TYPES
 * --------------------------------------------------------------------- */
export type ValidationErrorType =
  | 'REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'BUSINESS_RULE'
  | 'LEGAL_COMPLIANCE'
  | 'DATA_INTEGRITY'
  | 'SYSTEM_ERROR';

export type ErrorCategory =
  | 'VALIDATION'
  | 'BUSINESS'
  | 'SECURITY'
  | 'INTEGRATION'
  | 'SYSTEM'
  | 'UNKNOWN';

/* -----------------------------------------------------------------------
 *  BRANDED UTILITY TYPES
 * --------------------------------------------------------------------- */
export type Percentage = number & { readonly __brand: 'Percentage' }; // 0–100
export type ShareAmount = number & { readonly __brand: 'ShareAmount' };
export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP';

export const createPercentage = (value: number): Percentage => {
  if (value < 0 || value > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return value as Percentage;
};

export const createShareAmount = (value: number): ShareAmount => {
  if (value < 0) {
    throw new Error('Share amount cannot be negative');
  }
  return value as ShareAmount;
};

/* -----------------------------------------------------------------------
 *  UTILITY TYPES
 * --------------------------------------------------------------------- */
export type DateRange = {
  start: Date;
  end: Date;
};

export type Address = {
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
};

export type ContactInfo = {
  phone: string;
  email: string;
  address: Address;
};

/* -----------------------------------------------------------------------
 *  TYPE GUARDS
 * --------------------------------------------------------------------- */
export const isValidWillStatus = (status: string): status is WillStatus => {
  return [
    'DRAFT',
    'PENDING_WITNESS',
    'WITNESSED',
    'ACTIVE',
    'REVOKED',
    'SUPERSEDED',
    'EXECUTED',
    'CONTESTED',
    'PROBATE',
  ].includes(status);
};

export const isValidAssetType = (type: string): type is AssetType => {
  return [
    'LAND_PARCEL',
    'PROPERTY',
    'FINANCIAL_ASSET',
    'DIGITAL_ASSET',
    'BUSINESS_INTEREST',
    'VEHICLE',
    'LIVESTOCK',
    'PERSONAL_EFFECTS',
    'INTELLECTUAL_PROPERTY',
    'OTHER',
  ].includes(type);
};

export const isValidRelationship = (relationship: string): relationship is RelationshipType => {
  return [
    'SPOUSE',
    'EX_SPOUSE',
    'CHILD',
    'ADOPTED_CHILD',
    'STEPCHILD',
    'PARENT',
    'SIBLING',
    'HALF_SIBLING',
    'GRANDCHILD',
    'GRANDPARENT',
    'NIECE_NEPHEW',
    'AUNT_UNCLE',
    'COUSIN',
    'GUARDIAN',
    'OTHER',
  ].includes(relationship);
};
