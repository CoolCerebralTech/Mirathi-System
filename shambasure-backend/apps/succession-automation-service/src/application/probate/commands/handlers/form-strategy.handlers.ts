import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { GeneratedForm } from '../../../../domain/entities/generated-form.entity';
// Use 'import type' for interfaces to fix TS1272
import type { IProbateApplicationRepository } from '../../../../domain/repositories/i-probate-application.repository';
import { PROBATE_APPLICATION_REPOSITORY } from '../../../../domain/repositories/i-probate-application.repository';
import type { IReadinessRepository } from '../../../../domain/repositories/i-readiness.repository';
import { READINESS_ASSESSMENT_REPOSITORY } from '../../../../domain/repositories/i-readiness.repository';
import { FormStrategyService } from '../../../../domain/services/form-strategy.service';
import { Result } from '../../../common/result';
import { PdfAssemblerService } from '../../services/form-strategy/pdf-assembler.service';
import {
  GenerateFormBundleCommand,
  ReviewFormCommand,
  SignFormCommand,
} from '../impl/form-strategy.commands';

/**
 * Handler: Generate Form Bundle (The "Engine" Trigger)
 */
@CommandHandler(GenerateFormBundleCommand)
export class GenerateFormBundleHandler implements ICommandHandler<GenerateFormBundleCommand> {
  private readonly logger = new Logger(GenerateFormBundleHandler.name);

  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly appRepository: IProbateApplicationRepository,
    @Inject(READINESS_ASSESSMENT_REPOSITORY)
    private readonly readinessRepository: IReadinessRepository,
    private readonly strategyService: FormStrategyService, // Domain Service
    private readonly pdfAssembler: PdfAssemblerService, // Application Service
  ) {}

  async execute(command: GenerateFormBundleCommand): Promise<Result<void>> {
    const { dto } = command;

    try {
      // 1. Fetch Application
      const application = await this.appRepository.findById(dto.applicationId);
      if (!application) return Result.fail(`Application not found: ${dto.applicationId}`);

      // 2. Fetch Readiness (for Documents & Estate Value)
      // Note: In a real system, Estate Value might come from an Estate Service or Aggregate directly
      const assessment = await this.readinessRepository.findById(application.readinessAssessmentId);
      if (!assessment) return Result.fail(`Readiness assessment missing`);

      // Mocking Estate Value retrieval - in reality, would come from Estate Context
      const estateValue = 5000000; // Placeholder

      // 3. Determine Strategy (Domain Logic)
      // We pass the list of documents available (e.g. ['DEATH_CERTIFICATE'])
      // For now, we assume readiness tracks gaps, so we invert that logic or just pass gaps
      // This maps Readiness Gaps -> Form Prerequisite Enums
      const availableDocs = []; // Logic to map assessment.riskFlags/gaps to available docs

      const strategy = this.strategyService.determineStrategy(
        application.successionContext,
        estateValue,
        availableDocs,
      );

      // 4. Generate Forms (Application Logic)
      for (const formType of strategy.forms) {
        // Skip if exists and not forced
        const existingForm = application.forms.find((f) => f.formType === formType.formType);
        if (existingForm && !dto.forceRegeneration) continue;

        // Assemble PDF (Heavy lifting)
        const pdfResult = await this.pdfAssembler.assembleForm(
          formType.formType,
          application.successionContext,
          {
            estateId: application.estateId,
            applicantName: application.applicantFullName,
            // ... inject other data
          },
        );

        // Add to Aggregate
        // Note: The Aggregate handles "GeneratedForm.create" internally via "addGeneratedForm"
        // But here we need to instantiate it with the URL first
        const formEntity = GeneratedForm.createPending(
          formType.formType,
          formType.formCode,
          formType.displayName,
          formType.requiresCommissionerOaths ? 1 : 0, // Simplified signature logic
          'system',
          formType.version,
          'EstateService',
          'hash-placeholder',
        );

        // Update the entity with the generated PDF details
        formEntity.markAsGenerated(
          pdfResult.storageUrl,
          pdfResult.fileSize,
          pdfResult.checksum,
          pdfResult.generationTimeMs,
        );

        // Add to Aggregate (Logic check inside aggregate ensures no duplicates unless superseded)
        application.addGeneratedForm(formEntity);
      }

      // 5. Persist
      await this.appRepository.save(application);
      this.logger.log(`Generated forms for Application ${application.id.toString()}`);

      return Result.ok();
    } catch (error) {
      this.logger.error(
        `Form generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return Result.fail(error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

/**
 * Handler: Review Form
 */
@CommandHandler(ReviewFormCommand)
export class ReviewFormHandler implements ICommandHandler<ReviewFormCommand> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: ReviewFormCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // Aggregate Logic: Approve specific form
      application.approveForm(dto.formId, dto.reviewedByUserId, dto.notes);

      await this.repository.save(application);
      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}

/**
 * Handler: Sign Form
 */
@CommandHandler(SignFormCommand)
export class SignFormHandler implements ICommandHandler<SignFormCommand> {
  constructor(
    @Inject(PROBATE_APPLICATION_REPOSITORY)
    private readonly repository: IProbateApplicationRepository,
  ) {}

  async execute(command: SignFormCommand): Promise<Result<void>> {
    const { dto } = command;
    try {
      const application = await this.repository.findById(dto.applicationId);
      if (!application) return Result.fail('Application not found');

      // Find the form entity
      const form = application.forms.find((f) => f.id.equals(dto.formId));
      if (!form) return Result.fail('Form not found');

      // Add signature
      form.addSignature({
        signatoryId: dto.signatoryId,
        signatoryName: dto.signatoryName,
        signatureType: dto.signatureType,
        signedAt: new Date(),
        signatureId: dto.digitalSignatureId,
        ipAddress: dto.ipAddress,
      });

      // We save the whole aggregate
      await this.repository.save(application);
      return Result.ok();
    } catch (e) {
      return Result.fail(e instanceof Error ? e.message : String(e));
    }
  }
}
