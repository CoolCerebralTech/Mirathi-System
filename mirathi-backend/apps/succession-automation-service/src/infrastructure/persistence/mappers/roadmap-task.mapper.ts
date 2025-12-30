// src/succession-automation/src/infrastructure/persistence/mappers/roadmap-task.mapper.ts
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
import { DocumentGapType } from '../../../domain/value-objects/document-gap.vo';

/**
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model RoadmapTask
 */
export interface PrismaRoadmapTaskModel {
  id: string;
  roadmapId: string;
  title: string;
  description: string;
  shortCode: string;
  category: string; // Enum
  priority: string; // Enum
  status: string; // Enum
  phase: string; // Enum
  orderIndex: number;

  // Array fields
  dependsOnTaskIds: string[];
  blocksTaskIds: string[];
  applicableContexts: string[];
  triggers: string[]; // Enum[]

  // JSON fields
  legalReferences: any; // { references: [], autoStartConditions: [], skipConditions: [] }
  externalLinks: any; // { links: [], courtSpecificInstructions: {} }
  history: any; // TaskHistoryEntry[]

  // Content arrays
  detailedInstructions: string[];
  quickTips: string[];
  commonMistakes: string[];

  // Timings
  estimatedTimeMinutes: number;
  dueDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  skippedAt: Date | null;
  lastRemindedAt: Date | null;

  // Proof
  requiresProof: boolean;
  proofTypes: string[]; // Enum[]
  proofDocumentType: string | null;

  // Completion
  completedBy: string | null;
  completionNotes: string | null;
  skipReason: string | null;
  waiverReason: string | null;
  failureReason: string | null;

  // Metrics
  isOverdue: boolean;
  reminderIntervalDays: number;
  escalationLevel: number;
  autoEscalateAfterDays: number;
  timeSpentMinutes: number;
  retryCount: number;
  lastAttemptedAt: Date | null;

  // Integration
  tags: string[];
  relatedRiskFlagIds: string[];
  relatedDocumentGapIds: string[];
  externalServiceId: string | null;
  externalTaskId: string | null;
  templateVersion: string | null;

  // Audit
  createdBy: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * RoadmapTask Mapper
 *
 * RESPONSIBILITY: Translates between Domain Entity and Prisma Model.
 * HANDLES: JSON Object serialization/deserialization, Enum conversion, and Date handling.
 */
export class RoadmapTaskMapper {
  /**
   * Map Domain Entity to Prisma Persistence Object (Create/Update Input)
   */
  public static toPersistence(domainEntity: RoadmapTask, roadmapId?: string): any {
    // 1. Validate FK if strictly creating
    if (!roadmapId && !domainEntity.id) {
      // logic for update vs create validation if needed
    }

    // Access props directly (using the pattern established in this project)
    const props = (domainEntity as any).props;

    // 2. Prepare JSON Objects
    // NOTE: We do NOT use JSON.stringify here. Prisma Client serializes Objects to JSON automatically.

    // Combine Legal Refs + Conditions into one JSON field
    const legalReferencesCombined = {
      references: props.legalReferences || [],
      autoStartConditions: props.autoStartConditions || [],
      skipConditions: props.skipConditions || [],
    };

    // Combine Links + Court Instructions into one JSON field
    const externalLinksCombined = {
      links: props.externalLinks || [],
      courtSpecificInstructions: props.courtSpecificInstructions || {},
    };

    // 3. Construct Persistence Object
    return {
      id: domainEntity.id.toString(),
      ...(roadmapId ? { roadmapId } : {}),

      // --- Core Identity ---
      title: props.title,
      description: props.description,
      shortCode: props.shortCode,
      category: props.category, // Maps to Enum
      priority: props.priority, // Maps to Enum

      // --- Status ---
      status: props.status, // Maps to Enum

      // --- Dependencies & Ordering ---
      phase: this.mapDomainPhaseToPrisma(props.phase),
      orderIndex: props.orderIndex,
      dependsOnTaskIds: props.dependsOnTaskIds || [],
      blocksTaskIds: props.blocksTaskIds || [],

      // --- Context ---
      applicableContexts: props.applicableContexts || [],
      triggers: props.triggers || [], // Enum array

      // --- JSON Fields (Passed as Objects) ---
      legalReferences: legalReferencesCombined,

      // --- Instructions ---
      detailedInstructions: props.detailedInstructions || [],
      quickTips: props.quickTips || [],
      commonMistakes: props.commonMistakes || [],

      // --- JSON Fields (Passed as Objects) ---
      externalLinks: externalLinksCombined,

      estimatedTimeMinutes: props.estimatedTimeMinutes || 0,

      // --- Proof ---
      requiresProof: props.requiresProof || false,
      proofTypes: props.proofTypes || [], // Enum array
      // Map domain DocumentGapType to string column
      proofDocumentType: props.proofDescription || props.proofDocumentType || null,

      // --- Timing ---
      dueDate: props.dueDate || null,
      startDate: props.startDate || null,
      endDate: props.endDate || null,
      startedAt: props.startedAt || null,
      completedAt: props.completedAt || null,
      skippedAt: props.skippedAt || null,
      lastRemindedAt: props.lastRemindedAt || null,

      // --- Completion ---
      completedBy: props.completedBy || null,
      completionNotes: props.completionNotes || null,
      skipReason: props.skipReason || null,
      waiverReason: props.waiverReason || null,
      failureReason: props.failureReason || null,

      // --- Metrics ---
      isOverdue: props.isOverdue || false,
      reminderIntervalDays: props.reminderIntervalDays || 7,
      escalationLevel: props.escalationLevel || 0,
      autoEscalateAfterDays: props.autoEscalateAfterDays || 14,
      timeSpentMinutes: props.timeSpentMinutes || 0,
      retryCount: props.retryCount || 0,
      lastAttemptedAt: props.lastAttemptedAt || null,

      // --- Metadata ---
      tags: props.tags || [],
      templateVersion: props.templateVersion || '1.0.0',
      createdBy: props.createdBy || 'system',
      lastModifiedBy: props.lastModifiedBy || 'system',

      // --- Integration ---
      relatedRiskFlagIds: props.relatedRiskFlagIds || [],
      relatedDocumentGapIds: props.relatedDocumentGapIds || [],
      externalServiceId: props.externalServiceId || null,
      externalTaskId: props.externalTaskId || null,

      // --- Audit (JSON) ---
      history: props.history || [],

      // Timestamps handled by Prisma, but updated here for consistency
      updatedAt: new Date(),
    };
  }

  /**
   * Map Prisma Model to Domain Entity
   */
  public static toDomain(raw: PrismaRoadmapTaskModel): RoadmapTask {
    if (!raw) {
      throw new Error('RoadmapTaskMapper: Cannot map null persistence model to domain.');
    }

    // 1. Unpack JSON fields carefully
    const legalRefsJson = this.parseJsonField(raw.legalReferences);
    const externalLinksJson = this.parseJsonField(raw.externalLinks);
    const historyJson = this.parseJsonField(raw.history);

    // 2. Extract nested data from JSON structures
    const legalReferences: LegalReference[] = legalRefsJson?.references || [];
    const autoStartConditions: TaskCondition[] = legalRefsJson?.autoStartConditions || [];
    const skipConditions: TaskCondition[] = legalRefsJson?.skipConditions || [];

    const externalLinks: ExternalLink[] = externalLinksJson?.links || [];
    const courtSpecificInstructions: Record<string, string> =
      externalLinksJson?.courtSpecificInstructions || {};

    const history: TaskHistoryEntry[] = Array.isArray(historyJson)
      ? historyJson.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp), // Ensure date strings are hydrated back to Dates
        }))
      : [];

    // 3. Construct Domain Props
    const props = {
      // Identity
      title: raw.title,
      description: raw.description,
      shortCode: raw.shortCode,
      category: raw.category as TaskCategory,
      priority: raw.priority as TaskPriority,
      status: raw.status as TaskStatus,

      // Phases
      phase: this.mapPrismaPhaseToDomain(raw.phase),
      orderIndex: raw.orderIndex,

      // Arrays
      dependsOnTaskIds: raw.dependsOnTaskIds,
      blocksTaskIds: raw.blocksTaskIds,
      applicableContexts: raw.applicableContexts,
      triggers: (raw.triggers || []).map((t) => t as TaskTrigger),

      // Extracted from JSON
      legalReferences,
      autoStartConditions,
      skipConditions,
      externalLinks,
      courtSpecificInstructions,

      // Instructions
      detailedInstructions: raw.detailedInstructions,
      quickTips: raw.quickTips,
      commonMistakes: raw.commonMistakes,

      // Proof
      estimatedTimeMinutes: raw.estimatedTimeMinutes,
      requiresProof: raw.requiresProof,
      proofTypes: (raw.proofTypes || []).map((p) => p as ProofType),
      // Map string column back to DocumentGapType (casting as it matches enum string)
      proofDocumentType: raw.proofDocumentType as DocumentGapType | undefined,
      proofDescription: raw.proofDocumentType || undefined, // Fallback mapping

      // Dates
      dueDate: raw.dueDate || undefined,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      startedAt: raw.startedAt || undefined,
      completedAt: raw.completedAt || undefined,
      skippedAt: raw.skippedAt || undefined,
      lastRemindedAt: raw.lastRemindedAt || undefined,
      lastAttemptedAt: raw.lastAttemptedAt || undefined,

      // Completion
      completedBy: raw.completedBy || undefined,
      completionNotes: raw.completionNotes || undefined,
      skipReason: raw.skipReason || undefined,
      waiverReason: raw.waiverReason || undefined,
      failureReason: raw.failureReason || undefined,

      // Metrics
      isOverdue: raw.isOverdue,
      reminderIntervalDays: raw.reminderIntervalDays,
      escalationLevel: raw.escalationLevel,
      autoEscalateAfterDays: raw.autoEscalateAfterDays,
      timeSpentMinutes: raw.timeSpentMinutes,
      retryCount: raw.retryCount,

      // Metadata
      tags: raw.tags,
      templateVersion: raw.templateVersion || '1.0.0',
      createdBy: raw.createdBy || 'system',
      lastModifiedBy: raw.lastModifiedBy || 'system',
      lastModifiedAt: raw.lastModifiedAt,

      // Integration
      relatedRiskFlagIds: raw.relatedRiskFlagIds,
      relatedDocumentGapIds: raw.relatedDocumentGapIds,
      externalServiceId: raw.externalServiceId || undefined,
      externalTaskId: raw.externalTaskId || undefined,

      // Audit
      history,
    };

    // 4. Reconstitute
    return RoadmapTask.reconstitute(raw.id, props, raw.createdAt, raw.updatedAt);
  }

  // ==================== HELPERS ====================

  /**
   * Safe JSON parser that handles both Objects (Prisma default) and Strings (Raw queries)
   */
  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('RoadmapTaskMapper: Failed to parse JSON string', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Map Domain phase (1-5) to Prisma Enum
   */
  private static mapDomainPhaseToPrisma(phase: number): string {
    const mapping: Record<number, string> = {
      1: 'PRE_FILING',
      2: 'FILING',
      3: 'CONFIRMATION',
      4: 'DISTRIBUTION',
      5: 'CLOSURE',
    };
    return mapping[phase] || 'PRE_FILING';
  }

  /**
   * Map Prisma Enum to Domain phase (1-5)
   */
  private static mapPrismaPhaseToDomain(phase: string): number {
    const mapping: Record<string, number> = {
      PRE_FILING: 1,
      FILING: 2,
      CONFIRMATION: 3,
      DISTRIBUTION: 4,
      CLOSURE: 5,
    };
    return mapping[phase] || 1;
  }
}
