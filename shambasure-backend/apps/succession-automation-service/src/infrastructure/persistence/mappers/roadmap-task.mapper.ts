// src/succession-automation/src/infrastructure/persistence/mappers/roadmap-task.mapper.ts
import { RoadmapTask as PrismaRoadmapTask } from '@prisma/client';

import {
  ExternalLink,
  LegalReference,
  ProofType,
  RoadmapTask,
  TaskCategory,
  TaskCondition,
  TaskHistoryEntry,
  TaskPriority,
  TaskStatus,
  TaskTrigger,
} from '../../../domain/entities/roadmap-task.entity';

/**
 * RoadmapTask Mapper
 *
 * PURPOSE: Translates between Domain Entity and Prisma Model for Roadmap Tasks
 *
 * COMPLEXITIES HANDLED:
 * 1. Nested objects (legalReferences, externalLinks, history) stored as JSON
 * 2. Multiple array fields stored as PostgreSQL arrays
 * 3. Complex conditions (TaskCondition[]) stored in existing JSON fields
 * 4. Court-specific instructions stored in existing JSON fields
 * 5. Date handling for multiple date fields
 * 6. Enum mapping for all domain enums
 * 7. Phase mapping from domain number to Prisma enum
 */

export class RoadmapTaskMapper {
  /**
   * Map Domain Entity to Prisma Model for CREATE operations
   * roadmapId is REQUIRED
   */
  public static toPersistenceCreate(domainEntity: RoadmapTask, roadmapId: string): any {
    if (!roadmapId) {
      throw new Error('RoadmapTask must have roadmapId for persistence');
    }

    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Build combined JSON objects for fields not in Prisma schema
    // We'll store autoStartConditions and skipConditions in legalReferences JSON
    const legalReferencesCombined = {
      references: props.legalReferences || [],
      autoStartConditions: props.autoStartConditions || [],
      skipConditions: props.skipConditions || [],
    };

    // Store courtSpecificInstructions in externalLinks JSON
    const externalLinksCombined = {
      links: props.externalLinks || [],
      courtSpecificInstructions: props.courtSpecificInstructions || {},
    };

    // Store proofDescription in proofDocumentType if available
    const proofDocumentType = props.proofDescription || props.proofDocumentType || null;

    // Build the persistence object
    const persistence: any = {
      // --- Core Identity ---
      title: props.title,
      description: props.description,
      shortCode: props.shortCode,
      category: this.mapDomainTaskCategoryToPrisma(props.category),
      priority: this.mapDomainTaskPriorityToPrisma(props.priority),

      // --- Status Management ---
      status: this.mapDomainTaskStatusToPrisma(props.status),

      // --- Dependencies & Ordering ---
      phase: this.mapDomainPhaseToPrisma(props.phase), // Map number to enum
      orderIndex: props.orderIndex,
      dependsOnTaskIds: props.dependsOnTaskIds || [],
      blocksTaskIds: props.blocksTaskIds || [],

      // --- Context Awareness ---
      applicableContexts: props.applicableContexts || [],
      legalReferences: JSON.stringify(legalReferencesCombined),
      triggers: props.triggers
        ? props.triggers.map((t) => this.mapDomainTaskTriggerToPrisma(t))
        : [],

      // --- Guidance & Instructions ---
      detailedInstructions: props.detailedInstructions || [],
      quickTips: props.quickTips || [],
      commonMistakes: props.commonMistakes || [],
      externalLinks: JSON.stringify(externalLinksCombined),
      estimatedTimeMinutes: props.estimatedTimeMinutes || 0,

      // --- Proof & Verification ---
      requiresProof: props.requiresProof || false,
      proofTypes: props.proofTypes
        ? props.proofTypes.map((p) => this.mapDomainProofTypeToPrisma(p))
        : [],
      proofDocumentType: proofDocumentType,

      // --- Timing & Scheduling ---
      dueDate: props.dueDate || null,
      startDate: props.startDate || null,
      endDate: props.endDate || null,
      startedAt: props.startedAt || null,
      completedAt: props.completedAt || null,
      skippedAt: props.skippedAt || null,
      lastRemindedAt: props.lastRemindedAt || null,

      // --- Completion Details ---
      completedBy: props.completedBy || null,
      completionNotes: props.completionNotes || null,
      skipReason: props.skipReason || null,
      waiverReason: props.waiverReason || null,
      failureReason: props.failureReason || null,

      // --- Alerts & Monitoring ---
      isOverdue: props.isOverdue || false,
      reminderIntervalDays: props.reminderIntervalDays || 7,
      escalationLevel: props.escalationLevel || 0,
      autoEscalateAfterDays: props.autoEscalateAfterDays || 14,

      // --- Performance Tracking ---
      timeSpentMinutes: props.timeSpentMinutes || 0,
      retryCount: props.retryCount || 0,
      lastAttemptedAt: props.lastAttemptedAt || null,

      // --- Metadata ---
      tags: props.tags || [],
      templateVersion: props.templateVersion || '1.0.0',
      createdBy: props.createdBy || 'system',
      lastModifiedBy: props.lastModifiedBy || 'system',
      lastModifiedAt: props.lastModifiedAt || new Date(),

      // --- Integration ---
      relatedRiskFlagIds: props.relatedRiskFlagIds || [],
      relatedDocumentGapIds: props.relatedDocumentGapIds || [],
      externalServiceId: props.externalServiceId || null,
      externalTaskId: props.externalTaskId || null,

      // --- Audit ---
      history: props.history ? JSON.stringify(props.history) : null,

      // --- Foreign Key ---
      roadmapId: roadmapId,
    };

    return persistence;
  }

  /**
   * Map Domain Entity to Prisma Model for UPDATE operations
   * Only includes fields that can be updated after creation
   */
  public static toPersistenceUpdate(domainEntity: RoadmapTask): any {
    // Get props from domain entity
    const props = (domainEntity as any).props;

    // Only include fields that can be updated
    const updateData: any = {
      // --- Status Management ---
      status: this.mapDomainTaskStatusToPrisma(props.status),
      priority: this.mapDomainTaskPriorityToPrisma(props.priority),

      // --- Dependencies (can be updated) ---
      dependsOnTaskIds: props.dependsOnTaskIds || [],
      blocksTaskIds: props.blocksTaskIds || [],

      // --- Guidance & Instructions (can be updated) ---
      detailedInstructions: props.detailedInstructions || [],
      quickTips: props.quickTips || [],
      commonMistakes: props.commonMistakes || [],

      // Store updated externalLinks with courtSpecificInstructions
      externalLinks:
        props.externalLinks || props.courtSpecificInstructions
          ? JSON.stringify({
              links: props.externalLinks || [],
              courtSpecificInstructions: props.courtSpecificInstructions || {},
            })
          : null,

      // --- Proof & Verification ---
      requiresProof: props.requiresProof || false,
      proofTypes: props.proofTypes
        ? props.proofTypes.map((p) => this.mapDomainProofTypeToPrisma(p))
        : [],
      proofDocumentType: props.proofDescription || props.proofDocumentType || null,

      // --- Timing & Scheduling ---
      dueDate: props.dueDate || null,
      startDate: props.startDate || null,
      endDate: props.endDate || null,
      startedAt: props.startedAt || null,
      completedAt: props.completedAt || null,
      skippedAt: props.skippedAt || null,
      lastRemindedAt: props.lastRemindedAt || null,

      // --- Completion Details ---
      completedBy: props.completedBy || null,
      completionNotes: props.completionNotes || null,
      skipReason: props.skipReason || null,
      waiverReason: props.waiverReason || null,
      failureReason: props.failureReason || null,

      // --- Alerts & Monitoring ---
      isOverdue: props.isOverdue || false,
      reminderIntervalDays: props.reminderIntervalDays || 7,
      escalationLevel: props.escalationLevel || 0,

      // --- Performance Tracking ---
      timeSpentMinutes: props.timeSpentMinutes || 0,
      retryCount: props.retryCount || 0,
      lastAttemptedAt: props.lastAttemptedAt || null,

      // --- Metadata ---
      tags: props.tags || [],
      lastModifiedBy: props.lastModifiedBy || 'system',
      lastModifiedAt: props.lastModifiedAt || new Date(),

      // --- Integration ---
      relatedRiskFlagIds: props.relatedRiskFlagIds || [],
      relatedDocumentGapIds: props.relatedDocumentGapIds || [],
      externalServiceId: props.externalServiceId || null,
      externalTaskId: props.externalTaskId || null,

      // --- Audit ---
      history: props.history ? JSON.stringify(props.history) : null,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    return updateData;
  }

  /**
   * Map Prisma Model to Domain Entity for READ operations
   */
  public static toDomain(prismaModel: PrismaRoadmapTask): RoadmapTask {
    if (!prismaModel) {
      throw new Error('Prisma model cannot be null');
    }

    // Validate required fields
    if (!prismaModel.title) {
      throw new Error('Prisma RoadmapTask must have title');
    }

    if (!prismaModel.category) {
      throw new Error('Prisma RoadmapTask must have category');
    }

    if (!prismaModel.priority) {
      throw new Error('Prisma RoadmapTask must have priority');
    }

    if (prismaModel.status === undefined || prismaModel.status === null) {
      throw new Error('Prisma RoadmapTask must have status');
    }

    // Parse JSON fields
    let legalReferences: LegalReference[] = [];
    let autoStartConditions: TaskCondition[] = [];
    let skipConditions: TaskCondition[] = [];

    if (prismaModel.legalReferences && typeof prismaModel.legalReferences === 'string') {
      try {
        const legalReferencesObj = JSON.parse(prismaModel.legalReferences);
        legalReferences = legalReferencesObj.references || [];
        autoStartConditions = legalReferencesObj.autoStartConditions || [];
        skipConditions = legalReferencesObj.skipConditions || [];
      } catch (error) {
        console.warn('Failed to parse legalReferences JSON:', error);
      }
    }

    let externalLinks: ExternalLink[] = [];
    let courtSpecificInstructions: Record<string, string> | undefined;

    if (prismaModel.externalLinks && typeof prismaModel.externalLinks === 'string') {
      try {
        const externalLinksObj = JSON.parse(prismaModel.externalLinks);
        externalLinks = externalLinksObj.links || [];
        courtSpecificInstructions = externalLinksObj.courtSpecificInstructions || {};
      } catch (error) {
        console.warn('Failed to parse externalLinks JSON:', error);
      }
    }

    let history: TaskHistoryEntry[] = [];
    if (prismaModel.history && typeof prismaModel.history === 'string') {
      try {
        history = JSON.parse(prismaModel.history);
      } catch (error) {
        console.warn('Failed to parse history JSON:', error);
      }
    }

    // Prepare domain properties
    const domainProps = {
      // --- Core Identity ---
      title: prismaModel.title,
      description: prismaModel.description,
      shortCode: prismaModel.shortCode,
      category: this.mapPrismaTaskCategoryToDomain(prismaModel.category),
      priority: this.mapPrismaTaskPriorityToDomain(prismaModel.priority),

      // --- Status Management ---
      status: this.mapPrismaTaskStatusToDomain(prismaModel.status),

      // --- Dependencies & Ordering ---
      phase: this.mapPrismaPhaseToDomain(prismaModel.phase), // Map enum to number
      orderIndex: prismaModel.orderIndex,
      dependsOnTaskIds: prismaModel.dependsOnTaskIds || [],
      blocksTaskIds: prismaModel.blocksTaskIds || [],

      // --- Context Awareness ---
      applicableContexts: prismaModel.applicableContexts || [],
      legalReferences: legalReferences,
      triggers: (prismaModel.triggers || []).map((t) => this.mapPrismaTaskTriggerToDomain(t)),
      autoStartConditions: autoStartConditions,
      skipConditions: skipConditions,

      // --- Guidance & Instructions ---
      detailedInstructions: prismaModel.detailedInstructions || [],
      quickTips: prismaModel.quickTips || [],
      commonMistakes: prismaModel.commonMistakes || [],
      externalLinks: externalLinks,
      estimatedTimeMinutes: prismaModel.estimatedTimeMinutes || 0,
      courtSpecificInstructions: courtSpecificInstructions,

      // --- Proof & Verification ---
      requiresProof: prismaModel.requiresProof || false,
      proofTypes: (prismaModel.proofTypes || []).map((p) => this.mapPrismaProofTypeToDomain(p)),
      proofDescription: prismaModel.proofDocumentType || undefined, // Use proofDocumentType for proofDescription
      proofDocumentType: prismaModel.proofDocumentType || undefined,

      // --- Timing & Scheduling ---
      dueDate: prismaModel.dueDate || undefined,
      startDate: prismaModel.startDate || undefined,
      endDate: prismaModel.endDate || undefined,
      startedAt: prismaModel.startedAt || undefined,
      completedAt: prismaModel.completedAt || undefined,
      skippedAt: prismaModel.skippedAt || undefined,
      lastRemindedAt: prismaModel.lastRemindedAt || undefined,

      // --- Completion Details ---
      completedBy: prismaModel.completedBy || undefined,
      completionNotes: prismaModel.completionNotes || undefined,
      skipReason: prismaModel.skipReason || undefined,
      waiverReason: prismaModel.waiverReason || undefined,
      failureReason: prismaModel.failureReason || undefined,

      // --- Alerts & Monitoring ---
      isOverdue: prismaModel.isOverdue || false,
      reminderIntervalDays: prismaModel.reminderIntervalDays || 7,
      escalationLevel: prismaModel.escalationLevel || 0,
      autoEscalateAfterDays: prismaModel.autoEscalateAfterDays || 14,

      // --- Performance Tracking ---
      timeSpentMinutes: prismaModel.timeSpentMinutes || 0,
      retryCount: prismaModel.retryCount || 0,
      lastAttemptedAt: prismaModel.lastAttemptedAt || undefined,

      // --- Metadata ---
      tags: prismaModel.tags || [],
      templateVersion: prismaModel.templateVersion || '1.0.0',
      createdBy: prismaModel.createdBy || 'system',
      lastModifiedBy: prismaModel.lastModifiedBy || 'system',
      lastModifiedAt: prismaModel.lastModifiedAt,

      // --- Integration ---
      relatedRiskFlagIds: prismaModel.relatedRiskFlagIds || [],
      relatedDocumentGapIds: prismaModel.relatedDocumentGapIds || [],
      externalServiceId: prismaModel.externalServiceId || undefined,
      externalTaskId: prismaModel.externalTaskId || undefined,

      // --- Audit ---
      history: history,
    };

    // Reconstitute the domain entity
    return RoadmapTask.reconstitute(
      prismaModel.id,
      domainProps as any,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }

  /**
   * Map multiple Prisma models to Domain Entities
   */
  public static toDomainArray(prismaModels: PrismaRoadmapTask[]): RoadmapTask[] {
    return prismaModels.map((model) => this.toDomain(model));
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainEntity: RoadmapTask): string | null {
    return domainEntity.id ? domainEntity.id.toString() : null;
  }

  // ==================== PHASE MAPPING ====================

  /**
   * Map Domain phase (number) to Prisma RoadmapPhase enum
   */
  private static mapDomainPhaseToPrisma(phase: number): string {
    const mapping: Record<number, string> = {
      1: 'PRE_FILING',
      2: 'FILING',
      3: 'CONFIRMATION',
      4: 'DISTRIBUTION',
      5: 'CLOSURE',
    };

    const prismaPhase = mapping[phase];
    if (!prismaPhase) {
      throw new Error(`Invalid domain phase: ${phase}. Must be 1-5.`);
    }
    return prismaPhase;
  }

  /**
   * Map Prisma RoadmapPhase enum to Domain phase (number)
   */
  private static mapPrismaPhaseToDomain(phase: string): number {
    const mapping: Record<string, number> = {
      PRE_FILING: 1,
      FILING: 2,
      CONFIRMATION: 3,
      DISTRIBUTION: 4,
      CLOSURE: 5,
    };

    const domainPhase = mapping[phase];
    if (!domainPhase) {
      throw new Error(`Invalid Prisma RoadmapPhase: ${phase}`);
    }
    return domainPhase;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain TaskStatus to Prisma string
   */
  private static mapDomainTaskStatusToPrisma(status: TaskStatus): string {
    const mapping: Record<TaskStatus, string> = {
      [TaskStatus.LOCKED]: 'LOCKED',
      [TaskStatus.PENDING]: 'PENDING',
      [TaskStatus.IN_PROGRESS]: 'IN_PROGRESS',
      [TaskStatus.COMPLETED]: 'COMPLETED',
      [TaskStatus.SKIPPED]: 'SKIPPED',
      [TaskStatus.WAIVED]: 'WAIVED',
      [TaskStatus.BLOCKED]: 'BLOCKED',
      [TaskStatus.FAILED]: 'FAILED',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid TaskStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma TaskStatus string to Domain
   */
  private static mapPrismaTaskStatusToDomain(status: string): TaskStatus {
    const mapping: Record<string, TaskStatus> = {
      LOCKED: TaskStatus.LOCKED,
      PENDING: TaskStatus.PENDING,
      IN_PROGRESS: TaskStatus.IN_PROGRESS,
      COMPLETED: TaskStatus.COMPLETED,
      SKIPPED: TaskStatus.SKIPPED,
      WAIVED: TaskStatus.WAIVED,
      BLOCKED: TaskStatus.BLOCKED,
      FAILED: TaskStatus.FAILED,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma TaskStatus: ${status}`);
    }
    return domainStatus;
  }

  /**
   * Map Domain TaskCategory to Prisma string
   */
  private static mapDomainTaskCategoryToPrisma(category: TaskCategory): string {
    const mapping: Record<TaskCategory, string> = {
      [TaskCategory.IDENTITY_VERIFICATION]: 'IDENTITY_VERIFICATION',
      [TaskCategory.FAMILY_STRUCTURE]: 'FAMILY_STRUCTURE',
      [TaskCategory.GUARDIANSHIP]: 'GUARDIANSHIP',
      [TaskCategory.ASSET_DISCOVERY]: 'ASSET_DISCOVERY',
      [TaskCategory.DEBT_SETTLEMENT]: 'DEBT_SETTLEMENT',
      [TaskCategory.DOCUMENT_COLLECTION]: 'DOCUMENT_COLLECTION',
      [TaskCategory.DOCUMENT_VALIDATION]: 'DOCUMENT_VALIDATION',
      [TaskCategory.CUSTOMARY_DOCUMENTS]: 'CUSTOMARY_DOCUMENTS',
      [TaskCategory.FORM_GENERATION]: 'FORM_GENERATION',
      [TaskCategory.FORM_REVIEW]: 'FORM_REVIEW',
      [TaskCategory.SIGNATURE_COLLECTION]: 'SIGNATURE_COLLECTION',
      [TaskCategory.COURT_SELECTION]: 'COURT_SELECTION',
      [TaskCategory.FEE_PAYMENT]: 'FEE_PAYMENT',
      [TaskCategory.LODGEMENT]: 'LODGEMENT',
      [TaskCategory.GAZETTE_PUBLICATION]: 'GAZETTE_PUBLICATION',
      [TaskCategory.COURT_ATTENDANCE]: 'COURT_ATTENDANCE',
      [TaskCategory.GRANT_ISSUANCE]: 'GRANT_ISSUANCE',
      [TaskCategory.GRANT_CONFIRMATION]: 'GRANT_CONFIRMATION',
      [TaskCategory.ASSET_TRANSFER]: 'ASSET_TRANSFER',
      [TaskCategory.DEBT_PAYMENT]: 'DEBT_PAYMENT',
      [TaskCategory.TAX_CLEARANCE]: 'TAX_CLEARANCE',
      [TaskCategory.FINAL_ACCOUNTS]: 'FINAL_ACCOUNTS',
      [TaskCategory.ESTATE_CLOSURE]: 'ESTATE_CLOSURE',
      [TaskCategory.BENEFICIARY_NOTIFICATION]: 'BENEFICIARY_NOTIFICATION',
      [TaskCategory.WILL_SPECIFIC]: 'WILL_SPECIFIC',
      [TaskCategory.ISLAMIC_SPECIFIC]: 'ISLAMIC_SPECIFIC',
      [TaskCategory.POLYGAMOUS_SPECIFIC]: 'POLYGAMOUS_SPECIFIC',
      [TaskCategory.MINOR_SPECIFIC]: 'MINOR_SPECIFIC',
      [TaskCategory.DISPUTE_RESOLUTION]: 'DISPUTE_RESOLUTION',
    };

    const prismaCategory = mapping[category];
    if (!prismaCategory) {
      throw new Error(`Invalid TaskCategory: ${category}`);
    }
    return prismaCategory;
  }

  /**
   * Map Prisma TaskCategory string to Domain
   */
  private static mapPrismaTaskCategoryToDomain(category: string): TaskCategory {
    const mapping: Record<string, TaskCategory> = {
      IDENTITY_VERIFICATION: TaskCategory.IDENTITY_VERIFICATION,
      FAMILY_STRUCTURE: TaskCategory.FAMILY_STRUCTURE,
      GUARDIANSHIP: TaskCategory.GUARDIANSHIP,
      ASSET_DISCOVERY: TaskCategory.ASSET_DISCOVERY,
      DEBT_SETTLEMENT: TaskCategory.DEBT_SETTLEMENT,
      DOCUMENT_COLLECTION: TaskCategory.DOCUMENT_COLLECTION,
      DOCUMENT_VALIDATION: TaskCategory.DOCUMENT_VALIDATION,
      CUSTOMARY_DOCUMENTS: TaskCategory.CUSTOMARY_DOCUMENTS,
      FORM_GENERATION: TaskCategory.FORM_GENERATION,
      FORM_REVIEW: TaskCategory.FORM_REVIEW,
      SIGNATURE_COLLECTION: TaskCategory.SIGNATURE_COLLECTION,
      COURT_SELECTION: TaskCategory.COURT_SELECTION,
      FEE_PAYMENT: TaskCategory.FEE_PAYMENT,
      LODGEMENT: TaskCategory.LODGEMENT,
      GAZETTE_PUBLICATION: TaskCategory.GAZETTE_PUBLICATION,
      COURT_ATTENDANCE: TaskCategory.COURT_ATTENDANCE,
      GRANT_ISSUANCE: TaskCategory.GRANT_ISSUANCE,
      GRANT_CONFIRMATION: TaskCategory.GRANT_CONFIRMATION,
      ASSET_TRANSFER: TaskCategory.ASSET_TRANSFER,
      DEBT_PAYMENT: TaskCategory.DEBT_PAYMENT,
      TAX_CLEARANCE: TaskCategory.TAX_CLEARANCE,
      FINAL_ACCOUNTS: TaskCategory.FINAL_ACCOUNTS,
      ESTATE_CLOSURE: TaskCategory.ESTATE_CLOSURE,
      BENEFICIARY_NOTIFICATION: TaskCategory.BENEFICIARY_NOTIFICATION,
      WILL_SPECIFIC: TaskCategory.WILL_SPECIFIC,
      ISLAMIC_SPECIFIC: TaskCategory.ISLAMIC_SPECIFIC,
      POLYGAMOUS_SPECIFIC: TaskCategory.POLYGAMOUS_SPECIFIC,
      MINOR_SPECIFIC: TaskCategory.MINOR_SPECIFIC,
      DISPUTE_RESOLUTION: TaskCategory.DISPUTE_RESOLUTION,
    };

    const domainCategory = mapping[category];
    if (!domainCategory) {
      throw new Error(`Invalid Prisma TaskCategory: ${category}`);
    }
    return domainCategory;
  }

  /**
   * Map Domain TaskPriority to Prisma string
   */
  private static mapDomainTaskPriorityToPrisma(priority: TaskPriority): string {
    const mapping: Record<TaskPriority, string> = {
      [TaskPriority.CRITICAL]: 'CRITICAL',
      [TaskPriority.HIGH]: 'HIGH',
      [TaskPriority.MEDIUM]: 'MEDIUM',
      [TaskPriority.LOW]: 'LOW',
    };

    const prismaPriority = mapping[priority];
    if (!prismaPriority) {
      throw new Error(`Invalid TaskPriority: ${priority}`);
    }
    return prismaPriority;
  }

  /**
   * Map Prisma TaskPriority string to Domain
   */
  private static mapPrismaTaskPriorityToDomain(priority: string): TaskPriority {
    const mapping: Record<string, TaskPriority> = {
      CRITICAL: TaskPriority.CRITICAL,
      HIGH: TaskPriority.HIGH,
      MEDIUM: TaskPriority.MEDIUM,
      LOW: TaskPriority.LOW,
    };

    const domainPriority = mapping[priority];
    if (!domainPriority) {
      throw new Error(`Invalid Prisma TaskPriority: ${priority}`);
    }
    return domainPriority;
  }

  /**
   * Map Domain TaskTrigger to Prisma string
   */
  private static mapDomainTaskTriggerToPrisma(trigger: TaskTrigger): string {
    const mapping: Record<TaskTrigger, string> = {
      [TaskTrigger.MANUAL]: 'MANUAL',
      [TaskTrigger.AUTOMATIC]: 'AUTOMATIC',
      [TaskTrigger.EVENT_DRIVEN]: 'EVENT_DRIVEN',
      [TaskTrigger.SCHEDULED]: 'SCHEDULED',
      [TaskTrigger.READINESS_BASED]: 'READINESS_BASED',
    };

    const prismaTrigger = mapping[trigger];
    if (!prismaTrigger) {
      throw new Error(`Invalid TaskTrigger: ${trigger}`);
    }
    return prismaTrigger;
  }

  /**
   * Map Prisma TaskTrigger string to Domain
   */
  private static mapPrismaTaskTriggerToDomain(trigger: string): TaskTrigger {
    const mapping: Record<string, TaskTrigger> = {
      MANUAL: TaskTrigger.MANUAL,
      AUTOMATIC: TaskTrigger.AUTOMATIC,
      EVENT_DRIVEN: TaskTrigger.EVENT_DRIVEN,
      SCHEDULED: TaskTrigger.SCHEDULED,
      READINESS_BASED: TaskTrigger.READINESS_BASED,
    };

    const domainTrigger = mapping[trigger];
    if (!domainTrigger) {
      throw new Error(`Invalid Prisma TaskTrigger: ${trigger}`);
    }
    return domainTrigger;
  }

  /**
   * Map Domain ProofType to Prisma string
   */
  private static mapDomainProofTypeToPrisma(proofType: ProofType): string {
    const mapping: Record<ProofType, string> = {
      [ProofType.DOCUMENT_UPLOAD]: 'DOCUMENT_UPLOAD',
      [ProofType.DIGITAL_SIGNATURE]: 'DIGITAL_SIGNATURE',
      [ProofType.SMS_VERIFICATION]: 'SMS_VERIFICATION',
      [ProofType.EMAIL_VERIFICATION]: 'EMAIL_VERIFICATION',
      [ProofType.COURT_RECEIPT]: 'COURT_RECEIPT',
      [ProofType.BANK_SLIP]: 'BANK_SLIP',
      [ProofType.WITNESS_SIGNATURE]: 'WITNESS_SIGNATURE',
      [ProofType.AFFIDAVIT]: 'AFFIDAVIT',
    };

    const prismaProofType = mapping[proofType];
    if (!prismaProofType) {
      throw new Error(`Invalid ProofType: ${proofType}`);
    }
    return prismaProofType;
  }

  /**
   * Map Prisma ProofType string to Domain
   */
  private static mapPrismaProofTypeToDomain(proofType: string): ProofType {
    const mapping: Record<string, ProofType> = {
      DOCUMENT_UPLOAD: ProofType.DOCUMENT_UPLOAD,
      DIGITAL_SIGNATURE: ProofType.DIGITAL_SIGNATURE,
      SMS_VERIFICATION: ProofType.SMS_VERIFICATION,
      EMAIL_VERIFICATION: ProofType.EMAIL_VERIFICATION,
      COURT_RECEIPT: ProofType.COURT_RECEIPT,
      BANK_SLIP: ProofType.BANK_SLIP,
      WITNESS_SIGNATURE: ProofType.WITNESS_SIGNATURE,
      AFFIDAVIT: ProofType.AFFIDAVIT,
    };

    const domainProofType = mapping[proofType];
    if (!domainProofType) {
      throw new Error(`Invalid Prisma ProofType: ${proofType}`);
    }
    return domainProofType;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract domain entity IDs from Prisma models
   */
  public static extractIds(prismaModels: PrismaRoadmapTask[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if task can be started based on status
   */
  public static canStart(prismaModel: PrismaRoadmapTask): boolean {
    return prismaModel.status === 'PENDING';
  }

  /**
   * Check if task can be completed based on status
   */
  public static canComplete(prismaModel: PrismaRoadmapTask): boolean {
    return prismaModel.status === 'IN_PROGRESS';
  }

  /**
   * Check if task can be skipped based on status
   */
  public static canSkip(prismaModel: PrismaRoadmapTask): boolean {
    return ['PENDING', 'IN_PROGRESS'].includes(prismaModel.status);
  }

  /**
   * Calculate days overdue
   */
  public static calculateDaysOverdue(prismaModel: PrismaRoadmapTask): number {
    if (!prismaModel.dueDate || prismaModel.status === 'COMPLETED') {
      return 0;
    }

    const now = new Date();
    const dueDate = new Date(prismaModel.dueDate);
    const overdueMs = now.getTime() - dueDate.getTime();
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));

    return Math.max(0, overdueDays);
  }

  /**
   * Calculate days remaining
   */
  public static calculateDaysRemaining(prismaModel: PrismaRoadmapTask): number | null {
    if (!prismaModel.dueDate) {
      return null;
    }

    const now = new Date();
    const dueDate = new Date(prismaModel.dueDate);
    const remainingMs = dueDate.getTime() - now.getTime();
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

    return Math.max(0, remainingDays);
  }

  /**
   * Get escalation level based on overdue days
   */
  public static getEscalationLevel(prismaModel: PrismaRoadmapTask): number {
    if (!prismaModel.isOverdue) {
      return 0;
    }

    const overdueDays = this.calculateDaysOverdue(prismaModel);
    const thresholds = [3, 7, 14]; // Same as domain entity

    if (overdueDays >= thresholds[2]) return 3;
    if (overdueDays >= thresholds[1]) return 2;
    if (overdueDays >= thresholds[0]) return 1;

    return 0;
  }

  /**
   * Check if reminder should be sent
   */
  public static shouldSendReminder(prismaModel: PrismaRoadmapTask): boolean {
    const completedStatuses = ['COMPLETED', 'SKIPPED', 'WAIVED'];
    if (completedStatuses.includes(prismaModel.status)) {
      return false;
    }

    if (!prismaModel.lastRemindedAt) {
      return true;
    }

    const now = new Date();
    const lastRemindedAt = new Date(prismaModel.lastRemindedAt);
    const daysSinceLastReminder =
      (now.getTime() - lastRemindedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceLastReminder >= (prismaModel.reminderIntervalDays || 7);
  }

  /**
   * Get task urgency score (for sorting)
   */
  public static getUrgencyScore(prismaModel: PrismaRoadmapTask): number {
    let score = 0;

    // Priority score
    const priorityScores: Record<string, number> = {
      CRITICAL: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25,
    };

    score += priorityScores[prismaModel.priority] || 0;

    // Overdue penalty
    if (prismaModel.isOverdue) {
      const overdueDays = this.calculateDaysOverdue(prismaModel);
      score += 50;
      score += overdueDays * 5;
    }

    // Due soon boost
    const daysRemaining = this.calculateDaysRemaining(prismaModel);
    if (daysRemaining !== null && daysRemaining <= 3) {
      score += (3 - daysRemaining) * 10;
    }

    // In progress tasks get slight boost
    if (prismaModel.status === 'IN_PROGRESS') {
      score += 10;
    }

    return score;
  }

  /**
   * Create update data for task completion
   */
  public static createCompletionUpdateData(
    userId: string,
    notes?: string,
    timeSpentMinutes?: number,
  ): Record<string, any> {
    const updateData: Record<string, any> = {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedBy: userId,
      completionNotes: notes || null,
      isOverdue: false,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    };

    if (timeSpentMinutes !== undefined) {
      updateData.timeSpentMinutes = timeSpentMinutes;
    }

    return updateData;
  }

  /**
   * Create update data for task start
   */
  public static createStartUpdateData(userId: string): Record<string, any> {
    return {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    };
  }

  /**
   * Create update data for task skip
   */
  public static createSkipUpdateData(userId: string, reason: string): Record<string, any> {
    return {
      status: 'SKIPPED',
      skippedAt: new Date(),
      skipReason: reason,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: PrismaRoadmapTask): string[] {
    const errors: string[] = [];

    if (!prismaModel.title) {
      errors.push('title is required');
    }

    if (!prismaModel.category) {
      errors.push('category is required');
    }

    if (!prismaModel.priority) {
      errors.push('priority is required');
    }

    if (!prismaModel.status) {
      errors.push('status is required');
    }

    // Convert phase string to number for validation
    const phaseNumber = this.mapPrismaPhaseToDomain(prismaModel.phase);
    if (phaseNumber < 1 || phaseNumber > 5) {
      errors.push('phase must be between 1 and 5');
    }

    if (prismaModel.orderIndex < 0) {
      errors.push('orderIndex cannot be negative');
    }

    if (prismaModel.estimatedTimeMinutes < 0) {
      errors.push('estimatedTimeMinutes cannot be negative');
    }

    if (prismaModel.timeSpentMinutes < 0) {
      errors.push('timeSpentMinutes cannot be negative');
    }

    if (prismaModel.retryCount < 0) {
      errors.push('retryCount cannot be negative');
    }

    // Validate status consistency
    if (prismaModel.completedAt && prismaModel.status !== 'COMPLETED') {
      errors.push('completedAt should only be set for COMPLETED tasks');
    }

    if (prismaModel.skippedAt && prismaModel.status !== 'SKIPPED') {
      errors.push('skippedAt should only be set for SKIPPED tasks');
    }

    return errors;
  }
}

// ==================== TYPE UTILITIES ====================

/**
 * Types for task operations
 */
export interface RoadmapTaskCreateData {
  title: string;
  description: string;
  shortCode: string;
  category: string;
  priority: string;
  status: string;
  phase: number; // Domain phase (1-5)
  orderIndex: number;
  roadmapId: string;
  createdBy: string;
}

export interface RoadmapTaskUpdateData {
  status?: string;
  priority?: string;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeSpentMinutes?: number;
  isOverdue?: boolean;
  completionNotes?: string;
  skipReason?: string;
  failureReason?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
}

/**
 * Types for task filtering
 */
export interface RoadmapTaskFilter {
  roadmapId?: string;
  status?: string[];
  category?: string[];
  priority?: string[];
  phase?: string[]; // Prisma phase enum values
  isOverdue?: boolean;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Types for task bulk operations
 */
export interface RoadmapTaskBulkUpdate {
  status?: string;
  priority?: string;
  dueDate?: Date;
  reminderIntervalDays?: number;
  tags?: string[];
}
