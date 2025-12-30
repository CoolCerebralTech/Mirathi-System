import { Inject, Injectable, Logger } from '@nestjs/common';
import { DocumentGapType } from 'apps/succession-automation-service/src/domain/value-objects/document-gap.vo';

import { RiskFlag } from '../../../domain/entities/risk-flag.entity';
import { RiskSource } from '../../../domain/value-objects/risk-source.vo';
import { SuccessionContext } from '../../../domain/value-objects/succession-context.vo';
import { I_ESTATE_SERVICE, I_FAMILY_SERVICE } from '../interfaces/adapters.interface';
// FIX: Use 'import type'
import type {
  IEstateServiceAdapter,
  IFamilyServiceAdapter,
} from '../interfaces/adapters.interface';
import { GapAnalysisService } from './gap-analysis.service';

@Injectable()
export class ComplianceRuleEngineService {
  private readonly logger = new Logger(ComplianceRuleEngineService.name);

  constructor(
    @Inject(I_FAMILY_SERVICE) private readonly familyService: IFamilyServiceAdapter,
    @Inject(I_ESTATE_SERVICE) private readonly estateService: IEstateServiceAdapter,
    private readonly gapAnalysis: GapAnalysisService,
  ) {}

  /**
   * Run the full suite of compliance checks
   */
  async runInitialChecks(
    estateId: string,
    familyId: string,
    context: SuccessionContext,
  ): Promise<RiskFlag[]> {
    this.logger.log(`Running compliance checks for Estate: ${estateId}`);
    const risks: RiskFlag[] = [];

    // --- 1. Document Gaps (The Fatal 10) ---
    const gaps = await this.gapAnalysis.identifyGaps(estateId, context);

    for (const gap of gaps) {
      if (gap.type === DocumentGapType.DEATH_CERTIFICATE) {
        risks.push(
          RiskFlag.createMissingDeathCert(estateId, this.createSource('RULE_DEATH_CERT_REQUIRED')),
        );
      } else if (gap.type === DocumentGapType.CHIEF_LETTER) {
        risks.push(
          RiskFlag.createMissingChiefLetter(
            estateId,
            this.createSource('RULE_CHIEF_LETTER_REQUIRED'),
          ),
        );
      } else if (gap.type === DocumentGapType.KRA_PIN_CERTIFICATE) {
        const estateSummary = await this.estateService.getEstateSummary(estateId);
        risks.push(
          RiskFlag.createMissingKraPin(
            estateSummary.deceasedId,
            estateId,
            this.createSource('RULE_KRA_PIN_REQUIRED'),
          ),
        );
      }
    }

    // --- 2. Family & Minor Protections ---
    if (context.isMinorInvolved) {
      const minors = await this.familyService.getMinors(familyId);
      for (const minor of minors) {
        if (!minor.hasGuardian) {
          risks.push(
            RiskFlag.createMinorWithoutGuardian(
              minor.id,
              familyId,
              minor.name,
              this.createSource('RULE_MINOR_GUARDIAN_REQUIRED'),
            ),
          );
        }
      }
    }

    // --- 3. Polygamy Structure ---
    if (context.isSection40Applicable()) {
      const familyStructure = await this.familyService.getFamilyStructure(familyId);
      // Mock logic: assuming check returns false for this example
      const isStructureDefined = false;
      if (!isStructureDefined) {
        risks.push(
          RiskFlag.createUndefinedPolygamousStructure(
            familyId,
            familyStructure.wifeCount,
            this.createSource('RULE_POLYGAMOUS_HOUSES_REQUIRED'),
          ),
        );
      }
    }

    // --- 4. Estate Solvency ---
    if (context.isEstateInsolvent) {
      const estateSummary = await this.estateService.getEstateSummary(estateId);
      risks.push(
        RiskFlag.createInsolventEstate(
          estateId,
          estateSummary.grossValue,
          estateSummary.totalDebts,
          this.createSource('RULE_ESTATE_SOLVENCY_REQUIRED'),
        ),
      );
    }

    // --- 5. Will Validity ---
    const willInfo = await this.estateService.getWillDetails(estateId);
    if (willInfo.exists && (willInfo.witnessCount || 0) < 2) {
      risks.push(
        RiskFlag.createInvalidWillSignature(
          willInfo.willId!,
          willInfo.witnessCount || 0,
          this.createSource('RULE_WILL_WITNESSES_REQUIRED'),
        ),
      );
    }

    return risks;
  }

  private createSource(ruleId: string): RiskSource {
    return RiskSource.fromComplianceEngine(
      ruleId,
      [{ act: 'LSA', section: 'N/A', description: 'Automated Rule', isMandatory: true }],
      false,
      0.99,
    );
  }
}
