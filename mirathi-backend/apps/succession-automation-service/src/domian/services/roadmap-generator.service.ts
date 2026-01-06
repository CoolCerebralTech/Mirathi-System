// =============================================================================
// 4. ROADMAP GENERATOR SERVICE
// Creates step-by-step educational guide
// =============================================================================
import { Injectable } from '@nestjs/common';

import { SuccessionContext } from '../value-objects/succession-context.vo';

@Injectable()
export class RoadmapGeneratorService {
  /**
   * Generates roadmap tasks based on succession context
   */
  generateTasks(context: SuccessionContext): Array<{
    phase: string;
    category: string;
    orderIndex: number;
    title: string;
    description: string;
    whatIsIt: string;
    whyNeeded: string;
    howToGet: string;
    estimatedDays: number;
    dependsOnTaskIds: string[];
    legalBasis?: string;
  }> {
    const tasks: any[] = [];
    let orderIndex = 0;

    // ========== PHASE 1: PRE-FILING ==========

    // Task 1: Death Certificate
    tasks.push({
      phase: 'PRE_FILING',
      category: 'IDENTITY_VERIFICATION',
      orderIndex: orderIndex++,
      title: 'Obtain Death Certificate',
      description: 'Get official death certificate from hospital or Civil Registration',
      whatIsIt: 'An official document certifying the death of a person',
      whyNeeded: 'Legal proof of death required for all succession cases',
      howToGet: 'Visit hospital where death occurred or nearest Civil Registration office',
      estimatedDays: 3,
      dependsOnTaskIds: [],
      legalBasis: 'S.45 Law of Succession Act',
    });

    // Task 2: KRA PIN
    tasks.push({
      phase: 'PRE_FILING',
      category: 'IDENTITY_VERIFICATION',
      orderIndex: orderIndex++,
      title: 'Obtain Deceased KRA PIN',
      description: 'Get KRA PIN for deceased person for tax purposes',
      whatIsIt: 'Kenya Revenue Authority Personal Identification Number',
      whyNeeded: 'Required for tax clearance before grant issuance',
      howToGet: 'Visit KRA office or apply online at iTax portal',
      estimatedDays: 7,
      dependsOnTaskIds: [],
      legalBasis: 'Tax clearance requirement',
    });

    // Task 3: List Assets
    tasks.push({
      phase: 'PRE_FILING',
      category: 'ASSET_DISCOVERY',
      orderIndex: orderIndex++,
      title: 'List All Assets',
      description: 'Create comprehensive inventory of deceased estate',
      whatIsIt: 'Complete list of everything the deceased owned',
      whyNeeded: 'Court needs to know total estate value',
      howToGet: 'Check bank statements, land registries, vehicle registrations',
      estimatedDays: 14,
      dependsOnTaskIds: [],
    });

    // Task 4: Value Assets
    tasks.push({
      phase: 'PRE_FILING',
      category: 'VALUATION',
      orderIndex: orderIndex++,
      title: 'Get Professional Asset Valuations',
      description: 'Obtain valuations for high-value assets',
      whatIsIt: 'Official estimates of asset market values',
      whyNeeded: 'Determines court jurisdiction and tax liability',
      howToGet: 'Hire registered valuers for land, buildings, vehicles',
      estimatedDays: 14,
      dependsOnTaskIds: [],
    });

    // Intestate-specific task
    if (context.regime === 'INTESTATE') {
      tasks.push({
        phase: 'PRE_FILING',
        category: 'LEGAL_REQUIREMENT',
        orderIndex: orderIndex++,
        title: 'Get Letter from Area Chief',
        description: 'Obtain confirmation letter from local Chief',
        whatIsIt: 'Letter confirming you are legitimate heir',
        whyNeeded: 'Required for intestate succession cases',
        howToGet: "Visit local Chief's office with death certificate and ID",
        estimatedDays: 14,
        dependsOnTaskIds: [],
        legalBasis: 'Customary requirement for intestate cases',
      });
    }

    // Guardian task if minors
    if (context.hasMinors) {
      tasks.push({
        phase: 'PRE_FILING',
        category: 'GUARDIANSHIP',
        orderIndex: orderIndex++,
        title: 'Appoint Guardian for Minor Children',
        description: 'Legal guardian must be appointed for beneficiaries under 18',
        whatIsIt: 'Adult responsible for managing minor inheritance',
        whyNeeded: 'Minors cannot receive assets directly',
        howToGet: 'Identify guardian, obtain consent, file guardianship application',
        estimatedDays: 30,
        dependsOnTaskIds: [],
        legalBasis: 'S.70 Law of Succession Act',
      });
    }

    // ========== PHASE 2: FILING ==========

    tasks.push({
      phase: 'FILING',
      category: 'COURT_FILING',
      orderIndex: orderIndex++,
      title: 'Prepare Court Forms',
      description: `Complete required forms: ${context.getRequiredForms().join(', ')}`,
      whatIsIt: 'Official court petition documents',
      whyNeeded: 'Court requires specific forms for each case type',
      howToGet: 'Use our system to generate pre-filled forms',
      estimatedDays: 2,
      dependsOnTaskIds: [],
    });

    tasks.push({
      phase: 'FILING',
      category: 'FAMILY_CONSENT',
      orderIndex: orderIndex++,
      title: 'Obtain Family Consents',
      description: 'Get signatures from spouse and adult children',
      whatIsIt: 'Written agreement from family members',
      whyNeeded: 'Court requires family consent for grant',
      howToGet: 'Use Form P&A 38 - Family can sign digitally',
      estimatedDays: 10,
      dependsOnTaskIds: [],
      legalBasis: 'Form P&A 38 requirement',
    });

    tasks.push({
      phase: 'FILING',
      category: 'COURT_FILING',
      orderIndex: orderIndex++,
      title: 'File Application at Court',
      description: 'Submit completed forms to court registry',
      whatIsIt: 'Official submission of your case',
      whyNeeded: 'Starts the legal process',
      howToGet: `Visit ${context.targetCourt} registry with printed forms`,
      estimatedDays: 1,
      dependsOnTaskIds: [],
    });

    // ========== PHASE 3: COURT PROCESS ==========

    tasks.push({
      phase: 'COURT_PROCESS',
      category: 'LEGAL_REQUIREMENT',
      orderIndex: orderIndex++,
      title: 'Publish Gazette Notice',
      description: 'Application must be published in Kenya Gazette',
      whatIsIt: 'Public notice of your application',
      whyNeeded: 'Allows creditors/objectors to come forward',
      howToGet: 'Court will arrange gazette publication',
      estimatedDays: 30,
      dependsOnTaskIds: [],
    });

    tasks.push({
      phase: 'COURT_PROCESS',
      category: 'LEGAL_REQUIREMENT',
      orderIndex: orderIndex++,
      title: 'Attend Court Hearing',
      description: 'Appear before judge or magistrate',
      whatIsIt: 'Court session to review your application',
      whyNeeded: 'Court needs to verify information',
      howToGet: 'Attend on scheduled date with all documents',
      estimatedDays: 1,
      dependsOnTaskIds: [],
    });

    // ========== PHASE 4: GRANT ISSUANCE ==========

    tasks.push({
      phase: 'GRANT_ISSUANCE',
      category: 'TAX_COMPLIANCE',
      orderIndex: orderIndex++,
      title: 'Obtain Tax Clearance',
      description: 'Get clearance from Kenya Revenue Authority',
      whatIsIt: 'Certificate that all taxes are paid',
      whyNeeded: 'Required before grant can be issued',
      howToGet: 'Apply at KRA with estate inventory',
      estimatedDays: 21,
      dependsOnTaskIds: [],
    });

    tasks.push({
      phase: 'GRANT_ISSUANCE',
      category: 'LEGAL_REQUIREMENT',
      orderIndex: orderIndex++,
      title: 'Receive Grant',
      description: 'Court issues grant of probate/administration',
      whatIsIt: 'Legal authority to distribute estate',
      whyNeeded: 'Allows you to access and transfer assets',
      howToGet: 'Collect from court registry',
      estimatedDays: 7,
      dependsOnTaskIds: [],
    });

    // ========== PHASE 5: DISTRIBUTION ==========

    tasks.push({
      phase: 'DISTRIBUTION',
      category: 'ASSET_DISCOVERY',
      orderIndex: orderIndex++,
      title: 'Transfer Assets to Beneficiaries',
      description: 'Distribute estate according to will or law',
      whatIsIt: 'Final distribution of inheritance',
      whyNeeded: 'Complete the succession process',
      howToGet: 'Use grant to transfer titles, bank accounts, etc.',
      estimatedDays: 60,
      dependsOnTaskIds: [],
    });

    return tasks;
  }
}
