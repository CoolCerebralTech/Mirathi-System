// src/succession-automation/src/infrastructure/persistence/mappers/executor-roadmap.mapper.ts
import {
  ExecutorRoadmap,
  PhaseProgress,
  RoadmapAnalytics,
  RoadmapPhase,
  RoadmapStatus,
} from '../../../domain/aggregates/executor-roadmap.aggregate';
import { RoadmapTask } from '../../../domain/entities/roadmap-task.entity';
import { ReadinessScore } from '../../../domain/value-objects/readiness-score.vo';
import { SuccessionContext } from '../../../domain/value-objects/succession-context.vo';
import { PrismaRoadmapTaskModel, RoadmapTaskMapper } from './roadmap-task.mapper';

/**
 * Interface representing the Raw Prisma Model Structure
 * Based on schema.prisma: model ExecutorRoadmap
 */
export interface PrismaExecutorRoadmapModel {
  id: string;
  estateId: string;
  readinessAssessmentId: string;

  // JSON Value Objects
  successionContext: any; // Json
  readinessScore: any; // Json

  // Enums
  currentPhase: string;
  status: string;

  percentComplete: number;

  // Complex JSON structures
  phases: any; // Json (Map-like object)
  phaseHistory: any; // Json (Array)
  analytics: any; // Json

  // Counters
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  overdueTasks: number;
  blockedTasks: number;

  // Timing
  startedAt: Date;
  estimatedCompletionDate: Date | null;
  actualCompletionDate: Date | null;
  totalTimeSpentHours: number;

  // Arrays
  blockedByRiskIds: string[];
  resolvesRiskIds: string[];
  linkedDocumentGaps: string[];

  // User & Automation
  userId: string;
  executorName: string;
  lastActiveAt: Date;
  daysInactive: number;
  autoTransitionEnabled: boolean;
  autoTaskGenerationEnabled: boolean;
  escalationThresholdDays: number;

  // Metadata
  version: number;
  lastOptimizedAt: Date | null;
  optimizationCount: number;
  notes: string | null;
  internalNotes: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * ExecutorRoadmap Mapper
 *
 * PURPOSE: Translates between ExecutorRoadmap Aggregate Root and Prisma Models.
 * HANDLES: Aggregate reconstruction, JSON Map hydration, and child entity mapping.
 */
export class ExecutorRoadmapMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE/UPDATE operations
   * Returns tuple: [RoadmapData, TasksData[]]
   * Tasks are handled separately because they are a separate table in Prisma.
   */
  public static toPersistence(domainAggregate: ExecutorRoadmap): {
    roadmap: any;
    tasks: any[];
  } {
    const props = (domainAggregate as any).props;

    // 1. Convert phases Map to Plain Object for JSON storage
    const phasesObject: Record<string, PhaseProgress> = {};
    if (props.phases && props.phases instanceof Map) {
      props.phases.forEach((value: PhaseProgress, key: RoadmapPhase) => {
        phasesObject[key] = value;
      });
    }

    // 2. Build Roadmap Persistence Object
    // NOTE: Prisma handles JSON serialization automatically. Do NOT use JSON.stringify().
    const roadmapPersistence = {
      id: domainAggregate.id.toString(),
      estateId: props.estateId,
      readinessAssessmentId: props.readinessAssessmentId,

      // Value Objects -> JSON
      successionContext: props.successionContext ? props.successionContext.toJSON() : null,
      readinessScore: props.readinessScore ? props.readinessScore.toJSON() : null,

      // Enums
      currentPhase: props.currentPhase, // Enum
      status: props.status, // Enum

      percentComplete: props.percentComplete,

      // Complex Structures -> JSON Objects
      phases: phasesObject,
      phaseHistory: props.phaseHistory || [],
      analytics: props.analytics || null,

      // Counters
      totalTasks: props.totalTasks,
      completedTasks: props.completedTasks,
      skippedTasks: props.skippedTasks,
      overdueTasks: props.overdueTasks,
      blockedTasks: props.blockedTasks,

      // Timing
      startedAt: props.startedAt,
      estimatedCompletionDate: props.estimatedCompletionDate || null,
      actualCompletionDate: props.actualCompletionDate || null,
      totalTimeSpentHours: props.totalTimeSpentHours,

      // Arrays
      blockedByRiskIds: props.blockedByRiskIds || [],
      resolvesRiskIds: props.resolvesRiskIds || [],
      linkedDocumentGaps: props.linkedDocumentGaps || [],

      // User & Automation
      userId: props.userId,
      executorName: props.executorName,
      lastActiveAt: props.lastActiveAt,
      daysInactive: props.daysInactive,
      autoTransitionEnabled: props.autoTransitionEnabled,
      autoTaskGenerationEnabled: props.autoTaskGenerationEnabled,
      escalationThresholdDays: props.escalationThresholdDays,

      // Metadata
      version: props.version,
      lastOptimizedAt: props.lastOptimizedAt || null,
      optimizationCount: props.optimizationCount,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,

      updatedAt: new Date(),
    };

    // 3. Map Child Tasks
    // Tasks must be persisted via their own Mapper/Repo calls usually,
    // but we prepare the data here.
    const tasksPersistence: any[] = [];
    if (props.tasks && Array.isArray(props.tasks)) {
      props.tasks.forEach((task: RoadmapTask) => {
        try {
          // Pass roadmapId to child mapper
          const taskData = RoadmapTaskMapper.toPersistence(task, domainAggregate.id.toString());
          tasksPersistence.push(taskData);
        } catch (error) {
          console.warn(`Failed to map task ${task.id.toString()}:`, error);
        }
      });
    }

    return {
      roadmap: roadmapPersistence,
      tasks: tasksPersistence,
    };
  }

  /**
   * Map Prisma Model to Domain Aggregate for READ operations
   * Reconstructs the entire aggregate tree including Tasks.
   */
  public static toDomain(
    prismaRoadmap: PrismaExecutorRoadmapModel,
    prismaTasks: PrismaRoadmapTaskModel[] = [],
  ): ExecutorRoadmap {
    if (!prismaRoadmap) {
      throw new Error('ExecutorRoadmapMapper: Prisma roadmap cannot be null');
    }

    // 1. Hydrate JSON Fields
    const phasesJson = this.parseJsonField(prismaRoadmap.phases);
    const phaseHistoryJson = this.parseJsonField(prismaRoadmap.phaseHistory);
    const analyticsJson = this.parseJsonField(prismaRoadmap.analytics);
    const contextJson = this.parseJsonField(prismaRoadmap.successionContext);
    const scoreJson = this.parseJsonField(prismaRoadmap.readinessScore);

    // 2. Reconstruct Phases Map
    const phases = new Map<RoadmapPhase, PhaseProgress>();
    if (phasesJson) {
      Object.entries(phasesJson).forEach(([key, value]) => {
        // Ensure key is a valid Enum
        const phaseKey = key as RoadmapPhase;
        phases.set(phaseKey, value as PhaseProgress);
      });
    }

    // 3. Reconstruct Phase History
    const phaseHistory = Array.isArray(phaseHistoryJson)
      ? phaseHistoryJson.map((item: any) => ({
          phase: item.phase as RoadmapPhase,
          enteredAt: new Date(item.enteredAt),
          exitedAt: item.exitedAt ? new Date(item.exitedAt) : undefined,
          durationDays: item.durationDays,
        }))
      : [];

    // 4. Reconstruct Value Objects
    // Assuming factory methods exists on VOs (e.g., fromJSON or reconstitute)
    // If not, we instantiate manually based on structure
    let successionContext: SuccessionContext;
    if (contextJson) {
      // Assuming SuccessionContext has a static reconstitute method
      successionContext = SuccessionContext.fromJSON(contextJson);
    } else {
      throw new Error('SuccessionContext is missing in persistence');
    }

    let readinessScore: ReadinessScore | undefined;
    if (scoreJson) {
      readinessScore = ReadinessScore.fromJSON(scoreJson);
    }

    // 5. Convert Child Tasks
    const tasks: RoadmapTask[] = prismaTasks.map((t) => RoadmapTaskMapper.toDomain(t));

    // 6. Prepare Domain Props
    const domainProps = {
      estateId: prismaRoadmap.estateId,
      readinessAssessmentId: prismaRoadmap.readinessAssessmentId,

      successionContext,
      readinessScore,

      currentPhase: prismaRoadmap.currentPhase as RoadmapPhase,
      status: prismaRoadmap.status as RoadmapStatus,
      percentComplete: prismaRoadmap.percentComplete,

      tasks, // Child entities
      phases, // Reconstructed Map
      phaseHistory,

      totalTasks: prismaRoadmap.totalTasks,
      completedTasks: prismaRoadmap.completedTasks,
      skippedTasks: prismaRoadmap.skippedTasks,
      overdueTasks: prismaRoadmap.overdueTasks,
      blockedTasks: prismaRoadmap.blockedTasks,

      startedAt: prismaRoadmap.startedAt,
      estimatedCompletionDate: prismaRoadmap.estimatedCompletionDate || undefined,
      actualCompletionDate: prismaRoadmap.actualCompletionDate || undefined,
      totalTimeSpentHours: prismaRoadmap.totalTimeSpentHours,

      blockedByRiskIds: prismaRoadmap.blockedByRiskIds,
      resolvesRiskIds: prismaRoadmap.resolvesRiskIds,
      linkedDocumentGaps: prismaRoadmap.linkedDocumentGaps,

      analytics: analyticsJson as RoadmapAnalytics,

      userId: prismaRoadmap.userId,
      executorName: prismaRoadmap.executorName,
      lastActiveAt: prismaRoadmap.lastActiveAt,
      daysInactive: prismaRoadmap.daysInactive,

      autoTransitionEnabled: prismaRoadmap.autoTransitionEnabled,
      autoTaskGenerationEnabled: prismaRoadmap.autoTaskGenerationEnabled,
      escalationThresholdDays: prismaRoadmap.escalationThresholdDays,

      version: prismaRoadmap.version,
      lastOptimizedAt: prismaRoadmap.lastOptimizedAt || undefined,
      optimizationCount: prismaRoadmap.optimizationCount,
      notes: prismaRoadmap.notes || undefined,
      internalNotes: prismaRoadmap.internalNotes || undefined,
    };

    // 7. Reconstitute Aggregate
    return ExecutorRoadmap.reconstitute(
      prismaRoadmap.id,
      domainProps,
      prismaRoadmap.createdAt,
      prismaRoadmap.updatedAt,
      prismaRoadmap.version,
    );
  }

  // ==================== HELPERS ====================

  /**
   * Safe JSON parser
   */
  private static parseJsonField(field: any): any {
    if (field === null || field === undefined) return null;
    if (typeof field === 'object') return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        console.warn('ExecutorRoadmapMapper: Failed to parse JSON string', e);
        return null;
      }
    }
    return null;
  }
}
