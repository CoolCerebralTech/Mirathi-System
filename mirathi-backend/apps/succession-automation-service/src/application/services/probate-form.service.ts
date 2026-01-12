// apps/succession-automation-service/src/application/services/probate-form.service.ts
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { KenyanFormType } from '@prisma/client';

import { FormPreview } from '../../domain/entities/form-preview.entity';
import { ProbatePreview } from '../../domain/entities/probate-preview.entity';
import type { IProbatePreviewRepository } from '../../domain/repositories/probate-preview.repository';
import { PROBATE_PREVIEW_REPO } from '../../domain/repositories/probate-preview.repository';
import { ProbateFormFactoryService } from '../../domain/services/probate-form-factory.service';
import { EstateServiceAdapter } from '../../infrastructure/adapters/estate-service.adapter';
import { FamilyServiceAdapter } from '../../infrastructure/adapters/family-service.adapter';
import { ProbateTemplateService } from '../../infrastructure/templates/probate-template.service';

export interface GeneratedForm {
  formType: KenyanFormType;
  title: string;
  code: string;
  htmlPreview: string;
  purpose: string;
  instructions: string[];
  missingFields: string[];
}

export interface ProbateFormsBundle {
  preview: ProbatePreview;
  forms: GeneratedForm[];
  isComplete: boolean;
  missingRequirements: string[];
}

@Injectable()
export class ProbateFormService {
  constructor(
    private readonly estateAdapter: EstateServiceAdapter,
    private readonly familyAdapter: FamilyServiceAdapter,
    private readonly templateService: ProbateTemplateService,
    private readonly formFactory: ProbateFormFactoryService,

    @Inject(PROBATE_PREVIEW_REPO)
    private readonly previewRepo: IProbatePreviewRepository,
  ) {}

  /**
   * Generate all required forms for an estate
   */
  async generateProbateForms(userId: string, estateId: string): Promise<ProbateFormsBundle> {
    // 1. Get existing preview or create new one
    const preview = await this.previewRepo.findByEstateId(estateId);

    if (!preview || !preview.isReady) {
      throw new NotFoundException(
        `Probate forms not ready for estate ${estateId}. Complete readiness assessment first.`,
      );
    }

    // 2. Gather data for form generation
    const [estateData, familyData] = await Promise.all([
      this.estateAdapter.getEstateData(estateId),
      this.familyAdapter.getFamilyData(userId),
    ]);

    // 3. Get petitioner name (user's full name from user service)
    const petitionerName = await this.getPetitionerName(userId);

    // 4. Generate each required form
    const generatedForms: GeneratedForm[] = [];
    const missingRequirements: string[] = [];

    for (const formType of preview.requiredForms) {
      try {
        const form = await this.generateForm(formType, estateData, familyData, petitionerName);
        generatedForms.push(form);
      } catch (error) {
        missingRequirements.push(`Failed to generate ${formType}: ${error.message}`);
      }
    }

    // 5. Create form preview entities
    const formPreviewEntities = generatedForms.map((form) =>
      FormPreview.create(preview.id, form.formType, form.title, form.code, form.htmlPreview, {
        estateId,
        userId,
        generatedAt: new Date().toISOString(),
        formType: form.formType,
      }),
    );

    // 6. Save form previews
    await this.previewRepo.saveFormPreviews(formPreviewEntities);

    return {
      preview,
      forms: generatedForms,
      isComplete: missingRequirements.length === 0,
      missingRequirements,
    };
  }

  /**
   * Generate a specific form
   */
  async generateForm(
    formType: KenyanFormType,
    estateData: any,
    familyData: any,
    petitionerName: string,
  ): Promise<GeneratedForm> {
    // 1. Get form metadata
    const formMetadata = this.formFactory
      .getRequiredForms
      // We need a SuccessionContext here, but for form generation we can simplify
      // Create a minimal context or restructure this
      ()
      .find((meta) => meta.type === formType);

    if (!formMetadata) {
      throw new NotFoundException(`Form type ${formType} not supported`);
    }

    // 2. Generate HTML template
    const htmlPreview = this.templateService.generate(
      formType,
      estateData,
      familyData,
      petitionerName,
    );

    // 3. Identify missing fields
    const missingFields = this.identifyMissingFields(formType, estateData, familyData);

    return {
      formType,
      title: formMetadata.title,
      code: formMetadata.code,
      htmlPreview,
      purpose: formMetadata.purpose,
      instructions: formMetadata.instructions,
      missingFields,
    };
  }

  /**
   * Download form as PDF (simplified - returns HTML for now)
   */
  async downloadForm(
    previewId: string,
    formType: KenyanFormType,
  ): Promise<{ html: string; filename: string }> {
    // In a real implementation, this would convert HTML to PDF
    // For now, return HTML with proper filename

    const preview = await this.previewRepo
      .findByEstateId
      // We need to get by previewId
      ();

    if (!preview) {
      throw new NotFoundException(`Form preview ${previewId} not found`);
    }

    // Get the form preview from database
    // For now, return placeholder
    return {
      html: '<html><body>PDF generation not implemented yet</body></html>',
      filename: `${formType}_${new Date().toISOString().split('T')[0]}.html`,
    };
  }

  /**
   * Get form status and missing requirements
   */
  async getFormStatus(estateId: string): Promise<{
    isReady: boolean;
    requiredForms: KenyanFormType[];
    completedForms: KenyanFormType[];
    missingForms: KenyanFormType[];
    missingFields: Record<string, string[]>;
  }> {
    const preview = await this.previewRepo.findByEstateId(estateId);

    if (!preview) {
      return {
        isReady: false,
        requiredForms: [],
        completedForms: [],
        missingForms: [],
        missingFields: {},
      };
    }

    // Get estate and family data to check completeness
    const estateData = await this.estateAdapter.getEstateData(estateId);
    const userId = estateData.userId;
    const familyData = await this.familyAdapter.getFamilyData(userId);

    const missingFields: Record<string, string[]> = {};

    for (const formType of preview.requiredForms) {
      const fields = this.identifyMissingFields(formType, estateData, familyData);
      if (fields.length > 0) {
        missingFields[formType] = fields;
      }
    }

    const completedForms = preview.requiredForms.filter(
      (formType) => !missingFields[formType] || missingFields[formType].length === 0,
    );

    const missingForms = preview.requiredForms.filter(
      (formType) => missingFields[formType] && missingFields[formType].length > 0,
    );

    return {
      isReady: preview.isReady,
      requiredForms: preview.requiredForms,
      completedForms,
      missingForms,
      missingFields,
    };
  }

  /**
   * Validate form data before submission
   */
  validateFormData(
    formType: KenyanFormType,
    data: any,
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (formType) {
      case KenyanFormType.PA1_PROBATE:
        if (!data.willDate) errors.push('Will date is required');
        if (!data.executorName) errors.push('Executor name is required');
        break;

      case KenyanFormType.PA80_INTESTATE:
        if (!data.relationship) errors.push('Relationship to deceased is required');
        if (data.estateValue > 500000)
          warnings.push('Consider Summary Administration for estates under KES 500,000');
        break;

      case KenyanFormType.PA5_SUMMARY:
        if (data.estateValue > 500000)
          errors.push('Summary Administration only for estates under KES 500,000');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // --- Private Helper Methods ---

  private async getPetitionerName(userId: string): Promise<string> {
    // In a real implementation, get from user service
    // For now, return placeholder
    return `Petitioner ${userId.substring(0, 8)}`;
  }

  private identifyMissingFields(
    formType: KenyanFormType,
    estateData: any,
    familyData: any,
  ): string[] {
    const missing: string[] = [];

    switch (formType) {
      case KenyanFormType.PA1_PROBATE:
        if (!estateData.hasWill) missing.push('Will document');
        if (estateData.willWitnessCount < 2) missing.push('Two witnesses');
        if (!estateData.hasExecutor) missing.push('Executor name');
        break;

      case KenyanFormType.PA80_INTESTATE:
        if (familyData.numberOfChildren > 0 && !estateData.hasFamilyConsent) {
          missing.push('Family consent forms (P&A 38)');
        }
        if (!estateData.hasDeathCertificate) missing.push('Death certificate');
        break;

      case KenyanFormType.PA12_AFFIDAVIT_MEANS:
        if (estateData.assets.length === 0) missing.push('Asset list');
        if (estateData.debts.length === 0) missing.push('Debt list');
        break;

      case KenyanFormType.PA38_FAMILY_CONSENT:
        if (familyData.members.length === 0) missing.push('Family member signatures');
        break;

      case KenyanFormType.CHIEFS_LETTER:
        missing.push("Chief's stamp and signature");
        break;
    }

    return missing;
  }
}
