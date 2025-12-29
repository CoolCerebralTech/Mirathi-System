import { Injectable } from '@nestjs/common';

import { RiskFlag, RiskSeverity } from '../../../domain/entities/risk-flag.entity';
import { ReadinessScore } from '../../../domain/value-objects/readiness-score.vo';
import {
  CourtJurisdiction,
  SuccessionContext,
  SuccessionRegime,
} from '../../../domain/value-objects/succession-context.vo';

@Injectable()
export class StrategyGeneratorService {
  generateStrategy(context: SuccessionContext, score: ReadinessScore, risks: RiskFlag[]): string {
    const court = context.determineCourtJurisdiction();
    const blockingRisks = risks.filter((r) => r.isBlocking && !r.isResolved);
    const highRisks = risks.filter((r) => r.severity === RiskSeverity.HIGH && !r.isResolved);

    let strategy = `## 🏛️ Case Strategy: ${this.getCourtName(court)}\n\n`;

    // 1. Executive Summary
    strategy += `**Status**: ${score.status.replace(/_/g, ' ')} (${score.score}%)\n`;
    strategy += `**Timeline Estimate**: ${this.getTimeline(context)} months\n\n`;

    // 2. Critical Blockers
    if (blockingRisks.length > 0) {
      strategy += `### ⛔ Critical Actions (Blocking Filing)\n`;
      strategy += `You cannot file until these are resolved:\n`;
      blockingRisks.forEach((risk) => {
        strategy += `- **${risk.category}**: ${risk.description}\n`;
        strategy += `  > *Fix*: ${risk.mitigationSteps[0]}\n`;
      });
      strategy += `\n`;
    }

    // 3. Recommended Approach
    strategy += `### 📋 Filing Strategy\n`;
    if (context.requiresKadhisCourt()) {
      strategy += `This is an Islamic Estate. File **Petition for Grant of Representation** in the Kadhi's Court.\n`;
    } else if (context.regime === SuccessionRegime.TESTATE) {
      strategy += `File **Form P&A 1 (Petition for Probate)**. Original Will must be attached.\n`;
    } else {
      strategy += `File **Form P&A 80 (Petition for Letters of Administration)**. Need Chief's Letter.\n`;
    }

    // 4. Specific Warnings
    if (highRisks.length > 0) {
      strategy += `\n### ⚠️ Risk Mitigation\n`;
      highRisks.forEach((risk) => {
        strategy += `- ${risk.description} (Risk: High)\n`;
      });
    }

    return strategy;
  }

  private getCourtName(jurisdiction: CourtJurisdiction): string {
    const names = {
      [CourtJurisdiction.HIGH_COURT]: 'High Court of Kenya',
      [CourtJurisdiction.MAGISTRATE_COURT]: "Resident Magistrate's Court",
      [CourtJurisdiction.KADHIS_COURT]: "Kadhi's Court",
      [CourtJurisdiction.CUSTOMARY_COURT]: 'Customary Court',
      [CourtJurisdiction.FAMILY_DIVISION]: 'High Court (Family Division)',
      [CourtJurisdiction.COMMERCIAL_COURT]: 'Commercial & Tax Division',
    };
    return names[jurisdiction] || jurisdiction;
  }

  private getTimeline(context: SuccessionContext): string {
    if (context.isSimpleCase()) return '3-6';
    if (context.hasDisputedAssets) return '12-24';
    return '6-9';
  }
}
