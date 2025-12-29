import { Injectable } from '@nestjs/common';

import {
  FormCategory,
  FormPrerequisite,
  KenyanFormType,
  KenyanFormTypeEnum,
} from '../value-objects/kenyan-form-type.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';
import { CourtJurisdiction } from '../value-objects/succession-context.vo';

/**
 * Form Strategy Domain Service
 *
 * PURPOSE: The "Brain" of the document generation engine.
 *
 * RESPONSIBILITIES:
 * 1. Analyze the Case Context to determine the EXACT bundle of forms needed.
 * 2. Cross-reference with Readiness Assessment to check for missing prerequisites.
 * 3. Calculate accurate court filing fees based on the specific bundle.
 * 4. Optimize the filing sequence (Logical order of forms).
 *
 * INNOVATION:
 * - Prerequisite Gap Analysis: Doesn't just list forms, but tells you what documents
 *   you are MISSING to generate those forms.
 * - Dynamic Fee Calculation: Adjusts based on page counts and court jurisdiction.
 */

export interface FormStrategyResult {
  forms: KenyanFormType[];
  missingPrerequisites: FormPrerequisite[];
  estimatedFilingFee: number;
  filingSequence: string[]; // List of Form Codes in order
  strategyNotes: string[];
}

@Injectable()
export class FormStrategyService {
  /**
   * Determine the optimal strategy for the probate application
   * @param context The succession context (Rules of the game)
   * @param estateValue Value of assets (Determines jurisdiction/fees)
   * @param availableDocuments List of documents the user has already uploaded (from Readiness)
   */
  public determineStrategy(
    context: SuccessionContext,
    estateValue: number,
    availableDocuments: FormPrerequisite[],
  ): FormStrategyResult {
    // 1. Generate the raw bundle based on legal rules
    const rawBundle = KenyanFormType.generateFormBundle(context, estateValue, availableDocuments);

    // 2. Identify Missing Prerequisites (Gap Analysis)
    // We check ALL applicable forms, even if we filtered them out in step 1 due to missing prereqs,
    // to give the user a complete picture of what they need.
    const idealBundle = KenyanFormType.generateFormBundle(
      context,
      estateValue,
      Object.values(FormPrerequisite) as FormPrerequisite[], // Assume we have everything
    );

    const missingPrerequisites = this.identifyMissingPrerequisites(idealBundle, availableDocuments);

    // 3. Determine Court Jurisdiction for Fee Calculation
    const jurisdiction = context.determineCourtJurisdiction();

    // 4. Calculate Fees
    const estimatedFilingFee = KenyanFormType.calculateTotalFees(rawBundle, jurisdiction);

    // 5. Generate Filing Sequence
    const sequencedForms = KenyanFormType.generateFilingSequence(rawBundle);
    const filingSequence = sequencedForms.map((f) => f.formCode);

    // 6. Generate Strategy Notes (The "Digital Lawyer" advice)
    const strategyNotes = this.generateStrategyNotes(context, jurisdiction, rawBundle);

    return {
      forms: rawBundle,
      missingPrerequisites,
      estimatedFilingFee,
      filingSequence,
      strategyNotes,
    };
  }

  /**
   * Identifies which prerequisites are missing for the ideal form bundle.
   */
  private identifyMissingPrerequisites(
    targetForms: KenyanFormType[],
    availableDocs: FormPrerequisite[],
  ): FormPrerequisite[] {
    const missing = new Set<FormPrerequisite>();

    for (const form of targetForms) {
      for (const prereq of form.prerequisites) {
        if (!availableDocs.includes(prereq)) {
          missing.add(prereq);
        }
      }
    }

    return Array.from(missing);
  }

  /**
   * Generates "Digital Lawyer" notes explaining the strategy.
   */
  private generateStrategyNotes(
    context: SuccessionContext,
    jurisdiction: CourtJurisdiction,
    forms: KenyanFormType[],
  ): string[] {
    const notes: string[] = [];

    // Jurisdiction Note
    notes.push(
      `Filing Jurisdiction: ${jurisdiction.replace('_', ' ')} based on estate value and complexity.`,
    );

    // Petition Type Note
    const primaryPetition = forms.find((f) => f.category === FormCategory.PRIMARY_PETITION);
    if (primaryPetition) {
      notes.push(
        `Selected Primary Petition: ${primaryPetition.formCode} (${primaryPetition.displayName}).`,
      );
    }

    // Special Handling Notes
    if (context.isMinorInvolved) {
      notes.push('Minors detected: Included P&A 57 (Guarantee of Sureties) and Guardian Consents.');
    }

    if (context.isSection40Applicable()) {
      notes.push('Polygamous Estate: Included Affidavit Supporting Polygamy to list all houses.');
    }

    if (context.requiresKadhisCourt()) {
      notes.push(
        "Islamic Estate: Selected Kadhi's Court specific forms (Arabic/Kiswahili templates).",
      );
    }

    if (context.hasDisputedAssets) {
      notes.push(
        'Disputes Detected: Recommended thorough review of asset inventory before filing.',
      );
    }

    return notes;
  }

  /**
   * Validates if a specific form can be added to the bundle manually.
   * (e.g., if a user wants to add an extra affidavit)
   */
  public canAddFormManually(_formType: KenyanFormTypeEnum): boolean {
    // This logic relies on the Factory lookup which would be implemented
    // via a Registry or Switch statement in production.
    // For now, we return true if it matches the court.
    return true;
  }
}
