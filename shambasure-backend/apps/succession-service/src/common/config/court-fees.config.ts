import { registerAs } from '@nestjs/config';
import { TAX_CONSIDERATIONS } from '../constants/distribution-rules.constants';

/**
 * Kenyan Court Fees Configuration
 * Based on the Advocates Remuneration Order and Court Fees Act
 */

export const courtFeesConfig = registerAs('courtFees', () => ({
  // Probate Court Fees Structure
  probateFees: {
    // Filing Fees
    filingFee: {
      highCourt: 2000,
      magistrateCourt: 1000,
      kadhisCourt: 500,
    },

    // Ad Valorem Fees (percentage of estate value)
    adValorem: {
      tiers: [
        {
          range: { min: 0, max: 100000 },
          rate: 0,
          minFee: 0,
          maxFee: 0,
        },
        {
          range: { min: 100001, max: 500000 },
          rate: 0.005,
          minFee: 500,
          maxFee: 2500,
        },
        {
          range: { min: 500001, max: 1000000 },
          rate: 0.01,
          minFee: 2500,
          maxFee: 10000,
        },
        {
          range: { min: 1000001, max: 5000000 },
          rate: 0.015,
          minFee: 10000,
          maxFee: 75000,
        },
        {
          range: { min: 5000001, max: 10000000 },
          rate: 0.02,
          minFee: 75000,
          maxFee: 200000,
        },
        {
          range: { min: 10000001, max: Infinity },
          rate: 0.025,
          minFee: 200000,
          maxFee: null,
        },
      ],
    },

    // Miscellaneous Fees
    miscellaneous: {
      affidavitFees: {
        generalAffidavit: 500,
        supportingAffidavit: 300,
        protestAffidavit: 1000,
      },
      processFees: {
        summons: 200,
        notice: 100,
        citation: 300,
      },
      certificateFees: {
        grantOfProbate: 1000,
        lettersOfAdministration: 1000,
        certifiedCopy: 500,
        resealing: 2000,
      },
      serviceFees: {
        processServer: 1000,
        newspaperAdvertisement: 5000,
        gazetteNotice: 10000,
      },
    },
  },

  // High Court Specific Fees
  highCourt: {
    jurisdictionFee: 5000,
    hearingFees: {
      mention: 1000,
      directions: 2000,
      fullHearing: 5000,
      ruling: 3000,
    },
    documentFees: {
      petitionFiling: 2000,
      affidavitFiling: 500,
      submissionFiling: 1000,
    },
  },

  // Magistrate Court Specific Fees
  magistrateCourt: {
    jurisdictionFee: 2000,
    hearingFees: {
      mention: 500,
      directions: 1000,
      fullHearing: 3000,
      ruling: 1500,
    },
    documentFees: {
      applicationFiling: 1000,
      affidavitFiling: 300,
      submissionFiling: 500,
    },
  },

  // Kadhis Court Specific Fees
  kadhisCourt: {
    jurisdictionFee: 1000,
    hearingFees: {
      mention: 300,
      directions: 500,
      fullHearing: 2000,
      ruling: 1000,
    },
    documentFees: {
      applicationFiling: 500,
      affidavitFiling: 200,
      submissionFiling: 300,
    },
  },

  // Advocate Fees (Guideline)
  advocateFees: {
    probateMatters: {
      simpleEstate: {
        min: 50000,
        max: 200000,
        factors: ['ESTATE_SIZE', 'COMPLEXITY'],
      },
      mediumEstate: {
        min: 200000,
        max: 500000,
        factors: ['ESTATE_SIZE', 'COMPLEXITY', 'DISPUTES'],
      },
      complexEstate: {
        min: 500000,
        max: 2000000,
        factors: ['ESTATE_SIZE', 'COMPLEXITY', 'DISPUTES', 'DURATION'],
      },
    },
    hourlyRates: {
      partner: 15000,
      associate: 8000,
      legalAssistant: 4000,
    },
    disbursements: {
      courtFees: 'ACTUAL',
      processServer: 'ACTUAL',
      advertisements: 'ACTUAL',
      travel: 'ACTUAL',
    },
  },

  // Government Levies and Taxes
  governmentLevies: {
    stampDuty: {
      probate: 0,
      administration: 0,
      transfers: TAX_CONSIDERATIONS.STAMP_DUTY.rate,
    },
    capitalGainsTax: {
      rate: TAX_CONSIDERATIONS.CAPITAL_GAINS_TAX.rate,
      exemptions: ['PRINCIPAL_RESIDENCE', 'SMALL_ESTATES'],
    },
    incomeTax: {
      estateIncome: 0.3,
      finalReturn: true,
    },
  },

  // Fee Waivers and Concessions
  feeConcessions: {
    indigentPersons: {
      eligibility: 'INCOME_BASED',
      discount: 1.0,
      documentation: ['AFFIDAVIT', 'CHIEF_LETTER'],
    },
    seniorCitizens: {
      eligibility: 'AGE_BASED',
      minAge: 60,
      discount: 0.5,
    },
    personsWithDisabilities: {
      eligibility: 'DISABILITY_BASED',
      discount: 0.5,
      documentation: ['DISABILITY_CARD'],
    },
  },

  // Payment Methods and Terms
  payment: {
    methods: ['CASH', 'BANKERS_CHECK', 'MPESA', 'BANK_TRANSFER'],
    deadlines: {
      filingFee: 'BEFORE_FILING',
      adValorem: 'WITHIN_30_DAYS',
      miscellaneous: 'AS_INCURRED',
    },
    penalties: {
      latePayment: 0.1,
      dishonoredCheck: 2000,
    },
  },

  // Fee Calculation Rules
  calculationRules: {
    estateValueBasis: 'GROSS_VALUE',
    exclusions: ['JOINTLY_OWNED_ASSETS', 'NOMINATED_ASSETS', 'TRUST_ASSETS'],
    rounding: 'NEAREST_100',
    currency: 'KES',
  },

  // Historical Fee Adjustments
  feeAdjustments: {
    lastRevision: new Date('2023-01-01'),
    revisionFrequency: 'ANNUAL',
    inflationAdjustment: true,
    adjustmentFactor: 1.05,
  },
}));

export type CourtFeesConfig = ReturnType<typeof courtFeesConfig>;
