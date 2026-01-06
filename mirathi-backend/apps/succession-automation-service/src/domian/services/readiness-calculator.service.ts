import { MarriageType, RiskCategory, RiskSeverity, SuccessionRegime } from '@prisma/client';

import { RiskFlag } from '../entities/risk-flag.entity';
import { ReadinessScore } from '../value-objects/readiness-score.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

export interface AssessmentInput {
  hasDeathCertificate: boolean;
  hasKraPin: boolean;
  assetsListed: boolean;
  assetsValued: boolean;
  debtsListed: boolean;
  hasWill: boolean;
  willWitnessCount: number;
  hasExecutor: boolean;
  hasGuardianForMinors: boolean;
  taxClearance: boolean;
  familyConsentsObtained: boolean;
  estateIsInsolvent: boolean;
}

export class ReadinessCalculatorService {
  /**
   * Main entry point to calculate the state of readiness.
   */
  public calculate(
    context: SuccessionContext,
    input: AssessmentInput,
  ): {
    score: ReadinessScore;
    risks: RiskFlag[];
  } {
    const risks = this.analyzeRisks(context, input);
    const score = this.calculateScore(context, input, risks);

    return { score, risks };
  }

  /**
   * Analyzes data to find risks and blocking issues based on Kenyan Law.
   */
  private analyzeRisks(context: SuccessionContext, input: AssessmentInput): RiskFlag[] {
    const risks: RiskFlag[] = [];
    const assessmentId = 'temp'; // UUID would be assigned by Entity

    // 1. Critical Documents
    if (!input.hasDeathCertificate) {
      risks.push(
        RiskFlag.create(
          assessmentId,
          RiskSeverity.CRITICAL,
          RiskCategory.MISSING_DOCUMENT,
          'Death Certificate Missing',
          'Cannot proceed without official death certificate (Cap 160 Rule 7).',
          'S.45 Law of Succession Act',
          true, // Blocking
          ['Obtain original death certificate', 'Scan and upload'],
        ),
      );
    }

    if (!input.hasKraPin) {
      risks.push(
        RiskFlag.create(
          assessmentId,
          RiskSeverity.CRITICAL,
          RiskCategory.MISSING_DOCUMENT,
          'Deceased KRA PIN Missing',
          'Deceased person must have KRA PIN for tax compliance.',
          'Tax Procedures Act',
          true,
          ['Search iTax for existing PIN', 'Apply for posthumous PIN'],
        ),
      );
    }

    // 2. Intestate Specifics
    if (context.regime === SuccessionRegime.INTESTATE) {
      if (!input.familyConsentsObtained && (context.numberOfChildren > 0 || context.isPolygamous)) {
        risks.push(
          RiskFlag.create(
            assessmentId,
            RiskSeverity.HIGH,
            RiskCategory.FAMILY_DISPUTE, // Mapped correctly
            'Family Consents Missing',
            'All adults in household must consent to the administrator (Form P&A 38).',
            'Probate & Administration Rule 26(1)',
            true,
            ['Download Form P&A 38', 'Have all adults sign', 'Witness signatures'],
          ),
        );
      }
    }

    // 3. Minors & Guardianship
    if (context.hasMinors && !input.hasGuardianForMinors) {
      risks.push(
        RiskFlag.create(
          assessmentId,
          RiskSeverity.HIGH,
          RiskCategory.MINOR_WITHOUT_GUARDIAN,
          'Guardian Required for Minors',
          'Minors cannot hold property directly; a life interest must be created.',
          'Section 35 & 70 Law of Succession Act',
          false, // Not strictly blocking filing, but blocking Grant
          ['Identify guardian', 'Draft consent', 'Include in Petition'],
        ),
      );
    }

    // 4. Will Validity
    if (context.regime === SuccessionRegime.TESTATE && input.willWitnessCount < 2) {
      risks.push(
        RiskFlag.create(
          assessmentId,
          RiskSeverity.HIGH,
          RiskCategory.INVALID_DOCUMENT,
          'Will Invalid (Witnesses)',
          `Will has ${input.willWitnessCount} witness(es), requires at least 2.`,
          'Section 11 Law of Succession Act',
          true, // Blocking probate
          ['Locate witnesses to sign affidavit', 'Prove handwriting if witnesses deceased'],
        ),
      );
    }

    return risks;
  }

  /**
   * Calculates the weighted score (0-100).
   */
  private calculateScore(
    context: SuccessionContext,
    input: AssessmentInput,
    risks: RiskFlag[],
  ): ReadinessScore {
    let docScore = 0; // Max 30
    let legalScore = 0; // Max 30
    let famScore = 0; // Max 20
    let finScore = 0; // Max 20

    // --- DOCUMENTS (30) ---
    if (input.hasDeathCertificate) docScore += 10;
    if (input.hasKraPin) docScore += 10;
    if (input.assetsListed) docScore += 5;
    if (input.debtsListed) docScore += 5;

    // --- LEGAL (30) ---
    if (context.regime === SuccessionRegime.TESTATE) {
      if (input.hasWill) legalScore += 10;
      if (input.willWitnessCount >= 2) legalScore += 10;
      if (input.hasExecutor) legalScore += 10;
    } else {
      // Intestate is "legally ready" if you accept intestacy rules
      legalScore += 20;
      // But you need a Chief's letter usually
      // We assume basic readiness here
      if (!risks.some((r) => r.category === RiskCategory.JURISDICTION_ISSUE)) legalScore += 10;
    }

    // --- FAMILY (20) ---
    if (input.familyConsentsObtained) famScore += 20;
    // If single/no family, free points
    if (
      context.numberOfChildren === 0 &&
      !context.isPolygamous &&
      context.marriageType === MarriageType.SINGLE
    ) {
      famScore = 20;
    }

    // --- FINANCIAL (20) ---
    if (input.assetsValued) finScore += 10;
    if (input.taxClearance) finScore += 10;

    return ReadinessScore.compute(docScore, legalScore, famScore, finScore);
  }
}
