import { registerAs } from '@nestjs/config';

/**
 * Kenyan Legal Rules Configuration
 * Based on Law of Succession Act Cap 160 and related legislation
 */
export const legalRulesConfig = registerAs('legalRules', () => ({
  // Will Formalities (Section 11)
  willFormalities: {
    minWitnesses: 2,
    maxWitnesses: 5,
    requiresWriting: true,
    requiresTestatorSignature: true,
    requiresWitnessAttestation: true,
    requiresDating: true,
    witnessEligibility: {
      minAge: 18,
      cannotBeBeneficiary: true,
      cannotBeSpouseOfBeneficiary: true,
      mustBeCompetent: true,
      mustBePresent: true,
    },
  },

  // Testator Capacity (Section 7)
  testatorCapacity: {
    minAge: 18,
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
      spousePersonalEffects: 0.1,
      spouseLifeInterest: 0.9,
      childrenAbsoluteInterest: 0.9,
    },
    multipleSpousesWithChildren: {
      spousePersonalEffects: 0.1,
      spouseLifeInterest: 0.9,
      childrenAbsoluteInterest: 0.9,
      equalDivisionAmongSpouses: true,
    },
    spouseOnly: {
      entireEstateToSpouse: true,
      conditions: ['NO_CHILDREN', 'NO_PARENTS', 'NO_SIBLINGS'],
    },
    relativesOnly: {
      orderOfSuccession: [
        'PARENTS',
        'SIBLINGS',
        'HALF_SIBLINGS',
        'GRANDPARENTS',
        'AUNTS_UNCLES',
        'COUSINS',
      ],
      equalDivisionWithinClass: true,
    },
  },

  // Dependant Provision (Section 26-29)
  dependantProvision: {
    dependantDefinition: {
      spouses: true,
      children: true,
      adoptedChildren: true,
      stepChildren: true,
      parents: true,
      otherDependants: true,
    },
    reasonableProvision: {
      basePercentage: 0.3,
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
    applicationDeadline: 180,
    objectionPeriod: 30,
    grantTypes: {
      probate: {
        requiresWill: true,
        applicant: 'EXECUTOR',
        timeline: 90,
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
        threshold: 5000000,
        complexCases: true,
        allCounties: true,
      },
      magistrateCourt: {
        threshold: 5000000,
        straightforwardCases: true,
        specificCounties: true,
      },
      kadhisCourt: {
        muslimMatters: true,
        applicableLaw: 'MUSLIM_LAW',
      },
    },
  },

  // Executor Rules (Part VII)
  executorRules: {
    eligibility: {
      minAge: 18,
      mentalCapacity: true,
      noFelonyConvictions: true,
      canBeNonResident: true,
      canBeCorporate: true,
    },
    duties: [
      'LOCATE_WILL',
      'NOTIFY_HEIRS',
      'INVENTORY_ASSETS',
      'MANAGE_ASSETS',
      'PAY_DEBTS',
      'FILE_TAXES',
      'DISTRIBUTE_ASSETS',
      'FILE_ACCOUNTS',
      'CLOSE_ESTATE',
    ],
    compensation: {
      allowed: true,
      minPercentage: 0.01,
      maxPercentage: 0.05,
      defaultPercentage: 0.03,
      courtApprovalRequired: true,
      factors: ['ESTATE_SIZE', 'COMPLEXITY', 'TIME_SPENT', 'RESULTS_ACHIEVED'],
    },
    removal: {
      grounds: ['MISMANAGEMENT', 'CONFLICT_OF_INTEREST', 'UNAVAILABILITY', 'INCOMPETENCE', 'FRAUD'],
      process: 'COURT_APPLICATION',
    },
  },

  // Debt Settlement Rules
  debtSettlement: {
    priorityOrder: [
      'FUNERAL_EXPENSES',
      'TAX_OBLIGATIONS',
      'SECURED_DEBTS',
      'UNADJUDICATED_DEBTS',
      'UNSECURED_DEBTS',
    ],
    timeLimits: {
      creditorNotification: 30,
      creditorClaims: 90,
      debtPayment: 180,
    },
    limits: {
      reasonableFuneralExpenses: 500000,
      administrativeExpenses: 0.05,
    },
  },

  // Distribution Rules
  assetDistribution: {
    timelines: {
      notificationToHeirs: 30,
      inventorySubmission: 90,
      distributionCompletion: 365,
      finalAccounts: 180,
    },
    minorProtection: {
      trustRequirement: true,
      guardianAppointment: true,
      ageOfMajority: 18,
      courtSupervision: true,
    },
    conditionalBequests: {
      maxConditions: 5,
      maxDuration: 25,
      allowedConditionTypes: ['AGE_REQUIREMENT', 'EDUCATION', 'MARRIAGE', 'SURVIVAL', 'OCCUPATION'],
    },
  },

  // Dispute Resolution Rules
  disputeResolution: {
    validGrounds: [
      'UNDUE_INFLUENCE',
      'LACK_CAPACITY',
      'FRAUD',
      'FORGERY',
      'IMPROPER_EXECUTION',
      'OMITTED_HEIR',
      'AMBIGUOUS_TERMS',
    ],
    timeLimits: {
      filingDeadline: 60,
      mediationPeriod: 90,
      courtHearing: 180,
      appealDeadline: 30,
    },
    resolutionMethods: ['MEDIATION', 'ARBITRATION', 'COURT_PROCEEDING', 'SETTLEMENT'],
    costAllocation: {
      followsEvent: true,
      courtDiscretion: true,
    },
  },

  // Kenyan Family Law Rules
  familyLaw: {
    marriageTypes: {
      civil: {
        recognition: 'FULL',
        registration: 'MANDATORY',
        polygamy: 'NOT_ALLOWED',
      },
      customary: {
        recognition: 'FULL',
        registration: 'RECOMMENDED',
        polygamy: 'ALLOWED',
        requirements: ['FAMILY_CONSENT', 'BRIDE_PRICE', 'COMMUNITY_RECOGNITION'],
      },
      religious: {
        recognition: 'CONDITIONAL',
        registration: 'MANDATORY',
        polygamy: 'CONDITIONAL',
      },
    },
    polygamousMarriages: {
      maxSpouses: 4,
      equalTreatment: true,
      consentRequired: true,
      financialDisclosure: true,
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

  // Compliance & Penalties
  compliance: {
    willStorage: {
      duration: 25,
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
