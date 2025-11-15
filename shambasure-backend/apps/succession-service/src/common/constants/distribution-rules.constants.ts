/**
 * Comprehensive Asset Distribution Rules for the
 * Kenya Law of Succession Act (Cap. 160)
 *
 * Includes:
 * - Intestate succession (Part V)
 * - Testate succession (Part II & case law)
 * - Dependants (Section 29)
 * - Polygamy (Section 40)
 * - Estate distribution deadlines
 * - Debt settlement (Section 82 & 83)
 * - Trusts and minors
 * - Conditional bequests
 * - Digital assets
 * - Customary + Muslim law overrides
 */

// ----------------------------------------------------
//  SECTION: DEPENDANTS (Section 29)
// ----------------------------------------------------
export const DEPENDANTS = {
  PRIMARY: [
    'SPOUSE',
    'CHILDREN_BIOLOGICAL',
    'CHILDREN_ADOPTED',
    'CHILDREN_BORN_OUT_OF_WEDLOCK',
    'POSTHUMOUS_CHILDREN',
  ],

  SECONDARY: ['PARENTS', 'STEPCHILDREN', 'BROTHERS_AND_SISTERS', 'HALF_SIBLINGS', 'GRANDPARENTS'],

  SPECIAL_DEPENDANTS: ['MAINTAINED_AS_DEPENDANT_12_MONTHS_BEFORE_DEATH'],

  RULES: {
    PROOF_OF_DEPENDENCY_REQUIRED: true,
    EQUAL_TREATMENT_OF_ALL_CHILDREN: true, // includes adopted & illegitimate
  },
} as const;

// ----------------------------------------------------
//  SECTION: POLYGAMOUS FAMILIES (Section 40)
// ----------------------------------------------------
export const POLYGAMY_DISTRIBUTION = {
  lawSection: '40',
  description: 'Distribution for polygamous households',
  rules: {
    UNIT_PER_WIFE_PLUS_CHILDREN: true,
    CALC_METHOD: 'NUMBER_OF_CHILDREN_PER_HOUSE + ONE_FOR_THE_WIFE',
    DISTRIBUTION_METHOD: 'HOUSEHOLD_UNITS',
  },
  notes: [
    'Estate divided into units representing each house.',
    'Each house receives shares proportional to number of units.',
    'Within each house, division is equal unless circumstance requires otherwise.',
  ],
} as const;

// ----------------------------------------------------
//  SECTION: INTESTATE SUCCESSION RULES
// ----------------------------------------------------
export const INTESTATE_DISTRIBUTION = {
  // Section 35: Spouse + Children
  ONE_SPOUSE_WITH_CHILDREN: {
    lawSection: '35',
    description: 'Intestate with one spouse and children',
    distribution: {
      spouse: {
        personalEffects: 'ENTIRE',
        lifeInterest: 'REMAINDER',
        extinguishesOn: ['REMARRIAGE'],
      },
      children: {
        absoluteOwnership: 'AFTER_SPOUSE_LIFE_INTEREST',
      },
    },
  },

  // Section 36: Spouse but no children
  SPOUSE_ONLY: {
    lawSection: '36',
    description: 'Intestate with spouse but no children',
    distribution: {
      spouse: {
        share: 'ENTIRE_ESTATE',
      },
      parentsOrSiblings: {
        eligibleOnlyIf: 'NO_SPOUSE',
      },
    },
  },

  // Section 39: No spouse, no children
  NO_SPOUSE_NO_CHILDREN: {
    lawSection: '39',
    orderOfPriority: [
      'PARENTS',
      'SIBLINGS_FULL',
      'HALF_SIBLINGS',
      'GRANDPARENTS',
      'UNCLES_AUNTS',
      'COUSINS',
      'STATE',
    ],
  },

  // Section 40: Polygamy
  POLYGAMOUS: POLYGAMY_DISTRIBUTION,

  // Section 41: Minor beneficiaries
  MINORS: {
    lawSection: '41',
    rule: 'HELD_IN_TRUST_UNTIL_18',
    trustee: ['GUARDIAN', 'PUBLIC_TRUSTEE', 'TRUST_CORPORATION'],
  },

  // Section 42: Prior gifts accounted in distribution
  PREVIOUS_GIFTS: {
    lawSection: '42',
    rule: 'GIFTS_IN_ADVANCEMENT_MUST_BE_ACCOUNTED',
  },
} as const;

// ----------------------------------------------------
//  SECTION: TESTATE SUCCESSION
// ----------------------------------------------------
export const TESTATE_DISTRIBUTION = {
  WILL_VALIDITY: {
    requirements: ['WRITTEN', 'SIGNED_BY_TESTATOR', 'WITNESSED_BY_TWO_COMPETENT_PERSONS'],
    allowedForms: ['WRITTEN', 'ORAL_WITHIN_3_MONTHS_OF_DEATH'],
    oralLimitations: ['ONLY_MOVABLE_PROPERTY'],
  },

  WILL_PROVISIONS: {
    SPECIFIC_BEQUESTS: { priority: 1 },
    GENERAL_BEQUESTS: { priority: 2 },
    RESIDUARY: { priority: 3 },
    CONDITIONAL: { priority: 4 },
  },

  SPECIAL_RULES: {
    LAPSE: {
      description: 'Gift fails because beneficiary predeceased testator',
      exceptions: ['ANTI_LAPSE_WHEN_CHILD', 'RESIDUARY_REDISTRIBUTION'],
    },
    ADEMPTION: {
      description: 'Gift fails because the asset no longer exists at death',
    },
    REVOCATION: {
      validMethods: ['NEW_WILL', 'CODICIL', 'DESTRUCTION'],
    },
  },
} as const;

// ----------------------------------------------------
//  SECTION: DIGITAL ASSETS
// ----------------------------------------------------
export const DIGITAL_ASSETS = {
  categories: [
    'CRYPTOCURRENCY',
    'DIGITAL_WALLETS',
    'SOCIAL_MEDIA_ACCOUNTS',
    'ONLINE_BUSINESSES',
    'NFTS',
  ],
  rules: {
    PROOF_OF_OWNERSHIP_REQUIRED: true,
    ACCESS_INSTRUCTIONS_RECOMMENDED: true,
  },
} as const;

// ----------------------------------------------------
//  SECTION: DEBT PRIORITY (Section 82 & 83)
// ----------------------------------------------------
export const DEBT_PRIORITY = {
  ORDER: [
    { priority: 1, category: 'FUNERAL_EXPENSES', cap: 500000 },
    { priority: 2, category: 'TAXES' },
    { priority: 3, category: 'SECURED_CREDITORS' },
    { priority: 4, category: 'PREFERRED_CREDITORS' },
    { priority: 5, category: 'UNSECURED_CREDITORS' },
  ],
  rules: {
    ALL_DEBTS_MUST_BE_PAID_BEFORE_DISTRIBUTION: true,
    PRO_RATA_FOR_UNSECURED: true,
  },
} as const;

// ----------------------------------------------------
//  SECTION: TRUSTS & MINORS
// ----------------------------------------------------
export const MINOR_PROTECTION = {
  MINORS: {
    ageLimit: 18,
    trustee: ['PARENT', 'GUARDIAN', 'PUBLIC_TRUSTEE'],
  },
  INCAPACITATED: {
    conditions: ['MENTAL', 'PHYSICAL'],
    management: 'TRUST',
  },
} as const;

// ----------------------------------------------------
//  SECTION: CONDITIONAL BEQUESTS
// ----------------------------------------------------
export const CONDITIONAL_BEQUESTS = {
  VALID: ['AGE_REQUIREMENT', 'EDUCATION_COMPLETION', 'MARRIAGE_CONDITION_NOT_EXCESSIVE'],
  VOID: ['AGAINST_PUBLIC_POLICY', 'PROMOTES_ILLEGALITY', 'UNREASONABLE_RESTRAINT_OF_MARRIAGE'],
} as const;

// ----------------------------------------------------
//  SECTION: TIMELINES (Section 83)
// ----------------------------------------------------
export const DISTRIBUTION_TIMELINES = {
  INVENTORY_SUBMISSION: 90,
  CREDITOR_NOTICE: 30,
  DEBT_SETTLEMENT: 180,
  COMPLETE_DISTRIBUTION: 365,
  FINAL_ACCOUNTS: 180,
} as const;

// ----------------------------------------------------
//  SECTION: TAXES
// ----------------------------------------------------
export const TAX_CONSIDERATIONS = {
  INHERITANCE_TAX: { applicable: false },
  CAPITAL_GAINS_TAX: {
    applicable: true,
    rate: 0.05,
    exemptions: ['SPOUSE_TRANSFER', 'PRINCIPAL_RESIDENCE'],
  },
  STAMP_DUTY: {
    applicable: true,
    rate: 0.04,
    exemptions: ['INTESTATE_TO_FAMILY'],
  },
} as const;

export default {
  DEPENDANTS,
  POLYGAMY_DISTRIBUTION,
  INTESTATE_DISTRIBUTION,
  TESTATE_DISTRIBUTION,
  DEBT_PRIORITY,
  DIGITAL_ASSETS,
  MINOR_PROTECTION,
  DISTRIBUTION_TIMELINES,
  CONDITIONAL_BEQUESTS,
  TAX_CONSIDERATIONS,
};
