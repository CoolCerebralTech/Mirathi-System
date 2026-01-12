// apps/succession-automation-service/src/application/services/succession-assessment.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CourtJurisdiction,
  MarriageType,
  ReadinessStatus,
  SuccessionRegime,
  SuccessionReligion,
} from '@prisma/client';

import { ExecutorRoadmap } from '../../domain/entities/executor-roadmap.entity';
import { ProbatePreview } from '../../domain/entities/probate-preview.entity';
import { ReadinessAssessment } from '../../domain/entities/readiness-assessment.entity';
import { RiskFlag } from '../../domain/entities/risk-flag.entity';
import type { IProbatePreviewRepository } from '../../domain/repositories/probate-preview.repository';
import { PROBATE_PREVIEW_REPO } from '../../domain/repositories/probate-preview.repository';
import type { IReadinessAssessmentRepository } from '../../domain/repositories/readiness.repository';
import { READINESS_ASSESSMENT_REPO } from '../../domain/repositories/readiness.repository';
import type { IExecutorRoadmapRepository } from '../../domain/repositories/roadmap.repository';
import { EXECUTOR_ROADMAP_REPO } from '../../domain/repositories/roadmap.repository';
import { ReadinessCalculatorService } from '../../domain/services/readiness-calculator.service';
import { RoadmapFactoryService } from '../../domain/services/roadmap-factory.service';
import { AssetSummary } from '../../domain/value-objects/asset-summary.vo';
import { LegalRequirement } from '../../domain/value-objects/legal-requirement.vo';
import { ReadinessScore } from '../../domain/value-objects/readiness-score.vo';
import { SuccessionContext } from '../../domain/value-objects/succession-context.vo';
import { DocumentServiceAdapter } from '../../infrastructure/adapters/document-service.adapter';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';

export interface SuccessionAssessmentResult {
  assessment: ReadinessAssessment;
  context: SuccessionContext;
  score: ReadinessScore;
  risks: RiskFlag[];
  roadmap?: ExecutorRoadmap;
  preview?: ProbatePreview;
}

@Injectable()
export class SuccessionAssessmentService {
  constructor(
    private readonly documentAdapter: DocumentServiceAdapter,
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
    private readonly readinessCalculator: ReadinessCalculatorService,
    private readonly roadmapFactory: RoadmapFactoryService,

    @Inject(READINESS_ASSESSMENT_REPO)
    private readonly assessmentRepo: IReadinessAssessmentRepository,

    @Inject(EXECUTOR_ROADMAP_REPO)
    private readonly roadmapRepo: IExecutorRoadmapRepository,

    @Inject(PROBATE_PREVIEW_REPO)
    private readonly previewRepo: IProbatePreviewRepository,
  ) {}

  /**
   * Main entry point: Creates or updates a succession assessment
   */
  async assessSuccession(userId: string, estateId: string): Promise<SuccessionAssessmentResult> {
    // 1. Gather data from external services
    const [estateData, familyData, documentData] = await Promise.all([
      this.estateAdapter.getEstateData(estateId),
      this.familyAdapter.getFamilyData(userId),
      this.documentAdapter.getDocumentStatus(userId),
    ]);

    // 2. Create Succession Context
    const context = new SuccessionContext(
      estateData.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      familyData.religion,
      familyData.marriageType,
      estateData.totalAssets,
      familyData.hasMinors,
      familyData.isPolygamous,
      familyData.numberOfSpouses,
      familyData.numberOfChildren,
    );

    // 3. Prepare assessment input
    const assessmentInput = {
      hasDeathCertificate: documentData.hasDeathCertificate,
      hasKraPin: documentData.hasKraPin || estateData.hasKraPin,
      assetsListed: estateData.assets.length > 0,
      assetsValued: estateData.assets.every((a) => a.estimatedValue > 0),
      debtsListed: estateData.debts.length > 0,
      hasWill: estateData.hasWill,
      willWitnessCount: estateData.willWitnessCount,
      hasExecutor: estateData.hasExecutor,
      hasGuardianForMinors: familyData.hasGuardianForMinors,
      taxClearance: estateData.taxClearance,
      familyConsentsObtained: documentData.hasFamilyConsent,
      estateIsInsolvent: estateData.isInsolvent,
    };

    // 4. Calculate readiness
    const { score, risks } = this.readinessCalculator.calculate(context, assessmentInput);

    // 5. Create or update assessment
    let assessment = await this.assessmentRepo.findByEstateId(estateId);

    if (!assessment) {
      assessment = ReadinessAssessment.create(userId, estateId, context);
    }

    // Update assessment with new scores and risks
    assessment.updateScore(score);
    assessment.updateRiskProfile(risks);

    // 6. Save assessment and risks
    await this.assessmentRepo.save(assessment);
    await this.assessmentRepo.saveRisks(risks);

    // 7. Create roadmap if score > 0
    let roadmap: ExecutorRoadmap | undefined;
    if (score.overall > 0) {
      roadmap = await this.getOrCreateRoadmap(userId, estateId, context, assessment.id);
    }

    // 8. Create preview if ready
    let preview: ProbatePreview | undefined;
    if (score.canGenerateForms()) {
      preview = await this.getOrCreatePreview(
        userId,
        estateId,
        context,
        score.overall,
        assessment.id,
      );
    }

    return {
      assessment,
      context,
      score,
      risks,
      roadmap,
      preview,
    };
  }

  /**
   * Quick assessment for dashboard display
   */
  async getQuickAssessment(userId: string, estateId: string) {
    const result = await this.assessSuccession(userId, estateId);

    return {
      score: result.score.overall,
      status: result.assessment.status,
      nextStep: this.getNextStep(result.risks, result.context),
      criticalRisks: result.risks.filter((r) => r.severity === 'CRITICAL').length,
      estimatedDays: this.estimateTimeline(result.context),
    };
  }

  /**
   * Resolves a risk flag (marks as resolved)
   */
  async resolveRisk(assessmentId: string, riskId: string) {
    const risks = await this.assessmentRepo.getRisks(assessmentId);
    const risk = risks.find((r) => r.id === riskId);

    if (!risk) {
      throw new NotFoundException(`Risk with ID ${riskId} not found`);
    }

    risk.resolve();
    await this.assessmentRepo.saveRisks([risk]);

    // Recalculate assessment after risk resolution
    const assessment = await this.assessmentRepo
      .findByEstateId
      // We need to get assessment to find estateId, but our repo doesn't have this method
      // For now, we'll skip auto-recalculation
      ();

    return risk;
  }

  /**
   * Gets legal requirements for the succession regime
   */
  getLegalRequirements(context: SuccessionContext): LegalRequirement[] {
    return LegalRequirement.createStandardRequirements().filter((req) =>
      req.appliesTo(context.regime),
    );
  }

  /**
   * Gets asset summary for the estate
   */
  async getAssetSummary(estateId: string): Promise<AssetSummary> {
    const estateData = await this.estateAdapter.getEstateData(estateId);

    const assetSimple = estateData.assets.map((a) => ({
      category: a.category,
      value: a.estimatedValue,
      status: a.isVerified ? 'VERIFIED' : 'ACTIVE', // Map to AssetStatus
      isEncumbered: a.isEncumbered,
    }));

    return new AssetSummary(estateData.totalAssets, estateData.totalDebts, assetSimple);
  }

  // --- Private Helper Methods ---

  private async getOrCreateRoadmap(
    userId: string,
    estateId: string,
    context: SuccessionContext,
    assessmentId?: string,
  ): Promise<ExecutorRoadmap> {
    let roadmap = await this.roadmapRepo.findByEstateId(estateId);

    if (!roadmap) {
      roadmap = ExecutorRoadmap.create(userId, estateId, context);
      if (assessmentId) {
        // Add assessmentId if we have it
        const props = roadmap.toJSON();
        roadmap = ExecutorRoadmap.fromPersistence({
          ...props,
          assessmentId,
        });
      }

      // Generate initial tasks
      const tasks = this.roadmapFactory.generateTasks(roadmap.id, context);
      roadmap.updateProgress(0, tasks.length);

      await this.roadmapRepo.save(roadmap);
      await this.roadmapRepo.saveTasks(tasks);
    }

    return roadmap;
  }

  private async getOrCreatePreview(
    userId: string,
    estateId: string,
    context: SuccessionContext,
    readinessScore: number,
    assessmentId?: string,
  ): Promise<ProbatePreview> {
    let preview = await this.previewRepo.findByEstateId(estateId);

    if (!preview) {
      preview = ProbatePreview.create(userId, estateId, context, readinessScore);
      await this.previewRepo.save(preview);
    } else {
      preview.updateReadiness(readinessScore);
      await this.previewRepo.save(preview);
    }

    return preview;
  }

  private getNextStep(risks: RiskFlag[], context: SuccessionContext): string {
    const criticalRisks = risks.filter((r) => r.isBlocking && !r.isResolved);

    if (criticalRisks.length > 0) {
      return `RESOLVE_CRITICAL_RISK: ${criticalRisks[0].title}`;
    }

    if (context.regime === SuccessionRegime.INTESTATE) {
      return 'OBTAIN_CHIEFS_LETTER';
    }

    if (context.requiresGuardianship()) {
      return 'APPOINT_GUARDIAN_FOR_MINORS';
    }

    return 'PREPARE_PETITION_DOCUMENTS';
  }

  private estimateTimeline(context: SuccessionContext): number {
    let days = 90; // Base timeline

    if (context.isComplexCase()) days += 60;
    if (context.targetCourt === CourtJurisdiction.HIGH_COURT) days += 30;
    if (context.isPolygamous) days += 60;
    if (context.hasMinors) days += 90;

    return days;
  }
}
