// src/domain/services/kenyan-succession-rules.service.ts
import { Injectable } from '@nestjs/common';
import { CourtJurisdiction, KenyanFormType } from '@prisma/client';

import { Money } from '../value-objects/money.vo';

@Injectable()
export class KenyanSuccessionRulesService {
  // 1. DETERMINE CORRECT FORM (The "Digital Lawyer" Logic)
  recommendProbateForm(
    hasWill: boolean,
    netWorth: number,
  ): { form: KenyanFormType; explanation: string } {
    // Scenario A: Small Estate (< 500k KES) - Summary Administration
    if (netWorth <= 500_000) {
      return {
        form: KenyanFormType.PA5_SUMMARY,
        explanation:
          'Estate value is under KES 500,000. You qualify for Summary Administration (Section 49 LSA). This is faster and cheaper.',
      };
    }

    // Scenario B: With Will
    if (hasWill) {
      return {
        form: KenyanFormType.PA1_PROBATE,
        explanation: 'A valid will exists. You must file a Petition for Probate (PA1).',
      };
    }

    // Scenario C: Intestate (No Will)
    return {
      form: KenyanFormType.PA80_INTESTATE,
      explanation: 'No will found. You must file for Letters of Administration Intestate (PA80).',
    };
  }

  // 2. DETERMINE COURT JURISDICTION
  determineJurisdiction(netWorth: number): CourtJurisdiction {
    // Current practice: Estates > 1M usually go to High Court, but Magistrates have expanded jurisdiction.
    // For safety in this system:
    if (netWorth > 1_000_000) {
      return CourtJurisdiction.HIGH_COURT;
    }
    return CourtJurisdiction.MAGISTRATE_COURT;
  }

  // 3. CALCULATE ESTIMATED COURT FEES (Innovative Feature)
  // Note: These are estimates based on the Judiciary filing schedule
  estimateCourtFees(netWorth: number, formType: KenyanFormType): Money {
    let baseFee = 0;

    // Gazettement Fee (Approx 3,000 - 5,000)
    const gazetteFee = 4000;

    switch (formType) {
      case KenyanFormType.PA5_SUMMARY:
        baseFee = 1000; // Cheaper
        break;
      case KenyanFormType.PA1_PROBATE:
      case KenyanFormType.PA80_INTESTATE:
        baseFee = 2000; // Petition fee
        break;
    }

    // Ad Valorem Assessment could go here for very large estates
    return new Money(baseFee + gazetteFee);
  }
}
