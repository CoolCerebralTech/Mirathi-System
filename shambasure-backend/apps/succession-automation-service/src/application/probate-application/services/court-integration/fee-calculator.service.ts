import { Injectable } from '@nestjs/common';

import { ProbateApplication } from '../../../../domain/aggregates/probate-application.aggregate';

/**
 * Fee Calculator Service
 *
 * RESPONSIBILITIES:
 * 1. Calculate Court Filing Fees (Petition + Affidavits).
 * 2. Calculate Service Fees (Gazette notice).
 * 3. Calculate Professional/Platform Fees.
 */

@Injectable()
export class FeeCalculatorService {
  public calculateTotalFilingCost(application: ProbateApplication): {
    courtFees: number;
    gazetteFee: number;
    serviceFee: number;
    total: number;
    breakdown: any[];
  } {
    const context = application.successionContext;
    const forms = application.forms; // These are GeneratedForm entities

    let courtFees = 0;
    const breakdown: any[] = [];

    // 1. Base Jurisdiction Fee
    const baseFee = 1000; // Simplified
    courtFees += baseFee;
    breakdown.push({ item: 'Court Filing Base Fee', amount: baseFee });

    // 2. Form Specific Fees
    // We map GeneratedForm back to VO logic for cost
    // Note: Ideally, GeneratedForm stores its own cost snapshot,
    // but here we recalculate for dynamic accuracy.
    forms.forEach((form) => {
      // In a real app, we'd hydrate the VO to call getEstimatedCost
      // For now, we simulate basic logic
      let formCost = 0;
      if (form.formCode.includes('Petition')) formCost = 1000;
      else if (form.formCode.includes('Affidavit')) formCost = 500;

      if (formCost > 0) {
        courtFees += formCost;
        breakdown.push({ item: `Filing: ${form.formCode}`, amount: formCost });
      }
    });

    // 3. Gazette Fee (Standard)
    const gazetteFee = context.requiresGazetteNotice() ? 2800 : 0; // KES 2,800 is 2024 rate
    if (gazetteFee > 0) {
      breakdown.push({ item: 'Kenya Gazette Notice', amount: gazetteFee });
    }

    // 4. Platform Service Fee
    const serviceFee = 5000; // Example platform fee
    breakdown.push({ item: 'Platform Automation Fee', amount: serviceFee });

    return {
      courtFees,
      gazetteFee,
      serviceFee,
      total: courtFees + gazetteFee + serviceFee,
      breakdown,
    };
  }
}
