/**
 * ========================================================================
 *   SUCCESSION SYSTEM — CORE DOMAIN TYPES
 *   This file contains supplementary domain types.
 *
 * ========================================================================
 */

// --- NEW: Importing constants to derive types from ---
import { VALUATION_METHODS, ASSET_TYPES } from '../constants/asset-types.constants';
import { RELATIONSHIP_TYPES } from '../constants/relationship-types.constants';

/* -----------------------------------------------------------------------
 *  DERIVED & UNIQUE DOMAIN TYPES
 * --------------------------------------------------------------------- */

// This type is derived from the keys of our constant object.
export type ValuationMethod = keyof typeof VALUATION_METHODS;

// These types are unique to our domain logic and do not exist in Prisma.
export type WillClauseType =
  | 'EXECUTOR_APPOINTMENT'
  | 'BENEFICIARY_DESIGNATION'
  | 'ASSET_DISTRIBUTION'
  | 'GUARDIAN_APPOINTMENT'
  | 'FUNERAL_DIRECTIONS'
  | 'DIGITAL_ASSETS'
  | 'SPECIAL_INSTRUCTIONS'
  | 'RESIDUARY_CLAUSE';

export type BeneficiaryType = 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' | 'CHARITY' | 'ORGANIZATION';

export type SuccessionPhase =
  | 'WILL_CREATION'
  | 'ASSET_INVENTORY'
  | 'BENEFICIARY_DESIGNATION'
  | 'WILL_EXECUTION'
  | 'PROBATE_PROCESS'
  | 'ASSET_DISTRIBUTION'
  | 'ESTATE_CLOSURE';

/* -----------------------------------------------------------------------
 *  BRANDED & UTILITY TYPES
 * --------------------------------------------------------------------- */
export type Percentage = number & { readonly __brand: 'Percentage' };
export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP';

export const createPercentage = (value: number): Percentage => {
  if (value < 0 || value > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return value as Percentage;
};

export type Address = {
  street: string;
  city: string;
  county: string;
  postalCode: string;
  country: string;
};

/* -----------------------------------------------------------------------
 *  TYPE GUARDS
 * --------------------------------------------------------------------- */
const ASSET_TYPE_KEYS = Object.keys(ASSET_TYPES);
export const isValidAssetType = (type: string): boolean => {
  return ASSET_TYPE_KEYS.includes(type);
};

const RELATIONSHIP_TYPE_KEYS = Object.keys(RELATIONSHIP_TYPES);
export const isValidRelationship = (relationship: string): boolean => {
  return RELATIONSHIP_TYPE_KEYS.includes(relationship);
};
