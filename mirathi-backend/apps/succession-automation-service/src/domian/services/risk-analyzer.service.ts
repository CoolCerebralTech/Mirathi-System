// =============================================================================
// 3. RISK ANALYZER SERVICE
// Identifies blocking issues and warnings
// =============================================================================
import { Injectable } from '@nestjs/common';

import { SuccessionContext } from '../value-objects/succession-context.vo';

@Injectable()
export class RiskAnalyzerService {
  /**
   * Analyzes data to find risks and blocking issues
   */
  analyzeRisks(data: {
    context: SuccessionContext;
    hasDeathCertificate: boolean;
    hasKraPin: boolean;
    assetsListed: boolean;
    assetsValued: boolean;
    hasWill: boolean;
    willWitnessCount: number;
    hasGuardianForMinors: boolean;
    estateIsInsolvent: boolean;
  }): Array<{
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
    title: string;
    description: string;
    legalBasis?: string;
    isBlocking: boolean;
    resolutionSteps: string[];
  }> {
    const risks: any[] = [];

    // CRITICAL: Death certificate
    if (!data.hasDeathCertificate) {
      risks.push({
        severity: 'CRITICAL',
        category: 'MISSING_DOCUMENT',
        title: 'Death Certificate Missing',
        description: 'Cannot proceed without official death certificate',
        legalBasis: 'S.45 Law of Succession Act - Death must be proven',
        isBlocking: true,
        resolutionSteps: [
          'Obtain death certificate from hospital or Civil Registration',
          'Upload scanned copy to system',
        ],
      });
    }

    // CRITICAL: KRA PIN
    if (!data.hasKraPin) {
      risks.push({
        severity: 'CRITICAL',
        category: 'MISSING_DOCUMENT',
        title: 'KRA PIN Missing',
        description: 'Deceased person must have KRA PIN for tax purposes',
        legalBasis: 'Tax clearance required before grant issuance',
        isBlocking: true,
        resolutionSteps: [
          'Obtain KRA PIN from Kenya Revenue Authority',
          'If never registered, apply for posthumous PIN',
        ],
      });
    }

    // HIGH: Guardian for minors
    if (data.context.hasMinors && !data.hasGuardianForMinors) {
      risks.push({
        severity: 'HIGH',
        category: 'MINOR_WITHOUT_GUARDIAN',
        title: 'No Guardian Appointed for Minor Children',
        description: 'Minor beneficiaries require a legal guardian',
        legalBasis: 'S.70 LSA - Guardian must be appointed for minors',
        isBlocking: false,
        resolutionSteps: [
          'Identify suitable guardian',
          'Obtain guardian consent',
          'File guardianship documents with court',
        ],
      });
    }

    // HIGH: Will witnesses
    if (data.hasWill && data.willWitnessCount < 2) {
      risks.push({
        severity: 'HIGH',
        category: 'WITNESS_ISSUE',
        title: 'Will Has Insufficient Witnesses',
        description: `Will has ${data.willWitnessCount} witness(es), requires 2`,
        legalBasis: 'S.11 LSA - Will must be witnessed by 2 people',
        isBlocking: false,
        resolutionSteps: [
          'Identify 2 eligible witnesses',
          'Witnesses must sign in presence of testator',
          'Witnesses cannot be beneficiaries',
        ],
      });
    }

    // MEDIUM: Asset valuation
    if (data.assetsListed && !data.assetsValued) {
      risks.push({
        severity: 'MEDIUM',
        category: 'MISSING_VALUATION',
        title: 'Assets Not Professionally Valued',
        description: 'Court may require professional valuation for high-value assets',
        legalBasis: 'Professional valuation recommended for assets > KES 500,000',
        isBlocking: false,
        resolutionSteps: [
          'Hire registered valuer',
          'Obtain valuation reports',
          'Upload reports to system',
        ],
      });
    }

    // INFO: Insolvency
    if (data.estateIsInsolvent) {
      risks.push({
        severity: 'HIGH',
        category: 'OTHER',
        title: 'Estate is Insolvent',
        description: 'Debts exceed assets. Special procedures apply.',
        legalBasis: 'S.45 LSA - Creditors must be paid in priority order',
        isBlocking: false,
        resolutionSteps: [
          'List all creditors in priority order',
          'Consider liquidation of assets',
          'May need to involve insolvency practitioner',
        ],
      });
    }

    return risks;
  }
}
