// src/succession-automation/src/application/roadmap/services/task-automation/auto-generator.service.ts
import { Injectable } from '@nestjs/common';
import { DocumentGapType } from 'apps/succession-automation-service/src/domain/value-objects/document-gap.vo';

import {
  ProofType,
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskTrigger,
} from '../../../../domain/entities/roadmap-task.entity';
import {
  SuccessionContext,
  SuccessionMarriageType,
  SuccessionRegime,
} from '../../../../domain/value-objects/succession-context.vo';
import { Result } from '../../../common/result';

/**
 * Service responsible for instantiating the correct tasks based on the legal context.
 * Acts as a Factory for RoadmapTask entities.
 */
@Injectable()
export class AutoGeneratorService {
  // FIX: Define prefixes locally to match Entity logic, since Entity property is private.
  private static readonly TASK_CODE_PREFIXES = {
    [TaskCategory.IDENTITY_VERIFICATION]: 'IDV',
    [TaskCategory.DOCUMENT_COLLECTION]: 'DOC',
    [TaskCategory.FORM_GENERATION]: 'FRM',
    [TaskCategory.LODGEMENT]: 'FIL',
    [TaskCategory.ASSET_TRANSFER]: 'AST',
    [TaskCategory.CUSTOMARY_DOCUMENTS]: 'CUST', // Added to match likely entity logic or generic fallback
    [TaskCategory.WILL_SPECIFIC]: 'WILL',
    [TaskCategory.POLYGAMOUS_SPECIFIC]: 'POLY',
    [TaskCategory.GUARDIANSHIP]: 'GUARD',
  };

  /**
   * Generates a complete list of tasks for a new roadmap based on the succession context.
   */
  public generateRoadmapTasks(context: SuccessionContext, estateId: string): Result<RoadmapTask[]> {
    try {
      const tasks: RoadmapTask[] = [];

      // Phase 1: Pre-Filing (Identity & Discovery)
      tasks.push(...this.generateIdentityTasks(context, estateId));
      tasks.push(...this.generateFamilyTasks(context, estateId));
      tasks.push(...this.generateAssetTasks(context, estateId));

      // Phase 2: Filing (Forms & Court)
      tasks.push(...this.generateFilingTasks(context, estateId));

      // Phase 3: Confirmation (Hearings)
      tasks.push(...this.generateConfirmationTasks(context, estateId));

      // Phase 4: Distribution
      tasks.push(...this.generateDistributionTasks(context, estateId));

      // Post-Processing: Link Dependencies
      this.linkStandardDependencies(tasks);

      return Result.ok(tasks);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to generate tasks'));
    }
  }

  // ==================== GENERATORS BY CATEGORY ====================

  private generateIdentityTasks(context: SuccessionContext, estateId: string): RoadmapTask[] {
    const tasks: RoadmapTask[] = [];

    // 1. Death Certificate (Universal)
    tasks.push(RoadmapTask.createDeathCertificateTask(estateId, 1, 1, 'system'));

    // 2. Intestate: Chief's Letter
    if (context.regime === SuccessionRegime.INTESTATE) {
      tasks.push(RoadmapTask.createChiefLetterTask(estateId, 1, 2, 'system'));
    }

    // 3. Testate: Will Search
    if (context.regime === SuccessionRegime.TESTATE) {
      tasks.push(
        RoadmapTask.create({
          title: 'Locate and Validate Original Will',
          description: 'Find the original Will and verify it has two witness signatures.',
          shortCode: 'WILL-FIND-001',
          category: TaskCategory.WILL_SPECIFIC,
          priority: TaskPriority.CRITICAL,
          status: TaskStatus.PENDING,
          phase: 1,
          orderIndex: 2,
          dependsOnTaskIds: [],
          blocksTaskIds: [],
          applicableContexts: ['TESTATE'],
          legalReferences: [
            {
              act: 'LSA',
              section: '11',
              description: 'Original Will required for Grant',
              isMandatory: true,
            },
          ],
          triggers: [TaskTrigger.MANUAL],
          detailedInstructions: [
            'Check safe deposit boxes',
            'Contact drafting lawyer',
            'Verify 2 witnesses signed',
          ],
          quickTips: ['Do not unstaple the Will - this invalidates it!'],
          commonMistakes: ['Submitting a photocopy instead of original'],
          externalLinks: [],
          estimatedTimeMinutes: 120,
          requiresProof: true,
          proofTypes: [ProofType.DOCUMENT_UPLOAD],
          proofDocumentType: DocumentGapType.ORIGINAL_WILL,
          isOverdue: false,
          reminderIntervalDays: 7,
          escalationLevel: 0,
          autoEscalateAfterDays: 14,
          timeSpentMinutes: 0,
          retryCount: 0,
          tags: ['will', 'mandatory'],
          templateVersion: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          lastModifiedAt: new Date(),
          relatedRiskFlagIds: [],
          relatedDocumentGapIds: [],
          history: [],
        }),
      );
    }

    return tasks;
  }

  private generateFamilyTasks(context: SuccessionContext, estateId: string): RoadmapTask[] {
    const tasks: RoadmapTask[] = [];
    let order = 10;

    // 1. Minor Guardianship
    if (context.isMinorInvolved) {
      tasks.push(
        RoadmapTask.createGuardianAppointmentTask(
          estateId,
          ['PLACEHOLDER_MINOR_ID'],
          1,
          order++,
          'system',
        ),
      );
    }

    // 2. Polygamy: House Identification
    if (context.marriageType === SuccessionMarriageType.POLYGAMOUS) {
      tasks.push(
        RoadmapTask.create({
          title: 'Define Houses and Dependants (Section 40)',
          description: 'List all wives and children in their respective houses.',
          shortCode: 'POLY-HOUSE-001',
          category: TaskCategory.POLYGAMOUS_SPECIFIC,
          priority: TaskPriority.HIGH,
          status: TaskStatus.LOCKED, // Unlocks after Death Cert
          phase: 1,
          orderIndex: order++,
          dependsOnTaskIds: [],
          blocksTaskIds: [],
          applicableContexts: ['POLYGAMOUS'],
          legalReferences: [
            { act: 'LSA', section: '40', description: 'Distribution by houses', isMandatory: true },
          ],
          triggers: [TaskTrigger.MANUAL],
          detailedInstructions: [
            'Create a list for each house',
            'Identify the head of each house (usually the widow)',
          ],
          quickTips: [],
          commonMistakes: [],
          externalLinks: [],
          estimatedTimeMinutes: 180,
          requiresProof: false,
          proofTypes: [],
          isOverdue: false,
          reminderIntervalDays: 5,
          escalationLevel: 0,
          autoEscalateAfterDays: 14,
          timeSpentMinutes: 0,
          retryCount: 0,
          tags: ['polygamy', 'family'],
          templateVersion: '1.0',
          createdBy: 'system',
          lastModifiedBy: 'system',
          lastModifiedAt: new Date(),
          relatedRiskFlagIds: [],
          relatedDocumentGapIds: [],
          history: [],
        }),
      );
    }

    return tasks;
  }

  private generateAssetTasks(_context: SuccessionContext, _estateId: string): RoadmapTask[] {
    return [];
  }

  private generateFilingTasks(context: SuccessionContext, _estateId: string): RoadmapTask[] {
    const tasks: RoadmapTask[] = [];
    const court = context.determineCourtJurisdiction();

    // 1. Generate Forms
    tasks.push(
      RoadmapTask.create({
        title: 'Generate P&A Forms',
        description: 'Generate and sign the required Probate & Administration forms.',
        shortCode: 'FORM-GEN-001',
        category: TaskCategory.FORM_GENERATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.LOCKED, // Depends on Phase 1
        phase: 2,
        orderIndex: 1,
        dependsOnTaskIds: [],
        blocksTaskIds: [],
        applicableContexts: ['ALL'],
        legalReferences: [],
        triggers: [TaskTrigger.AUTOMATIC],
        detailedInstructions: [
          'Review auto-generated PDF',
          'Print 3 copies',
          'Sign where indicated',
        ],
        quickTips: [],
        commonMistakes: [],
        externalLinks: [],
        estimatedTimeMinutes: 30,
        requiresProof: true,
        proofTypes: [ProofType.DOCUMENT_UPLOAD], // Upload signed forms
        isOverdue: false,
        reminderIntervalDays: 3,
        escalationLevel: 0,
        autoEscalateAfterDays: 7,
        timeSpentMinutes: 0,
        retryCount: 0,
        tags: ['forms', 'filing'],
        templateVersion: '1.0',
        createdBy: 'system',
        lastModifiedBy: 'system',
        lastModifiedAt: new Date(),
        relatedRiskFlagIds: [],
        relatedDocumentGapIds: [],
        history: [],
      }),
    );

    // 2. Filing
    tasks.push(RoadmapTask.createCourtFilingTask(court, 2, 5, [], 'system'));

    return tasks;
  }

  private generateConfirmationTasks(_context: SuccessionContext, _estateId: string): RoadmapTask[] {
    return []; // Placeholder
  }

  private generateDistributionTasks(_context: SuccessionContext, _estateId: string): RoadmapTask[] {
    return []; // Placeholder
  }

  // ==================== DEPENDENCY LINKING ====================

  /**
   * Intelligently links tasks based on standard workflows.
   */
  private linkStandardDependencies(tasks: RoadmapTask[]): void {
    const map = new Map<string, RoadmapTask>();
    tasks.forEach((t) => map.set(t.shortCode, t));

    // Helper to link
    const link = (parentCode: string, childCode: string) => {
      const parent = map.get(parentCode);
      const child = map.get(childCode);
      if (parent && child) {
        child.addDependency(parent.id.toString());
      }
    };

    // --- RULES ---

    // 1. Death Cert blocks EVERYTHING in Phase 2
    const deathCert = tasks.find((t) => t.category === TaskCategory.DOCUMENT_COLLECTION);
    if (deathCert) {
      tasks.filter((t) => t.phase > 1).forEach((t) => t.addDependency(deathCert.id.toString()));
    }

    // 2. Forms block Filing
    // FIX: Use local constant map instead of private static Entity property
    const filingPrefix = AutoGeneratorService.TASK_CODE_PREFIXES[TaskCategory.LODGEMENT] || 'FIL';
    link('FORM-GEN-001', `${filingPrefix}-001`);

    // 3. Chief's Letter blocks Filing (Intestate)
    const chiefLetter = tasks.find((t) => t.category === TaskCategory.CUSTOMARY_DOCUMENTS);
    const filing = tasks.find((t) => t.category === TaskCategory.LODGEMENT);

    if (chiefLetter && filing) {
      filing.addDependency(chiefLetter.id.toString());
    }
  }
}
