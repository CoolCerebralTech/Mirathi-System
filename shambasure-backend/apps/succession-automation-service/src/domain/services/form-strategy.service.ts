// src/succession-automation/src/domain/services/form-strategy.service.ts
import { FormFormat, GeneratedForm } from '../entities/generated-form.entity';
import { KenyanFormType, KenyanFormTypeEnum } from '../value-objects/kenyan-form-type.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Form Strategy Service
 *
 * PURPOSE: The "Form Selector" - decides which P&A forms to generate
 * based on SuccessionContext, estate value, and case complexity.
 *
 * INPUT:
 * - SuccessionContext (regime, marriage type, religion)
 * - Estate value (determines High Court vs Magistrate)
 * - Has minors (requires guardianship forms)
 *
 * OUTPUT:
 * - Array of KenyanFormType (forms to generate)
 * - Form data templates (JSON structures)
 * - Generation instructions
 *
 * FORM SELECTION LOGIC:
 * - Intestate → P&A 80 + Chief's Letter
 * - Testate → P&A 1 + Affidavit of Due Execution
 * - Islamic → Islamic Petition (Kadhi's Court)
 * - Small Estate (< KES 500k) → P&A 5 (Summary Administration)
 * - All cases → P&A 38 (Consent), Inventory, Notice to Creditors
 *
 * USAGE:
 * ```typescript
 * const strategy = formStrategy.determineRequiredForms(context, 3_000_000, true);
 * // Returns: { forms: [P&A 80, Chief's Letter, P&A 38, ...], formData: {...} }
 * ```
 */

// ============================================================================
// FORM GENERATION STRATEGY
// ============================================================================

export interface FormGenerationStrategy {
  forms: KenyanFormType[];
  priorityOrder: number[]; // Order in which to generate
  estimatedTotalPages: number;
  estimatedTotalCost: number; // Filing fees
  estimatedGenerationTime: number; // Minutes
  instructions: string[];
  warnings: string[];
}

// ============================================================================
// FORM DATA TEMPLATE
// ============================================================================

export interface FormDataTemplate {
  formType: KenyanFormTypeEnum;
  templateVersion: string;
  requiredFields: string[];
  optionalFields: string[];
  dataMapping: Record<string, string>; // Field mappings from source data
}

// ============================================================================
// FORM STRATEGY SERVICE
// ============================================================================

export class FormStrategyService {
  /**
   * Determine which forms are required for this case
   */
  public determineRequiredForms(
    context: SuccessionContext,
    estateValueKES: number,
    hasMinors: boolean,
    hasPolygamousHouses: boolean = false,
  ): FormGenerationStrategy {
    const forms: KenyanFormType[] = [];
    const warnings: string[] = [];
    const instructions: string[] = [];

    // Step 1: Determine primary petition form
    const primaryForm = this.selectPrimaryPetition(context, estateValueKES, warnings);
    forms.push(primaryForm);

    // Step 2: Add regime-specific forms
    if (context.regime === 'INTESTATE') {
      forms.push(KenyanFormType.createChiefsLetterTemplate());
      instructions.push('Obtain Letter from Area Chief before filing');
    }

    if (context.regime === 'TESTATE') {
      forms.push(KenyanFormType.createAffidavitDueExecution());
      instructions.push('Witnesses must sign affidavit confirming Will execution');
    }

    // Step 3: Add universal forms (required for all cases)
    forms.push(KenyanFormType.createPA38Consent());
    forms.push(KenyanFormType.createInventoryAssets());
    forms.push(KenyanFormType.createNoticeToCreditors());

    // Step 4: Add conditional forms

    // Guardianship forms (if minors)
    if (hasMinors) {
      // Note: Guardianship is handled separately, but we note it
      warnings.push('Minor children require guardian appointment (separate process)');
    }

    // Guarantee form (Intestate > KES 1M)
    if (context.regime === 'INTESTATE' && estateValueKES > 1_000_000) {
      forms.push(KenyanFormType.createPA57Guarantee());
      instructions.push('Administrator must provide surety bond (P&A 57)');
    }

    // Affidavit of Means (optional but recommended)
    forms.push(KenyanFormType.createPA12AffidavitMeans());

    // Step 5: Calculate metadata
    const estimatedTotalPages = forms.reduce((sum, f) => sum + f.estimatedPages, 0);
    const estimatedTotalCost = forms.reduce((sum, f) => sum + (f.filingFee || 0), 0);
    const estimatedGenerationTime = forms.length * 5; // 5 minutes per form

    // Step 6: Determine priority order (which to generate first)
    const priorityOrder = this.calculatePriorityOrder(forms);

    return {
      forms,
      priorityOrder,
      estimatedTotalPages,
      estimatedTotalCost,
      estimatedGenerationTime,
      instructions,
      warnings,
    };
  }

  /**
   * Select primary petition form based on context
   */
  private selectPrimaryPetition(
    context: SuccessionContext,
    estateValueKES: number,
    warnings: string[],
  ): KenyanFormType {
    // Islamic cases → Kadhi's Court
    if (context.religion === 'ISLAMIC') {
      warnings.push("Islamic case - file in Kadhi's Court with Islamic petition");
      return KenyanFormType.createIslamicPetition();
    }

    // Small estates → Summary Administration
    if (estateValueKES < 500_000) {
      return KenyanFormType.createPA5PetitionSummary();
    }

    // Testate → Grant of Probate
    if (context.regime === 'TESTATE') {
      return KenyanFormType.createPA1Petition();
    }

    // Intestate → Letters of Administration
    if (context.regime === 'INTESTATE') {
      return KenyanFormType.createPA80PetitionIntestate();
    }

    // Default: Letters of Administration
    warnings.push('Regime unclear - defaulting to Letters of Administration');
    return KenyanFormType.createPA80PetitionIntestate();
  }

  /**
   * Calculate priority order for form generation
   * (Primary petition first, then supporting docs)
   */
  private calculatePriorityOrder(forms: KenyanFormType[]): number[] {
    const priorityOrder: number[] = [];

    // Priority 1: Primary petition (P&A 1, P&A 5, P&A 80, Islamic)
    forms.forEach((form, index) => {
      if (form.isPrimaryPetition()) {
        priorityOrder.push(index);
      }
    });

    // Priority 2: Chief's Letter (if Intestate)
    forms.forEach((form, index) => {
      if (form.formType === KenyanFormTypeEnum.CHIEFS_LETTER_TEMPLATE) {
        priorityOrder.push(index);
      }
    });

    // Priority 3: Affidavit of Due Execution (if Testate)
    forms.forEach((form, index) => {
      if (form.formType === KenyanFormTypeEnum.AFFIDAVIT_DUE_EXECUTION) {
        priorityOrder.push(index);
      }
    });

    // Priority 4: Consent forms
    forms.forEach((form, index) => {
      if (form.formType === KenyanFormTypeEnum.PA38_CONSENT) {
        priorityOrder.push(index);
      }
    });

    // Priority 5: Inventory
    forms.forEach((form, index) => {
      if (form.formType === KenyanFormTypeEnum.INVENTORY_ASSETS) {
        priorityOrder.push(index);
      }
    });

    // Priority 6: Everything else
    forms.forEach((form, index) => {
      if (!priorityOrder.includes(index)) {
        priorityOrder.push(index);
      }
    });

    return priorityOrder;
  }

  // ==================== FORM DATA PREPARATION ====================

  /**
   * Prepare form data templates
   * Returns JSON structure for each form type
   */
  public prepareFormDataTemplates(
    context: SuccessionContext,
    estateData: any,
    familyData: any,
    applicantData: any,
  ): Map<KenyanFormTypeEnum, any> {
    const templates = new Map<KenyanFormTypeEnum, any>();

    // P&A 1: Petition for Grant of Probate
    if (context.regime === 'TESTATE') {
      templates.set(KenyanFormTypeEnum.PA1_PETITION, {
        petitioner: {
          fullName: applicantData.fullName,
          nationalId: applicantData.nationalId,
          address: applicantData.address,
          relationship: applicantData.relationshipToDeceased,
          role: 'Executor',
        },
        deceased: {
          fullName: familyData.deceasedFullName,
          nationalId: familyData.deceasedNationalId,
          dateOfDeath: familyData.deceasedDateOfDeath,
          placeOfDeath: familyData.deceasedPlaceOfDeath,
          lastResidence: familyData.deceasedLastResidence,
        },
        will: {
          dateExecuted: estateData.willDate,
          witnessCount: estateData.willWitnessCount,
          location: estateData.willStorageLocation,
        },
        estate: {
          grossValue: estateData.grossValueKES,
          netValue: estateData.netEstateValueKES,
          currency: 'KES',
        },
        court: {
          station: this.determineCourtStation(context, estateData),
          filingDate: new Date(),
        },
      });
    }

    // P&A 80: Petition for Letters of Administration
    if (context.regime === 'INTESTATE') {
      templates.set(KenyanFormTypeEnum.PA80_PETITION_INTESTATE, {
        petitioner: {
          fullName: applicantData.fullName,
          nationalId: applicantData.nationalId,
          address: applicantData.address,
          relationship: applicantData.relationshipToDeceased,
          role: 'Administrator',
        },
        deceased: {
          fullName: familyData.deceasedFullName,
          nationalId: familyData.deceasedNationalId,
          dateOfDeath: familyData.deceasedDateOfDeath,
          placeOfDeath: familyData.deceasedPlaceOfDeath,
          lastResidence: familyData.deceasedLastResidence,
          maritalStatus: familyData.deceasedMaritalStatus,
        },
        nextOfKin: familyData.nextOfKin.map((member: any) => ({
          fullName: member.fullName,
          relationship: member.relationship,
          age: member.age,
          nationalId: member.nationalId,
        })),
        estate: {
          grossValue: estateData.grossValueKES,
          netValue: estateData.netEstateValueKES,
          currency: 'KES',
        },
        court: {
          station: this.determineCourtStation(context, estateData),
          filingDate: new Date(),
        },
      });
    }

    // P&A 38: Consent Form (template for each consenting party)
    templates.set(KenyanFormTypeEnum.PA38_CONSENT, {
      consenter: {
        fullName: '', // To be filled for each family member
        nationalId: '',
        relationship: '',
        address: '',
      },
      deceased: {
        fullName: familyData.deceasedFullName,
        dateOfDeath: familyData.deceasedDateOfDeath,
      },
      applicant: {
        fullName: applicantData.fullName,
        role: applicantData.role,
      },
      consentStatement:
        'I hereby consent to the application for [Grant Type] in respect of the estate of the deceased.',
      signatureDate: new Date(),
    });

    // Inventory of Assets
    templates.set(KenyanFormTypeEnum.INVENTORY_ASSETS, {
      estate: {
        deceasedName: familyData.deceasedFullName,
        dateOfDeath: familyData.deceasedDateOfDeath,
        totalGrossValue: estateData.grossValueKES,
      },
      assets: estateData.assets.map((asset: any) => ({
        description: asset.description,
        type: asset.type,
        location: asset.location,
        value: asset.currentValue,
        encumbrances: asset.encumbranceDetails || 'None',
      })),
      liabilities: estateData.debts.map((debt: any) => ({
        creditor: debt.creditorName,
        amount: debt.outstandingBalance,
        type: debt.type,
        secured: debt.isSecured,
      })),
      netValue: estateData.netEstateValueKES,
    });

    // Notice to Creditors
    templates.set(KenyanFormTypeEnum.NOTICE_TO_CREDITORS, {
      deceased: {
        fullName: familyData.deceasedFullName,
        dateOfDeath: familyData.deceasedDateOfDeath,
        lastResidence: familyData.deceasedLastResidence,
      },
      executor: {
        fullName: applicantData.fullName,
        address: applicantData.address,
        phone: applicantData.phone,
      },
      noticeDate: new Date(),
      deadlineDate: this.calculateCreditorDeadline(new Date()), // 2 months
      publicationDetails: 'To be published in Kenya Gazette and local newspaper',
    });

    return templates;
  }

  /**
   * Determine court station based on context and estate location
   */
  private determineCourtStation(context: SuccessionContext, estateData: any): string {
    if (context.requiresKadhisCourt()) {
      return `Kadhi's Court ${estateData.county || 'Nairobi'}`;
    }

    if (context.requiresHighCourt(estateData.grossValueKES)) {
      return `High Court ${estateData.county || 'Nairobi'}`;
    }

    return `Magistrate's Court ${estateData.county || 'Nairobi'}`;
  }

  /**
   * Calculate creditor deadline (2 months from publication)
   */
  private calculateCreditorDeadline(noticeDate: Date): Date {
    const deadline = new Date(noticeDate);
    deadline.setMonth(deadline.getMonth() + 2);
    return deadline;
  }

  // ==================== FORM VALIDATION ====================

  /**
   * Validate form data completeness before generation
   */
  public validateFormData(
    formType: KenyanFormTypeEnum,
    formData: any,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (formType) {
      case KenyanFormTypeEnum.PA1_PETITION:
        if (!formData.petitioner?.fullName) errors.push('Petitioner name required');
        if (!formData.deceased?.fullName) errors.push('Deceased name required');
        if (!formData.will?.dateExecuted) errors.push('Will execution date required');
        if (!formData.estate?.grossValue) errors.push('Estate value required');
        break;

      case KenyanFormTypeEnum.PA80_PETITION_INTESTATE:
        if (!formData.petitioner?.fullName) errors.push('Petitioner name required');
        if (!formData.deceased?.fullName) errors.push('Deceased name required');
        if (!formData.nextOfKin || formData.nextOfKin.length === 0) {
          errors.push('Next of kin information required');
        }
        if (!formData.estate?.grossValue) errors.push('Estate value required');
        break;

      case KenyanFormTypeEnum.PA38_CONSENT:
        if (!formData.consenter?.fullName) errors.push('Consenter name required');
        if (!formData.consenter?.nationalId) errors.push('National ID required');
        break;

      case KenyanFormTypeEnum.INVENTORY_ASSETS:
        if (!formData.assets || formData.assets.length === 0) {
          errors.push('At least one asset required');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get form description for user
   */
  public getFormDescription(formType: KenyanFormTypeEnum): string {
    const form = this.getFormByType(formType);
    return form ? form.description : 'Unknown form';
  }

  /**
   * Get form by type
   */
  private getFormByType(formType: KenyanFormTypeEnum): KenyanFormType | null {
    const formFactories: Record<KenyanFormTypeEnum, () => KenyanFormType> = {
      [KenyanFormTypeEnum.PA1_PETITION]: KenyanFormType.createPA1Petition,
      [KenyanFormTypeEnum.PA5_PETITION_SUMMARY]: KenyanFormType.createPA5PetitionSummary,
      [KenyanFormTypeEnum.PA80_PETITION_INTESTATE]: KenyanFormType.createPA80PetitionIntestate,
      [KenyanFormTypeEnum.PA12_AFFIDAVIT_MEANS]: KenyanFormType.createPA12AffidavitMeans,
      [KenyanFormTypeEnum.PA38_CONSENT]: KenyanFormType.createPA38Consent,
      [KenyanFormTypeEnum.PA57_GUARANTEE]: KenyanFormType.createPA57Guarantee,
      [KenyanFormTypeEnum.CHIEFS_LETTER_TEMPLATE]: KenyanFormType.createChiefsLetterTemplate,
      [KenyanFormTypeEnum.ISLAMIC_PETITION]: KenyanFormType.createIslamicPetition,
      [KenyanFormTypeEnum.ISLAMIC_CONSENT]: KenyanFormType.createIslamicPetition, // Reuse
      [KenyanFormTypeEnum.AFFIDAVIT_DUE_EXECUTION]: KenyanFormType.createAffidavitDueExecution,
      [KenyanFormTypeEnum.NOTICE_TO_CREDITORS]: KenyanFormType.createNoticeToCreditors,
      [KenyanFormTypeEnum.INVENTORY_ASSETS]: KenyanFormType.createInventoryAssets,
      [KenyanFormTypeEnum.GRANT_OF_PROBATE]: KenyanFormType.createPA1Petition, // Reuse
      [KenyanFormTypeEnum.LETTERS_OF_ADMINISTRATION]: KenyanFormType.createPA80PetitionIntestate, // Reuse
    };

    const factory = formFactories[formType];
    return factory ? factory() : null;
  }

  /**
   * Estimate form generation cost
   */
  public estimateFilingCost(forms: KenyanFormType[]): number {
    return forms.reduce((total, form) => total + (form.filingFee || 0), 0);
  }

  /**
   * Check if forms are ready to file
   */
  public areFormsReadyToFile(forms: GeneratedForm[]): boolean {
    return forms.every((form) => form.isReadyToFile());
  }
}
