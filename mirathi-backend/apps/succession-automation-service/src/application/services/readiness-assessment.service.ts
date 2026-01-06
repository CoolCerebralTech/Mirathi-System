// =============================================================================
// READINESS SERVICE
// =============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';

import { ReadinessAssessment } from '../../domian/entities/readiness-assessment.entity';
import { RiskFlag } from '../../domian/entities/risk-flag.entity';
import { ContextDetectorService } from '../../domian/services/context-detector.service';
import { ReadinessScorerService } from '../../domian/services/readiness-scorer.service';
import { RiskAnalyzerService } from '../../domian/services/risk-analyzer.service';
import { DocumentServiceAdapter } from '../../infrastructure/adapters/document-service.adapter';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';
import { ReadinessRepository } from '../../infrastructure/repositories/readiness.repository';
import { RiskFlagRepository } from '../../infrastructure/repositories/risk.respository';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly readinessRepo: ReadinessRepository,
    private readonly riskFlagRepo: RiskFlagRepository,
    private readonly contextDetector: ContextDetectorService,
    private readonly readinessScorer: ReadinessScorerService,
    private readonly riskAnalyzer: RiskAnalyzerService,
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
    private readonly documentAdapter: DocumentServiceAdapter,
  ) {}

  /**
   * Check readiness for a specific estate
   */
  async checkReadiness(userId: string, estateId: string) {
    // 1. Fetch data from other services
    const estateData = await this.estateAdapter.getEstateData(estateId);
    const familyData = await this.familyAdapter.getFamilyData(userId);
    const documentData = await this.documentAdapter.getDocumentStatus(userId);

    // 2. Detect succession context
    const context = this.contextDetector.detectContext({
      hasWill: estateData.hasWill,
      religion: familyData.religion,
      marriageType: familyData.isPolygamous ? 'POLYGAMOUS' : 'MONOGAMOUS',
      estateValue: estateData.totalAssets,
      hasMinors: familyData.numberOfMinors > 0,
      numberOfWives: familyData.numberOfSpouses,
      numberOfChildren: familyData.numberOfChildren,
    });

    // 3. Calculate readiness score
    const assetsValued = estateData.assets.every((a) => a.isVerified);

    const score = this.readinessScorer.calculateScore({
      hasDeathCertificate: documentData.hasDeathCertificate,
      hasKraPin: estateData.hasKraPin,
      assetsListed: estateData.assets.length > 0,
      assetsValued,
      debtsListed: estateData.debts.length >= 0,
      hasWill: estateData.hasWill,
      willHasWitnesses: estateData.willWitnessCount >= 2,
      hasExecutor: estateData.hasExecutor,
      hasGuardianForMinors: familyData.hasGuardianForMinors,
      taxClearance: estateData.taxClearance,
      familyConsentsObtained: false, // TODO: Track this
    });

    // 4. Analyze risks
    const risks = this.riskAnalyzer.analyzeRisks({
      context,
      hasDeathCertificate: documentData.hasDeathCertificate,
      hasKraPin: estateData.hasKraPin,
      assetsListed: estateData.assets.length > 0,
      assetsValued,
      hasWill: estateData.hasWill,
      willWitnessCount: estateData.willWitnessCount,
      hasGuardianForMinors: familyData.hasGuardianForMinors,
      estateIsInsolvent: estateData.isInsolvent,
    });

    // 5. Create or update assessment
    let assessment = await this.readinessRepo.findByEstateId(estateId);

    if (!assessment) {
      assessment = ReadinessAssessment.create(userId, estateId, context);
    }

    assessment.updateScore(score);
    assessment.recordCheck();

    // Count risks by severity
    const criticalCount = risks.filter((r) => r.severity === 'CRITICAL').length;
    const highCount = risks.filter((r) => r.severity === 'HIGH').length;
    const mediumCount = risks.filter((r) => r.severity === 'MEDIUM').length;

    assessment.updateRiskCounts(criticalCount, highCount, mediumCount);

    // Generate next steps
    const nextSteps = risks
      .filter((r) => r.isBlocking)
      .flatMap((r) => r.resolutionSteps)
      .slice(0, 5);

    assessment.setNextSteps(nextSteps);

    // 6. Save assessment
    await this.readinessRepo.save(assessment);

    // 7. Delete old risks and create new ones
    await this.riskFlagRepo.deleteByAssessmentId(assessment.id);

    const riskFlags = risks.map((r) =>
      RiskFlag.create(
        assessment.id,
        r.severity,
        r.category,
        r.title,
        r.description,
        r.isBlocking,
        r.resolutionSteps,
      ),
    );

    if (riskFlags.length > 0) {
      await this.riskFlagRepo.saveMany(riskFlags);
    }

    // 8. Return full assessment
    return {
      assessment: assessment.toJSON(),
      risks: riskFlags.map((r) => r.toJSON()),
      context: {
        regime: context.regime,
        religion: context.religion,
        marriageType: context.marriageType,
        targetCourt: context.targetCourt,
        estateValue: context.estateValue,
        isComplexCase: context.isComplexCase(),
      },
    };
  }

  /**
   * Get assessment by estate ID
   */
  async getAssessment(estateId: string) {
    const assessment = await this.readinessRepo.findByEstateId(estateId);

    if (!assessment) {
      throw new NotFoundException('Readiness assessment not found');
    }

    const risks = await this.riskFlagRepo.findByAssessmentId(assessment.id);

    return {
      assessment: assessment.toJSON(),
      risks: risks.map((r) => r.toJSON()),
    };
  }
}
