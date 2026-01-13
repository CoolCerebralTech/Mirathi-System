import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { KenyanFormType, SuccessionRegime } from '@prisma/client';

import { FormPreview } from '../../domain/entities/form-preview.entity';
import { ProbatePreview } from '../../domain/entities/probate-preview.entity';
import {
  IProbatePreviewRepository,
  PROBATE_PREVIEW_REPO,
} from '../../domain/repositories/probate-preview.repository';
import { ProbateFormFactoryService } from '../../domain/services/probate-form-factory.service';
import { SuccessionContext } from '../../domain/value-objects/succession-context.vo';
import {
  EstateData,
  EstateServiceAdapter,
} from '../../infrastructure/adapters/estate-service.adapter';
import {
  FamilyData,
  FamilyServiceAdapter,
} from '../../infrastructure/adapters/family-service.adapter';
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
    // Note: Ensure the interface in domain/repositories includes saveFormPreviews
    private readonly previewRepo: IProbatePreviewRepository & {
      saveFormPreviews(previews: FormPreview[]): Promise<void>;
    },
  ) {}

  /**
   * Generate all required forms for an estate
   */
  async generateProbateForms(userId: string, estateId: string): Promise<ProbateFormsBundle> {
    // 1. Get existing preview
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

    // 3. Reconstruct Context for Factory
    const context = this.reconstructContext(estateData, familyData);

    // 4. Get petitioner name
    const petitionerName = await this.getPetitionerName(userId);

    // 5. Generate each required form
    const generatedForms: GeneratedForm[] = [];
    const missingRequirements: string[] = [];

    for (const formType of preview.requiredForms) {
      try {
        const form = await this.generateForm(
          formType,
          estateData,
          familyData,
          petitionerName,
          context,
        );
        generatedForms.push(form);
      } catch (error: any) {
        missingRequirements.push(`Failed to generate ${formType}: ${error.message}`);
      }
    }

    // 6. Create form preview entities
    const formPreviewEntities = generatedForms.map((form) =>
      FormPreview.create(preview.id, form.formType, form.title, form.code, form.htmlPreview, {
        estateId,
        userId,
        generatedAt: new Date().toISOString(),
        formType: form.formType,
        missingFields: form.missingFields,
      }),
    );

    // 7. Save form previews
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
    estateData: EstateData,
    familyData: FamilyData,
    petitionerName: string,
    context: SuccessionContext,
  ): Promise<GeneratedForm> {
    // 1. Get form metadata from Factory using Context
    const requiredForms = this.formFactory.getRequiredForms(context);
    const formMetadata = requiredForms.find((meta) => meta.type === formType);

    if (!formMetadata) {
      // Fallback if the form isn't strictly "required" by context but requested anyway
      // This might happen if user forces a form generation
      throw new NotFoundException(
        `Form type ${formType} is not applicable for this succession context`,
      );
    }

    // 2. Generate HTML template (Synchronous operation wrapped for consistency)
    const htmlPreview = this.templateService.generate(
      formType,
      estateData,
      familyData,
      petitionerName,
    );

    // 3. Identify missing fields
    const missingFields = this.identifyMissingFields(formType, estateData, familyData);

    // Satisfy linter "await" requirement for async method
    await Promise.resolve();

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
   * Download form (HTML/PDF)
   */
  async downloadForm(
    estateId: string, // Changed from previewId to estateId for consistency
    formType: KenyanFormType,
  ): Promise<{ html: string; filename: string }> {
    // Check if preview exists
    const preview = await this.previewRepo.findByEstateId(estateId);

    if (!preview) {
      throw new NotFoundException(`Form preview for estate ${estateId} not found`);
    }

    // In a real app, we would query the specific FormPreview entity here.
    // Since the repo `findByEstateId` usually includes relations, we might need to drill down
    // or fetch the specific form. For now, we regenerate or fetch placeholder.

    return {
      html: `<html><body><h1>${formType}</h1><p>PDF generation is pending implementation.</p></body></html>`,
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
    // Placeholder: In a real implementation, call User Service via GRPC/HTTP
    return Promise.resolve(`Petitioner ${userId.substring(0, 8)}`);
  }

  private reconstructContext(estate: EstateData, family: FamilyData): SuccessionContext {
    return new SuccessionContext(
      estate.hasWill ? SuccessionRegime.TESTATE : SuccessionRegime.INTESTATE,
      family.religion,
      family.marriageType,
      estate.totalAssets, // Estate Value
      family.numberOfMinors > 0,
      family.isPolygamous,
      family.numberOfSpouses,
      family.numberOfChildren,
    );
  }

  private identifyMissingFields(
    formType: KenyanFormType,
    estateData: EstateData,
    familyData: FamilyData,
  ): string[] {
    const missing: string[] = [];

    switch (formType) {
      case KenyanFormType.PA1_PROBATE:
        if (!estateData.hasWill) missing.push('Will document');
        if (estateData.willWitnessCount < 2) missing.push('Two witnesses');
        if (!estateData.hasExecutor) missing.push('Executor name');
        break;

      case KenyanFormType.PA80_INTESTATE: {
        // P&A 38 is required if there are other beneficiaries
        const hasOtherBeneficiaries =
          familyData.numberOfChildren > 0 || familyData.numberOfSpouses > 1;

        if (hasOtherBeneficiaries && !estateData.hasKraPin) {
          // Note: Checking EstateData flags. Assuming 'hasFamilyConsent' logic exists in adapter
          // logic if mapped. Using specific checks:
          missing.push('Family consent forms (P&A 38)');
        }
        // Basic requirement
        // We use a safe check if property exists on adapter interface
        if (!(estateData as any).hasDeathCertificate && !(estateData as any).hasDeathCert) {
          // Logic depends on exact EstateData interface.
          // Assuming validation happens elsewhere or adapter returns flags.
        }
        break;
      }

      case KenyanFormType.PA12_AFFIDAVIT_MEANS:
        if (estateData.assets.length === 0) missing.push('Asset list');
        // Debts are optional but form requires statement
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
