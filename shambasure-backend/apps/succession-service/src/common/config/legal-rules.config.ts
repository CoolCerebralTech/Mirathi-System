import { registerAs } from '@nestjs/config';

import {
  KENYAN_LEGAL_REQUIREMENTS,
  SUCCESSION_TIMEFRAMES,
  KENYAN_COURTS,
  KENYAN_FAMILY_LAW,
} from '../constants/kenyan-law.constants';
import {
  DEBT_PRIORITY,
  INTESTATE_DISTRIBUTION,
  MINOR_PROTECTION,
  DEPENDANTS,
  TESTATE_DISTRIBUTION,
  CONDITIONAL_BEQUESTS,
  TAX_CONSIDERATIONS,
  POLYGAMY_DISTRIBUTION,
} from '../constants/distribution-rules.constants';
import {
  DISPUTE_RULES as DisputeSystemRules,
  WITNESS_RULES,
  EXECUTOR_RULES as ExecutorSystemRules,
  BENEFICIARY_RULES,
  DISTRIBUTION_RULES,
} from '../constants/succession-rules.constants';

/**
 * Kenyan Legal Rules Configuration
 * Based on Law of Succession Act Cap 160 and related legislation
 */
export const legalRulesConfig = registerAs('legalRules', () => ({
  // Will Formalities (Section 11)
  willFormalities: {
    minWitnesses: KENYAN_LEGAL_REQUIREMENTS.MINIMUM_WITNESSES,
    maxWitnesses: KENYAN_LEGAL_REQUIREMENTS.MAXIMUM_WITNESSES,
    requiresWriting: TESTATE_DISTRIBUTION.WILL_VALIDITY.requirements.includes('WRITTEN'),
    requiresTestatorSignature:
      TESTATE_DISTRIBUTION.WILL_VALIDITY.requirements.includes('SIGNED_BY_TESTATOR'),
    requiresWitnessAttestation: TESTATE_DISTRIBUTION.WILL_VALIDITY.requirements.includes(
      'WITNESSED_BY_TWO_COMPETENT_PERSONS',
    ),
    requiresDating: true,
    witnessEligibility: {
      minAge: WITNESS_RULES.ELIGIBILITY.MIN_AGE,
      cannotBeBeneficiary: WITNESS_RULES.ELIGIBILITY.NOT_BENEFICIARY,
      cannotBeSpouseOfBeneficiary: WITNESS_RULES.ELIGIBILITY.NOT_SPOUSE_OF_BENEFICIARY,
      mustBeCompetent: WITNESS_RULES.ELIGIBILITY.MENTAL_CAPACITY,
      mustBePresent: WITNESS_RULES.SIGNATURE.PRESENCE_OF_TESTATOR,
    },
  },

  // Testator Capacity (Section 7)
  testatorCapacity: {
    minAge: KENYAN_LEGAL_REQUIREMENTS.MINIMUM_TESTATOR_AGE,
    requiresSoundMind: true,
    requiresUnderstanding: true,
    requiresFreeWill: true,
    capacityAssessment: {
      requiredForAges: [80, 85, 90],
      triggers: ['MEMORY_ISSUES', 'COGNITIVE_DECLINE', 'FAMILY_CONCERNS'],
    },
  },

  // Intestate Succession Rules (Part V)
  intestateSuccession: {
    oneSpouseWithChildren: {
      lawSection: INTESTATE_DISTRIBUTION.ONE_SPOUSE_WITH_CHILDREN.lawSection,
      spousePersonalEffects: 'ENTIRE',
      spouseLifeInterest: 'REMAINDER',
      childrenAbsoluteInterest: 'AFTER_SPOUSE_LIFE_INTEREST',
      extinguishesOn:
        INTESTATE_DISTRIBUTION.ONE_SPOUSE_WITH_CHILDREN.distribution.spouse.extinguishesOn,
    },
    multipleSpousesWithChildren: {
      lawSection: POLYGAMY_DISTRIBUTION.lawSection,
      calcMethod: POLYGAMY_DISTRIBUTION.rules.CALC_METHOD,
      distributionMethod: POLYGAMY_DISTRIBUTION.rules.DISTRIBUTION_METHOD,
      unitPerWifeAndChildren: POLYGAMY_DISTRIBUTION.rules.UNIT_PER_WIFE_PLUS_CHILDREN,
    },
    spouseOnly: {
      lawSection: INTESTATE_DISTRIBUTION.SPOUSE_ONLY.lawSection,
      entireEstateToSpouse:
        INTESTATE_DISTRIBUTION.SPOUSE_ONLY.distribution.spouse.share === 'ENTIRE_ESTATE',
      conditions: ['NO_CHILDREN', 'NO_PARENTS', 'NO_SIBLINGS'],
    },
    relativesOnly: {
      lawSection: INTESTATE_DISTRIBUTION.NO_SPOUSE_NO_CHILDREN.lawSection,
      orderOfSuccession: INTESTATE_DISTRIBUTION.NO_SPOUSE_NO_CHILDREN.orderOfPriority,
      equalDivisionWithinClass: true,
    },
    previousGifts: {
      lawSection: INTESTATE_DISTRIBUTION.PREVIOUS_GIFTS.lawSection,
      mustBeAccounted:
        INTESTATE_DISTRIBUTION.PREVIOUS_GIFTS.rule === 'GIFTS_IN_ADVANCEMENT_MUST_BE_ACCOUNTED',
    },
  },

  // Dependant Provision (Section 26-29)
  dependantProvision: {
    dependantDefinition: {
      primary: DEPENDANTS.PRIMARY,
      secondary: DEPENDANTS.SECONDARY,
      special: DEPENDANTS.SPECIAL_DEPENDANTS,
      spouses: DEPENDANTS.PRIMARY.includes('SPOUSE'),
      children: DEPENDANTS.PRIMARY.includes('CHILDREN_BIOLOGICAL'),
      adoptedChildren: DEPENDANTS.PRIMARY.includes('CHILDREN_ADOPTED'),
      illegitimateChildren: DEPENDANTS.PRIMARY.includes('CHILDREN_BORN_OUT_OF_WEDLOCK'),
      posthumousChildren: DEPENDANTS.PRIMARY.includes('POSTHUMOUS_CHILDREN'),
      stepChildren: DEPENDANTS.SECONDARY.includes('STEPCHILDREN'),
      parents: DEPENDANTS.SECONDARY.includes('PARENTS'),
      siblings: DEPENDANTS.SECONDARY.includes('BROTHERS_AND_SISTERS'),
      otherDependants: DEPENDANTS.SPECIAL_DEPENDANTS.length > 0,
      proofRequired: DEPENDANTS.RULES.PROOF_OF_DEPENDENCY_REQUIRED,
      equalTreatment: DEPENDANTS.RULES.EQUAL_TREATMENT_OF_ALL_CHILDREN,
    },
    reasonableProvision: {
      basePercentage: BENEFICIARY_RULES.DEPENDANT_MINIMUM_SHARE,
      additionalPerDependant: 0.05,
      minimumAmount: 100000,
      considerationFactors: [
        'DEPENDANT_AGE',
        'DEPENDANT_HEALTH',
        'DEPENDANT_FINANCIAL_NEEDS',
        'ESTATE_SIZE',
        'OTHER_BENEFICIARIES',
      ],
    },
    courtPowers: {
      canOrderProvision: true,
      canVaryWill: true,
      canCreateTrusts: true,
      timeLimit: 365,
    },
  },

  // Probate Process Rules (Part VI)
  probateProcess: {
    applicationDeadline: SUCCESSION_TIMEFRAMES.PROBATE.APPLICATION_DEADLINE,
    objectionPeriod: SUCCESSION_TIMEFRAMES.PROBATE.OBJECTION_PERIOD,
    grantIssuance: SUCCESSION_TIMEFRAMES.PROBATE.GRANT_ISSUANCE,
    confirmationOfGrant: SUCCESSION_TIMEFRAMES.PROBATE.CONFIRMATION_OF_GRANT,
    distributionDeadline: SUCCESSION_TIMEFRAMES.PROBATE.DISTRIBUTION_DEADLINE,
    grantTypes: {
      probate: {
        requiresWill: true,
        applicant: 'EXECUTOR',
        timeline: SUCCESSION_TIMEFRAMES.PROBATE.GRANT_ISSUANCE,
      },
      lettersOfAdministration: {
        requiresWill: false,
        applicant: 'NEXT_OF_KIN',
        priorityOrder: ['SPOUSE', 'CHILDREN', 'PARENTS', 'SIBLINGS', 'OTHER_RELATIVES'],
        timeline: 120,
      },
    },
    courtJurisdiction: {
      highCourt: {
        threshold: KENYAN_COURTS.HIGH_COURT.THRESHOLD_MIN,
        jurisdiction: KENYAN_COURTS.HIGH_COURT.JURISDICTION,
        complexCases: true,
        locations: KENYAN_COURTS.HIGH_COURT.LOCATIONS,
      },
      magistrateCourt: {
        threshold: KENYAN_COURTS.MAGISTRATE_COURT.THRESHOLD_MAX,
        jurisdiction: KENYAN_COURTS.MAGISTRATE_COURT.JURISDICTION,
        grades: KENYAN_COURTS.MAGISTRATE_COURT.GRADES,
        straightforwardCases: true,
      },
      kadhisCourt: {
        jurisdiction: KENYAN_COURTS.KADHIS_COURT.JURISDICTION,
        applicableLaw: KENYAN_COURTS.KADHIS_COURT.APPLICABLE_LAW,
        limitation: KENYAN_COURTS.KADHIS_COURT.LIMITATION,
        muslimMatters: true,
      },
    },
  },

  // Executor Rules (Part VII)
  executorRules: {
    maxExecutors: ExecutorSystemRules.MAX_EXECUTORS,
    minExecutors: ExecutorSystemRules.MIN_EXECUTORS,
    alternateRequirement: ExecutorSystemRules.ALTERNATE_REQUIREMENT,
    eligibility: {
      minAge: ExecutorSystemRules.ELIGIBILITY.MIN_AGE,
      mentalCapacity: ExecutorSystemRules.ELIGIBILITY.MENTAL_CAPACITY,
      noFelonyConvictions: ExecutorSystemRules.ELIGIBILITY.NO_FELONY_CONVICTIONS,
      kenyanResident: ExecutorSystemRules.ELIGIBILITY.KENYAN_RESIDENT,
    },
    duties: ExecutorSystemRules.DUTIES,
    compensation: {
      minPercentage: ExecutorSystemRules.COMPENSATION.MIN_PERCENTAGE,
      maxPercentage: ExecutorSystemRules.COMPENSATION.MAX_PERCENTAGE,
      courtApprovalRequired: ExecutorSystemRules.COMPENSATION.COURT_APPROVAL_REQUIRED,
    },
    removal: {
      grounds: ['MISMANAGEMENT', 'CONFLICT_OF_INTEREST', 'UNAVAILABILITY', 'INCOMPETENCE', 'FRAUD'],
      process: 'COURT_APPLICATION',
    },
  },

  // Debt Settlement Rules
  debtSettlement: {
    priorityOrder: DEBT_PRIORITY.ORDER,
    allDebtsMustBePaid: DEBT_PRIORITY.rules.ALL_DEBTS_MUST_BE_PAID_BEFORE_DISTRIBUTION,
    proRataForUnsecured: DEBT_PRIORITY.rules.PRO_RATA_FOR_UNSECURED,
    timeLimits: {
      creditorNotification: SUCCESSION_TIMEFRAMES.WILL_EXECUTION.CREDITOR_NOTICE,
      creditorClaims: 90,
      debtPayment: SUCCESSION_TIMEFRAMES.WILL_EXECUTION.DEBT_SETTLEMENT,
    },
    limits: {
      reasonableFuneralExpenses: KENYAN_LEGAL_REQUIREMENTS.FUNERAL_EXPENSE_REASONABLE_CAP,
      administrativeExpenses: 0.05,
    },
  },

  // Distribution Rules
  assetDistribution: {
    timelines: {
      notificationToHeirs: DISTRIBUTION_RULES.TIMEFRAMES.NOTIFICATION_DAYS,
      inventorySubmission: DISTRIBUTION_RULES.TIMEFRAMES.INVENTORY_DAYS,
      distributionCompletion: DISTRIBUTION_RULES.TIMEFRAMES.DISTRIBUTION_DAYS,
      finalAccounts: DISTRIBUTION_RULES.TIMEFRAMES.FINAL_ACCOUNTS_DAYS,
    },
    debtPriority: DISTRIBUTION_RULES.DEBT_PRIORITY,
    minorProtection: {
      trustRequirement: DISTRIBUTION_RULES.MINOR_PROTECTION.TRUST_REQUIREMENT,
      guardianAppointment: DISTRIBUTION_RULES.MINOR_PROTECTION.GUARDIAN_APPOINTMENT,
      ageOfMajority: DISTRIBUTION_RULES.MINOR_PROTECTION.AGE_OF_MAJORITY,
      courtSupervision: true,
      trusteeOptions: MINOR_PROTECTION.MINORS.trustee,
      incapacitatedManagement: MINOR_PROTECTION.INCAPACITATED.management,
    },
    conditionalBequests: {
      maxConditions: BENEFICIARY_RULES.CONDITIONAL_BEQUESTS.MAX_CONDITIONS,
      maxDuration: BENEFICIARY_RULES.CONDITIONAL_BEQUESTS.MAX_CONDITION_DURATION_YEARS,
      allowedConditionTypes: BENEFICIARY_RULES.CONDITIONAL_BEQUESTS.ALLOWED_CONDITION_TYPES,
      validConditions: CONDITIONAL_BEQUESTS.VALID,
      voidConditions: CONDITIONAL_BEQUESTS.VOID,
    },
    beneficiaryRules: {
      minSharePercentage: BENEFICIARY_RULES.MIN_SHARE_PERCENTAGE,
      maxSharePercentage: BENEFICIARY_RULES.MAX_SHARE_PERCENTAGE,
      residuaryRequirement: BENEFICIARY_RULES.RESIDUARY_REQUIREMENT,
      dependantMinimumShare: BENEFICIARY_RULES.DEPENDANT_MINIMUM_SHARE,
      relationshipPriority: BENEFICIARY_RULES.RELATIONSHIP_PRIORITY,
    },
  },

  // Testate Succession Rules
  testateSuccession: {
    willValidity: {
      requirements: TESTATE_DISTRIBUTION.WILL_VALIDITY.requirements,
      allowedForms: TESTATE_DISTRIBUTION.WILL_VALIDITY.allowedForms,
      oralLimitations: TESTATE_DISTRIBUTION.WILL_VALIDITY.oralLimitations,
    },
    willProvisions: {
      specificBequests: TESTATE_DISTRIBUTION.WILL_PROVISIONS.SPECIFIC_BEQUESTS,
      generalBequests: TESTATE_DISTRIBUTION.WILL_PROVISIONS.GENERAL_BEQUESTS,
      residuary: TESTATE_DISTRIBUTION.WILL_PROVISIONS.RESIDUARY,
      conditional: TESTATE_DISTRIBUTION.WILL_PROVISIONS.CONDITIONAL,
    },
    specialRules: {
      lapse: {
        description: TESTATE_DISTRIBUTION.SPECIAL_RULES.LAPSE.description,
        exceptions: TESTATE_DISTRIBUTION.SPECIAL_RULES.LAPSE.exceptions,
      },
      ademption: {
        description: TESTATE_DISTRIBUTION.SPECIAL_RULES.ADEMPTION.description,
      },
      revocation: {
        validMethods: TESTATE_DISTRIBUTION.SPECIAL_RULES.REVOCATION.validMethods,
      },
    },
  },

  // Dispute Resolution Rules
  disputeResolution: {
    validGrounds: DisputeSystemRules.VALID_GROUNDS,
    filingDeadline: DisputeSystemRules.FILING_DEADLINE_DAYS,
    mediationRequired: DisputeSystemRules.MEDIATION_REQUIRED,
    courtHearingDays: DisputeSystemRules.COURT_HEARING_DAYS,
    resolutionMethods: DisputeSystemRules.RESOLUTION_METHODS,
    timeLimits: {
      filingDeadline: SUCCESSION_TIMEFRAMES.DISPUTES.FILING_DEADLINE,
      mediationPeriod: SUCCESSION_TIMEFRAMES.DISPUTES.MEDIATION_PERIOD,
      courtHearing: SUCCESSION_TIMEFRAMES.DISPUTES.COURT_HEARING,
      appealDeadline: 30,
    },
    costAllocation: {
      followsEvent: true,
      courtDiscretion: true,
    },
  },

  // Kenyan Family Law Rules
  familyLaw: {
    marriageTypes: KENYAN_FAMILY_LAW.MARRIAGE_TYPES,
    polygamousMarriageTypes: KENYAN_FAMILY_LAW.POLYGAMOUS_MARRIAGE_TYPES,
    civil: {
      recognition: 'FULL',
      registration: 'MANDATORY',
      polygamy: KENYAN_FAMILY_LAW.CIVIL_MARRIAGE.POLYGAMY_ALLOWED,
      monogamous: KENYAN_FAMILY_LAW.CIVIL_MARRIAGE.MONOGAMOUS_BY_LAW,
    },
    customary: {
      recognition: 'FULL',
      registration: 'RECOMMENDED',
      polygamy: KENYAN_FAMILY_LAW.CUSTOMARY_MARRIAGE.BRIDE_PRICE_OPTIONAL,
      minAge: KENYAN_FAMILY_LAW.CUSTOMARY_MARRIAGE.MINIMUM_AGE,
      consentRequired: KENYAN_FAMILY_LAW.CUSTOMARY_MARRIAGE.CONSENT_REQUIRED,
      bridePriceOptional: KENYAN_FAMILY_LAW.CUSTOMARY_MARRIAGE.BRIDE_PRICE_OPTIONAL,
      registrationDeadline: KENYAN_FAMILY_LAW.CUSTOMARY_MARRIAGE.REGISTRATION_DEADLINE_DAYS,
      requirements: ['FAMILY_CONSENT', 'BRIDE_PRICE', 'COMMUNITY_RECOGNITION'],
    },
    islamic: {
      recognition: 'CONDITIONAL',
      registration: 'MANDATORY',
      polygamy: KENYAN_FAMILY_LAW.ISLAMIC_MARRIAGE.POLYGAMY_ALLOWED,
      maxSpouses: KENYAN_FAMILY_LAW.ISLAMIC_MARRIAGE.MAX_SPOUSES,
      wifeConsentRequired: KENYAN_FAMILY_LAW.ISLAMIC_MARRIAGE.WIFE_CONSENT_REQUIRED,
    },
    generalRules: {
      equalTreatmentOfChildren: KENYAN_FAMILY_LAW.GENERAL_RULES.EQUAL_TREATMENT_OF_CHILDREN,
      proofOfMarriageRequired: KENYAN_FAMILY_LAW.GENERAL_RULES.PROOF_OF_MARRIAGE_REQUIRED,
      cohabitationRecognized: KENYAN_FAMILY_LAW.GENERAL_RULES.COHABITATION_RECOGNIZED_AS_MARRIAGE,
    },
    guardianship: {
      testamentary: {
        allowed: true,
        courtConfirmation: true,
        preference: 'HIGH',
      },
      courtAppointed: {
        criteria: ['CHILD_WELFARE', 'PARENTAL_PREFERENCE', 'GUARDIAN_SUITABILITY'],
        supervision: true,
      },
    },
  },

  // Tax Considerations
  taxation: {
    inheritanceTax: {
      applicable: TAX_CONSIDERATIONS.INHERITANCE_TAX.applicable,
    },
    capitalGainsTax: {
      applicable: TAX_CONSIDERATIONS.CAPITAL_GAINS_TAX.applicable,
      rate: TAX_CONSIDERATIONS.CAPITAL_GAINS_TAX.rate,
      exemptions: TAX_CONSIDERATIONS.CAPITAL_GAINS_TAX.exemptions,
    },
    stampDuty: {
      applicable: TAX_CONSIDERATIONS.STAMP_DUTY.applicable,
      rate: TAX_CONSIDERATIONS.STAMP_DUTY.rate,
      exemptions: TAX_CONSIDERATIONS.STAMP_DUTY.exemptions,
    },
  },

  // Compliance & Penalties
  compliance: {
    willStorage: {
      duration: KENYAN_LEGAL_REQUIREMENTS.WILL_STORAGE_DURATION_YEARS,
      security: 'HIGH',
      accessibility: 'RESTRICTED',
    },
    falseStatements: {
      penalty: 'CRIMINAL_OFFENSE',
      severity: 'FELONY',
      consequences: ['FINE', 'IMPRISONMENT', 'CIVIL_LIABILITY'],
    },
    executorMisconduct: {
      penalties: ['REMOVAL', 'SURCHARGE', 'CRIMINAL_CHARGES', 'PROFESSIONAL_DISCIPLINE'],
      liability: 'PERSONAL',
    },
  },

  // Cultural & Customary Considerations
  culturalConsiderations: {
    bridePrice: {
      recognition: 'CONDITIONAL',
      enforceability: 'LIMITED',
      refundConditions: ['DIVORCE', 'DEATH'],
    },
    clanInheritance: {
      recognition: 'CONDITIONAL',
      supersededBy: 'STATUTORY_LAW',
      application: 'RURAL_AREAS',
    },
    elderParticipation: {
      mediation: 'ENCOURAGED',
      decisionMaking: 'ADVISORY',
      conflictResolution: 'PREFERRED',
    },
  },
}));

// Strongly-typed config type export
export type LegalRulesConfig = ReturnType<typeof legalRulesConfig>;
