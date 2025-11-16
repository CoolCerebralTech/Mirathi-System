/**
 * Family Relationship Types Constants
 * Tailored for Kenyan family law & succession workflows
 */

/* -----------------------------------------------------
 * 1. Core Relationship Types
 * --------------------------------------------------- */
export const RELATIONSHIP_TYPES = {
  // Spousal Relationships
  SPOUSE: {
    code: 'SPOUSE',
    label: 'Spouse',
    description: 'Legally married partner',
    immediateFamily: true,
    dependant: true,
    inheritanceRights: true,
    priority: 0,
    categories: ['CIVIL', 'CUSTOMARY', 'RELIGIOUS'],
  },

  EX_SPOUSE: {
    code: 'EX_SPOUSE',
    label: 'Former Spouse',
    description: 'Divorced or annulled marriage partner',
    immediateFamily: false,
    dependant: false,
    inheritanceRights: false,
    conditions: ['DIVORCE_FINALIZED'],
  },

  // Parent-Child
  CHILD: {
    code: 'CHILD',
    label: 'Child',
    description: 'Biological child',
    immediateFamily: true,
    dependant: true,
    inheritanceRights: true,
    priority: 0,
  },

  ADOPTED_CHILD: {
    code: 'ADOPTED_CHILD',
    label: 'Adopted Child',
    description: 'Legally adopted child',
    immediateFamily: true,
    dependant: true,
    inheritanceRights: true,
    priority: 1,
    requirements: ['LEGAL_ADOPTION_ORDER'],
  },

  STEPCHILD: {
    code: 'STEPCHILD',
    label: 'Stepchild',
    description: 'Child of spouse from another union',
    immediateFamily: true,
    dependant: true,
    inheritanceRights: false,
    conditions: ['MAINTAINED_BY_DECEASED'],
  },

  // Parents
  PARENT: {
    code: 'PARENT',
    label: 'Parent',
    description: 'Biological or adoptive parent',
    immediateFamily: true,
    dependant: true,
    inheritanceRights: true,
    priority: 2,
  },

  // Siblings
  SIBLING: {
    code: 'SIBLING',
    label: 'Sibling',
    description: 'Full brother or sister',
    immediateFamily: true,
    dependant: false,
    inheritanceRights: true,
    priority: 3,
  },

  HALF_SIBLING: {
    code: 'HALF_SIBLING',
    label: 'Half-Sibling',
    description: 'Sibling sharing one parent',
    immediateFamily: true,
    dependant: false,
    inheritanceRights: true,
    priority: 4,
  },

  // Extended Family
  GRANDCHILD: {
    code: 'GRANDCHILD',
    label: 'Grandchild',
    description: "Child of one's child",
    immediateFamily: true,
    dependant: false,
    inheritanceRights: true,
    priority: 5,
  },

  GRANDPARENT: {
    code: 'GRANDPARENT',
    label: 'Grandparent',
    description: "Parent of one's parent",
    immediateFamily: true,
    dependant: false,
    inheritanceRights: true,
    priority: 6,
  },

  NIECE_NEPHEW: {
    code: 'NIECE_NEPHEW',
    label: 'Niece/Nephew',
    description: "Child of one's sibling",
    immediateFamily: false,
    dependant: false,
    inheritanceRights: true,
    priority: 7,
  },

  AUNT_UNCLE: {
    code: 'AUNT_UNCLE',
    label: 'Aunt/Uncle',
    description: "Sibling of one's parent",
    immediateFamily: false,
    dependant: false,
    inheritanceRights: true,
    priority: 8,
  },

  COUSIN: {
    code: 'COUSIN',
    label: 'Cousin',
    description: "Child of one's aunt or uncle",
    immediateFamily: false,
    dependant: false,
    inheritanceRights: true,
    priority: 9,
  },

  // Guardianship
  GUARDIAN: {
    code: 'GUARDIAN',
    label: 'Guardian',
    description: 'Legally appointed guardian',
    immediateFamily: false,
    dependant: false,
    inheritanceRights: false,
    types: ['TESTAMENTARY', 'COURT_APPOINTED'],
  },

  OTHER: {
    code: 'OTHER',
    label: 'Other Relative',
    description: 'Any other family relationship',
    immediateFamily: false,
    dependant: false,
    inheritanceRights: false,
  },
} as const;

/* -----------------------------------------------------
 * 2. Customary Relationship Extensions
 * --------------------------------------------------- */
export const CUSTOMARY_RELATIONSHIPS = {
  CUSTOMARY_SPOUSE: {
    code: 'CUSTOMARY_SPOUSE',
    label: 'Customary Spouse',
    description: 'Spouse under African customary law',
    recognition: 'FULL',
    conditions: ['COMMUNITY_RECOGNITION', 'COHABITATION', 'FAMILY_ACCEPTANCE'],
  },

  CLAN_MEMBER: {
    code: 'CLAN_MEMBER',
    label: 'Clan Member',
    description: 'Member of extended clan',
    inheritanceRights: 'CONDITIONAL',
    customaryLaw: true,
  },

  FAMILY_ELDER: {
    code: 'FAMILY_ELDER',
    label: 'Family Elder',
    description: 'Respected elder with advisory role',
    mediation: true,
  },
} as const;
/* -----------------------------------------------------
 * 3. Derived Constants & Helpers (NEW SECTION)
 * These are generated from the metadata in RELATIONSHIP_TYPES,
 * ensuring a single source of truth.
 * --------------------------------------------------- */

// Helper to get the code of a relationship type
type RelationshipCode = keyof typeof RELATIONSHIP_TYPES;

// Dynamically generate the list of dependants
export const DEPENDANT_RELATIONSHIPS = Object.values(RELATIONSHIP_TYPES)
  .filter((rel) => rel.dependant === true)
  .map((rel) => rel.code) as RelationshipCode[];

// Dynamically generate the intestate succession priority list
export const INTESTATE_PRIORITY = Object.values(RELATIONSHIP_TYPES)
  .filter((rel) => rel.inheritanceRights === true)
  .sort((a, b) => a.priority - b.priority)
  .map((rel) => rel.code) as RelationshipCode[];
/* -----------------------------------------------------
 * 5. Relationship Validation Rules
 * --------------------------------------------------- */
export const RELATIONSHIP_RULES = {
  MINOR_GUARDIAN: {
    minAge: 18,
    requirements: ['SOUND_MIND', 'NO_CONFLICT_OF_INTEREST'],
  },

  MARRIAGE_PROHIBITIONS: ['BLOOD_RELATION', 'SAME_LINEAGE', 'EXISTING_MARRIAGE'],

  CUSTOMARY_RECOGNITION: {
    requirements: ['FAMILY_CONSENT', 'COMMUNITY_ACCEPTANCE', 'COHABITATION', 'BRIDE_PRICE_PAYMENT'],
    documentation: ['FAMILY_AFFIDAVIT', 'ELDER_CONFIRMATION'],
  },
} as const;

/* -----------------------------------------------------
 * 6. Display Mapping
 * --------------------------------------------------- */
export const RELATIONSHIP_DISPLAY = {
  HIERARCHY: {
    LEVEL_1: ['SPOUSE', 'CHILD', 'PARENT'],
    LEVEL_2: ['SIBLING', 'GRANDCHILD', 'GRANDPARENT'],
    LEVEL_3: ['NIECE_NEPHEW', 'AUNT_UNCLE', 'COUSIN'],
    LEVEL_4: ['OTHER', 'GUARDIAN'],
  },

  LABELS: {
    MALE: {
      CHILD: 'Son',
      PARENT: 'Father',
      SIBLING: 'Brother',
      GRANDCHILD: 'Grandson',
      GRANDPARENT: 'Grandfather',
      NIECE_NEPHEW: 'Nephew',
      AUNT_UNCLE: 'Uncle',
    },
    FEMALE: {
      CHILD: 'Daughter',
      PARENT: 'Mother',
      SIBLING: 'Sister',
      GRANDCHILD: 'Granddaughter',
      GRANDPARENT: 'Grandmother',
      NIECE_NEPHEW: 'Niece',
      AUNT_UNCLE: 'Aunt',
    },
  },
} as const;

export default {
  RELATIONSHIP_TYPES,
  CUSTOMARY_RELATIONSHIPS,
  INTESTATE_PRIORITY,
  DEPENDANT_RELATIONSHIPS,
  RELATIONSHIP_RULES,
  RELATIONSHIP_DISPLAY,
};
