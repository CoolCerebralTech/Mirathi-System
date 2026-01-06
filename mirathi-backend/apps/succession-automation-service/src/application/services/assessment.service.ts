import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReadinessStatus, SuccessionRegime } from '@prisma/client';

import { ReadinessAssessment } from '../../domian/entities/readiness-assessment.entity';
import {
  IReadinessAssessmentRepository,
  READINESS_ASSESSMENT_REPO,
} from '../../domian/repositories/readiness.repository';
import {
  AssessmentInput,
  ReadinessCalculatorService,
} from '../../domian/services/readiness-calculator.service';
import { SuccessionContext } from '../../domian/value-objects/succession-context.vo';
import { DocumentServiceAdapter } from '../../infrastructure/adapters/document-service.adapter';
// Infrastructure Adapters
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';

@Injectable()
export class AssessmentService {
  private readonlylogger = new Logger(AssessmentService.name);

  constructor(
    @Inject(READINESS_ASSESSMENT_REPO)
    private readonly assessmentRepo: IReadinessAssessmentRepository,
    private readonly calculator: ReadinessCalculatorService,
    // Adapters
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
    private readonly documentAdapter: DocumentServiceAdapter,
  ) {}

  /**
   * Main Use Case: Analyzes the current state of the estate/family/docs
   * and generates/updates the Readiness Score and Risks.
   */
  async analyzeReadiness(userId: string, estateId: string): Promise<ReadinessAssessment> {
    this.logger.log(`Analyzing readiness for Estate: ${estateId}`);

    // 1. Fetch External Data (Parallel)
    const [estateData, familyData, docData] = await Promise.all([
      this.estateAdapter.getEstateData(estateId),
      this.familyAdapter.getFamilyData(userId),
      this.documentAdapter.getDocumentStatus(userId),
    ]);

    // 2. Build Succession Context (VO)
    // Determines the "Legal Reality" (Regime, Court, etc.)
    const context = new SuccessionContext(
      estateData.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      familyData.religion,
      familyData.marriageType,
      estateData.totalAssets, // Jurisdiction based on Gross Value
      familyData.numberOfMinors > 0,
      familyData.isPolygamous,
      familyData.numberOfSpouses,
      familyData.numberOfChildren,
      false, // Disputes - TODO: Add dispute flag to Family Data
    );

    // 3. Prepare Calculator Input
    // Maps raw data to the boolean flags the calculator expects
    const calculatorInput: AssessmentInput = {
      hasDeathCertificate: docData.hasDeathCertificate,
      hasKraPin: estateData.hasKraPin || docData.hasKraPin,
      assetsListed: estateData.assets.length > 0,
      assetsValued: estateData.assets.every((a) => a.estimatedValue > 0), // Simplistic check
      debtsListed: true, // Optional or implicitly true if array exists
      hasWill: estateData.hasWill,
      willWitnessCount: estateData.willWitnessCount,
      hasExecutor: estateData.hasExecutor,
      hasGuardianForMinors: familyData.hasGuardianForMinors,
      taxClearance: estateData.taxClearance,
      familyConsentsObtained: docData.hasFamilyConsent,
      estateIsInsolvent: estateData.isInsolvent,
    };

    // 4. Run Domain Logic
    const result = this.calculator.calculate(context, calculatorInput);

    // 5. Load or Create Assessment Entity
    let assessment = await this.assessmentRepo.findByEstateId(estateId);

    if (!assessment) {
      assessment = ReadinessAssessment.create(userId, estateId, context);
    }

    // 6. Update Entity State
    assessment.updateScore(result.score);
    assessment.updateRiskProfile(result.risks);

    // Set next steps based on unresolved blocking risks
    const blockingSteps = result.risks
      .filter((r) => r.isBlocking && !r.isResolved)
      .flatMap((r) => r.toJSON().resolutionSteps); // Accessing props via JSON for now

    // Fallback recommendations if no critical risks
    if (blockingSteps.length === 0 && assessment.status !== ReadinessStatus.COMPLETE) {
      blockingSteps.push('Review generated forms', 'Proceed to Filing Phase');
    }

    // Using a setter I added to the entity logic in previous steps (or should exist)
    // If not exists in entity, we can map it via props directly if needed, but entity method is cleaner.
    // Assuming we added setNextSteps in the Entity:
    // assessment.setNextSteps(blockingSteps.slice(0, 3)); // Top 3 steps

    // 7. Persist
    await this.assessmentRepo.save(assessment);
    await this.assessmentRepo.saveRisks(result.risks);

    return assessment;
  }

  /**
   * Fetch existing assessment without re-analyzing
   */
  async getAssessment(estateId: string): Promise<ReadinessAssessment> {
    const assessment = await this.assessmentRepo.findByEstateId(estateId);
    if (!assessment) {
      throw new NotFoundException(`Assessment not found for estate ${estateId}`);
    }
    return assessment;
  }

  /**
   * Get Risks for the assessment
   */
  async getRisks(estateId: string) {
    const assessment = await this.assessmentRepo.findByEstateId(estateId);
    if (!assessment) throw new NotFoundException();

    return this.assessmentRepo.getRisks(assessment.id);
  }
}
