import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { KenyanFormType, SuccessionRegime } from '@prisma/client';

import { ProbatePreview } from '../../domian/entities/probate-preview.entity';
import {
  IProbatePreviewRepository,
  PROBATE_PREVIEW_REPO,
} from '../../domian/repositories/probate-preview.repository';
import {
  IReadinessAssessmentRepository,
  READINESS_ASSESSMENT_REPO,
} from '../../domian/repositories/readiness.repository';
import { ProbateFormFactoryService } from '../../domian/services/probate-form-factory.service';
import { SuccessionContext } from '../../domian/value-objects';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';
// Infrastructure
import { ProbateTemplateService } from '../../infrastructure/templates/probate-template.service';

@Injectable()
export class ProbateService {
  private readonly logger = new Logger(ProbateService.name);

  constructor(
    @Inject(PROBATE_PREVIEW_REPO)
    private readonly probateRepo: IProbatePreviewRepository,
    @Inject(READINESS_ASSESSMENT_REPO)
    private readonly readinessRepo: IReadinessAssessmentRepository,

    // Domain Services
    private readonly formFactory: ProbateFormFactoryService,

    // Infrastructure Services
    private readonly templateService: ProbateTemplateService,

    // Adapters
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
  ) {}

  /**
   * Generates the list of required forms based on the estate context.
   * This is the "Menu" of forms the user sees.
   */
  async generatePreviewDashboard(userId: string, estateId: string) {
    this.logger.log(`Generating form dashboard for Estate: ${estateId}`);

    // 1. Check Readiness (Gatekeeper)
    const assessment = await this.readinessRepo.findByEstateId(estateId);
    if (!assessment) {
      throw new NotFoundException('Readiness assessment not found. Please run assessment first.');
    }

    // 2. Build Context (The Legal Brain)
    const [estateData, familyData] = await Promise.all([
      this.estateAdapter.getEstateData(estateId),
      this.familyAdapter.getFamilyData(userId),
    ]);

    const context = new SuccessionContext(
      estateData.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      familyData.religion,
      familyData.marriageType,
      estateData.totalAssets,
      familyData.numberOfMinors > 0,
      familyData.isPolygamous,
      familyData.numberOfSpouses,
      familyData.numberOfChildren,
    );

    // 3. Get or Create Preview Entity
    let preview = await this.probateRepo.findByEstateId(estateId);
    if (!preview) {
      preview = ProbatePreview.create(userId, estateId, context, assessment.overallScore);
    } else {
      // Update readiness score in case it changed
      preview.updateReadiness(assessment.overallScore);
    }

    await this.probateRepo.save(preview);

    // 4. Get Required Forms Metadata (Using Domain Service)
    const formsMetadata = this.formFactory.getRequiredForms(context);

    return {
      preview: preview.toJSON(),
      forms: formsMetadata,
      canGenerate: preview.isReady,
      warnings: preview.isReady
        ? []
        : ['Readiness score must be at least 80% to generate valid court forms.'],
    };
  }

  /**
   * Generates the actual HTML for a specific form.
   */
  async getFormHtml(estateId: string, formType: KenyanFormType) {
    // 1. Fetch Data
    const estateData = await this.estateAdapter.getEstateData(estateId);
    // Note: We need the User Profile for the Petitioner Name usually,
    // assuming Family Adapter or Estate Adapter gives us the owner's name.
    // For now, we fetch family data to get the list of survivors.
    const familyData = await this.familyAdapter.getFamilyData(estateData.userId);

    // 2. Validate
    // (Optional: Check if this form is actually allowed for this estate context)

    // 3. Generate HTML via Template Engine (Infrastructure)
    // We assume the Petitioner is the User (Profile extraction would happen here)
    const petitionerName = 'THE PETITIONER'; // Placeholder: In real app, fetch from UserProfileAdapter

    const html = this.templateService.generate(formType, estateData, familyData, petitionerName);

    return {
      formType,
      html,
      disclaimer: 'EDUCATIONAL PREVIEW ONLY. DO NOT FILE WITHOUT LEGAL REVIEW.',
      generatedAt: new Date(),
    };
  }
}
