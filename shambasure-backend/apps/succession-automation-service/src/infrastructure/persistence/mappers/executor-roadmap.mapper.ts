// src/succession-automation/src/infrastructure/persistence/mappers/executor-roadmap.mapper.ts
import {
  ExecutorRoadmap as PrismaExecutorRoadmap,
  RoadmapTask as PrismaRoadmapTask,
} from '@prisma/client';

import {
  ExecutorRoadmap,
  PhaseProgress,
  RoadmapAnalytics,
  RoadmapPhase,
  RoadmapStatus,
} from '../../../domain/aggregates/executor-roadmap.aggregate';
import { RoadmapTask } from '../../../domain/entities/roadmap-task.entity';
import { RoadmapTaskMapper } from './roadmap-task.mapper';

/**
 * ExecutorRoadmap Mapper
 *
 * PURPOSE: Translates between ExecutorRoadmap Aggregate Root and Prisma Models
 *
 * COMPLEXITIES HANDLED:
 * 1. Aggregate Root with child entities (RoadmapTask)
 * 2. Map<RoadmapPhase, PhaseProgress> stored as JSON
 * 3. Complex nested objects (analytics, phaseHistory)
 * 4. Domain Value Objects (SuccessionContext, ReadinessScore)
 * 5. Multi-table persistence coordination
 */

export class ExecutorRoadmapMapper {
  /**
   * Map Domain Aggregate to Prisma Model for CREATE operations
   * Returns roadmap data and separate tasks data
   */
  public static toPersistenceCreate(domainAggregate: ExecutorRoadmap): {
    roadmap: any;
    tasks: any[];
  } {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Convert phases Map to JSON-serializable object
    const phasesObject: Record<string, PhaseProgress> = {};
    if (props.phases && props.phases instanceof Map) {
      props.phases.forEach((value: PhaseProgress, key: RoadmapPhase) => {
        phasesObject[key] = value;
      });
    }

    // Build roadmap persistence object
    const roadmapPersistence: any = {
      // --- Core Identity ---
      estateId: props.estateId,
      readinessAssessmentId: props.readinessAssessmentId,

      // --- Context (JSON) ---
      successionContext: props.successionContext
        ? JSON.stringify(props.successionContext.toJSON())
        : null,
      readinessScore: props.readinessScore ? JSON.stringify(props.readinessScore.toJSON()) : null,

      // --- Current State ---
      currentPhase: this.mapDomainRoadmapPhaseToPrisma(props.currentPhase),
      status: this.mapDomainRoadmapStatusToPrisma(props.status),
      percentComplete: props.percentComplete,

      // --- Phase Tracking (JSON) ---
      phases: phasesObject ? JSON.stringify(phasesObject) : null,
      phaseHistory: props.phaseHistory ? JSON.stringify(props.phaseHistory) : null,

      // --- Counters ---
      totalTasks: props.totalTasks,
      completedTasks: props.completedTasks,
      skippedTasks: props.skippedTasks,
      overdueTasks: props.overdueTasks,
      blockedTasks: props.blockedTasks,

      // --- Time Tracking ---
      startedAt: props.startedAt,
      estimatedCompletionDate: props.estimatedCompletionDate || null,
      actualCompletionDate: props.actualCompletionDate || null,
      totalTimeSpentHours: props.totalTimeSpentHours,

      // --- Risk Integration ---
      blockedByRiskIds: props.blockedByRiskIds || [],
      resolvesRiskIds: props.resolvesRiskIds || [],
      linkedDocumentGaps: props.linkedDocumentGaps || [],

      // --- Analytics (JSON) ---
      analytics: props.analytics ? JSON.stringify(props.analytics) : null,

      // --- User Progress ---
      userId: props.userId,
      executorName: props.executorName,
      lastActiveAt: props.lastActiveAt,
      daysInactive: props.daysInactive,

      // --- Automation ---
      autoTransitionEnabled: props.autoTransitionEnabled || true,
      autoTaskGenerationEnabled: props.autoTaskGenerationEnabled || true,
      escalationThresholdDays: props.escalationThresholdDays || 14,

      // --- Metadata ---
      version: props.version || 1,
      lastOptimizedAt: props.lastOptimizedAt || null,
      optimizationCount: props.optimizationCount || 0,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
    };

    // Map tasks using RoadmapTaskMapper
    const tasksPersistence: any[] = [];
    if (props.tasks && Array.isArray(props.tasks)) {
      props.tasks.forEach((task: RoadmapTask) => {
        try {
          const taskData = RoadmapTaskMapper.toPersistenceCreate(
            task,
            domainAggregate.id.toString(),
          );
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
   * Map Domain Aggregate to Prisma Model for UPDATE operations
   * Only includes fields that can be updated
   */
  public static toPersistenceUpdate(domainAggregate: ExecutorRoadmap): any {
    // Get props from domain aggregate
    const props = (domainAggregate as any).props;

    // Convert phases Map to JSON-serializable object
    const phasesObject: Record<string, PhaseProgress> = {};
    if (props.phases && props.phases instanceof Map) {
      props.phases.forEach((value: PhaseProgress, key: RoadmapPhase) => {
        phasesObject[key] = value;
      });
    }

    // Only include fields that can be updated
    const updateData: any = {
      // --- Current State ---
      currentPhase: this.mapDomainRoadmapPhaseToPrisma(props.currentPhase),
      status: this.mapDomainRoadmapStatusToPrisma(props.status),
      percentComplete: props.percentComplete,

      // --- Phase Tracking ---
      phases: phasesObject ? JSON.stringify(phasesObject) : null,
      phaseHistory: props.phaseHistory ? JSON.stringify(props.phaseHistory) : null,

      // --- Counters ---
      totalTasks: props.totalTasks,
      completedTasks: props.completedTasks,
      skippedTasks: props.skippedTasks,
      overdueTasks: props.overdueTasks,
      blockedTasks: props.blockedTasks,

      // --- Time Tracking ---
      estimatedCompletionDate: props.estimatedCompletionDate || null,
      actualCompletionDate: props.actualCompletionDate || null,
      totalTimeSpentHours: props.totalTimeSpentHours,

      // --- Risk Integration ---
      blockedByRiskIds: props.blockedByRiskIds || [],
      resolvesRiskIds: props.resolvesRiskIds || [],
      linkedDocumentGaps: props.linkedDocumentGaps || [],

      // --- Analytics ---
      analytics: props.analytics ? JSON.stringify(props.analytics) : null,

      // --- User Progress ---
      lastActiveAt: props.lastActiveAt,
      daysInactive: props.daysInactive,

      // --- Automation ---
      autoTransitionEnabled: props.autoTransitionEnabled,
      escalationThresholdDays: props.escalationThresholdDays,

      // --- Metadata ---
      version: props.version,
      lastOptimizedAt: props.lastOptimizedAt || null,
      optimizationCount: props.optimizationCount,
      notes: props.notes || null,
      internalNotes: props.internalNotes || null,
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
   * Map Prisma Model to Domain Aggregate for READ operations
   * This is a complex operation that reconstructs the entire aggregate
   */
  public static toDomain(
    prismaRoadmap: PrismaExecutorRoadmap,
    prismaTasks: PrismaRoadmapTask[],
  ): ExecutorRoadmap {
    if (!prismaRoadmap) {
      throw new Error('Prisma roadmap cannot be null');
    }

    // Validate required fields
    if (!prismaRoadmap.estateId) {
      throw new Error('Prisma ExecutorRoadmap must have estateId');
    }

    if (!prismaRoadmap.readinessAssessmentId) {
      throw new Error('Prisma ExecutorRoadmap must have readinessAssessmentId');
    }

    if (!prismaRoadmap.userId) {
      throw new Error('Prisma ExecutorRoadmap must have userId');
    }

    if (!prismaRoadmap.executorName) {
      throw new Error('Prisma ExecutorRoadmap must have executorName');
    }

    // Parse JSON fields
    let successionContext: any = null;
    if (prismaRoadmap.successionContext && typeof prismaRoadmap.successionContext === 'string') {
      try {
        successionContext = JSON.parse(prismaRoadmap.successionContext);
      } catch (error) {
        console.warn('Failed to parse successionContext JSON:', error);
      }
    }

    let readinessScore: any = null;
    if (prismaRoadmap.readinessScore && typeof prismaRoadmap.readinessScore === 'string') {
      try {
        readinessScore = JSON.parse(prismaRoadmap.readinessScore);
      } catch (error) {
        console.warn('Failed to parse readinessScore JSON:', error);
      }
    }

    const phases = new Map<RoadmapPhase, PhaseProgress>();
    if (prismaRoadmap.phases && typeof prismaRoadmap.phases === 'string') {
      try {
        const phasesObject = JSON.parse(prismaRoadmap.phases);
        Object.entries(phasesObject).forEach(([key, value]) => {
          const phase = this.mapPrismaRoadmapPhaseToDomain(key);
          phases.set(phase, value as PhaseProgress);
        });
      } catch (error) {
        console.warn('Failed to parse phases JSON:', error);
      }
    }

    let phaseHistory: Array<{
      phase: RoadmapPhase;
      enteredAt: Date;
      exitedAt?: Date;
      durationDays?: number;
    }> = [];
    if (prismaRoadmap.phaseHistory && typeof prismaRoadmap.phaseHistory === 'string') {
      try {
        const parsedHistory = JSON.parse(prismaRoadmap.phaseHistory);
        phaseHistory = parsedHistory.map((item: any) => ({
          phase: this.mapPrismaRoadmapPhaseToDomain(item.phase),
          enteredAt: new Date(item.enteredAt),
          exitedAt: item.exitedAt ? new Date(item.exitedAt) : undefined,
          durationDays: item.durationDays,
        }));
      } catch (error) {
        console.warn('Failed to parse phaseHistory JSON:', error);
      }
    }

    let analytics: RoadmapAnalytics = {
      estimatedTotalTimeDays: 0,
      estimatedCostKES: 0,
      complexityScore: 0,
      riskExposure: 0,
      predictedBottlenecks: [],
      recommendedAccelerations: [],
    };
    if (prismaRoadmap.analytics && typeof prismaRoadmap.analytics === 'string') {
      try {
        analytics = JSON.parse(prismaRoadmap.analytics);
      } catch (error) {
        console.warn('Failed to parse analytics JSON:', error);
      }
    }

    // Convert tasks
    const tasks: RoadmapTask[] = prismaTasks.map((task) => {
      try {
        return RoadmapTaskMapper.toDomain(task);
      } catch (error) {
        console.warn(`Failed to convert task ${task.id}:`, error);
        throw error;
      }
    });

    // Prepare domain properties
    const domainProps = {
      // --- Identity & Context ---
      estateId: prismaRoadmap.estateId,
      successionContext, // Note: This is a raw object, domain will handle VO creation
      readinessAssessmentId: prismaRoadmap.readinessAssessmentId,
      readinessScore, // Note: This is a raw object, domain will handle VO creation

      // --- Current State ---
      currentPhase: this.mapPrismaRoadmapPhaseToDomain(prismaRoadmap.currentPhase),
      status: this.mapPrismaRoadmapStatusToDomain(prismaRoadmap.status),
      percentComplete: prismaRoadmap.percentComplete,

      // --- Task Collection ---
      tasks: tasks,

      // --- Phase Tracking ---
      phases: phases,
      phaseHistory: phaseHistory,

      // --- Completion Tracking ---
      totalTasks: prismaRoadmap.totalTasks,
      completedTasks: prismaRoadmap.completedTasks,
      skippedTasks: prismaRoadmap.skippedTasks,
      overdueTasks: prismaRoadmap.overdueTasks,
      blockedTasks: prismaRoadmap.blockedTasks,

      // --- Time Tracking ---
      startedAt: prismaRoadmap.startedAt,
      estimatedCompletionDate: prismaRoadmap.estimatedCompletionDate || undefined,
      actualCompletionDate: prismaRoadmap.actualCompletionDate || undefined,
      totalTimeSpentHours: prismaRoadmap.totalTimeSpentHours,

      // --- Risk Integration ---
      blockedByRiskIds: prismaRoadmap.blockedByRiskIds || [],
      resolvesRiskIds: prismaRoadmap.resolvesRiskIds || [],
      linkedDocumentGaps: prismaRoadmap.linkedDocumentGaps || [],

      // --- Analytics ---
      analytics: analytics,

      // --- User Progress ---
      userId: prismaRoadmap.userId,
      executorName: prismaRoadmap.executorName,
      lastActiveAt: prismaRoadmap.lastActiveAt,
      daysInactive: prismaRoadmap.daysInactive,

      // --- Automation ---
      autoTransitionEnabled: prismaRoadmap.autoTransitionEnabled,
      autoTaskGenerationEnabled: prismaRoadmap.autoTaskGenerationEnabled,
      escalationThresholdDays: prismaRoadmap.escalationThresholdDays,

      // --- Metadata ---
      version: prismaRoadmap.version,
      lastOptimizedAt: prismaRoadmap.lastOptimizedAt || undefined,
      optimizationCount: prismaRoadmap.optimizationCount,
      notes: prismaRoadmap.notes || undefined,
      internalNotes: prismaRoadmap.internalNotes || undefined,
    };

    // Reconstitute the domain aggregate
    return ExecutorRoadmap.reconstitute(
      prismaRoadmap.id,
      domainProps,
      prismaRoadmap.createdAt,
      prismaRoadmap.updatedAt,
      prismaRoadmap.version,
    );
  }

  /**
   * Map multiple Prisma models to Domain Aggregates
   * This is a batch operation for multiple roadmaps
   */
  public static async toDomainArray(
    prismaRoadmaps: PrismaExecutorRoadmap[],
    getAllTasksForRoadmap: (roadmapId: string) => Promise<PrismaRoadmapTask[]>,
  ): Promise<ExecutorRoadmap[]> {
    const aggregates: ExecutorRoadmap[] = [];

    for (const roadmap of prismaRoadmaps) {
      try {
        // Get all tasks for this roadmap
        const tasks = await getAllTasksForRoadmap(roadmap.id);

        // Convert to domain
        const aggregate = this.toDomain(roadmap, tasks);
        aggregates.push(aggregate);
      } catch (error) {
        console.error(`Failed to convert roadmap ${roadmap.id}:`, error);
        // Continue with other roadmaps
      }
    }

    return aggregates;
  }

  /**
   * Extract ID for persistence operations
   */
  public static getPersistenceId(domainAggregate: ExecutorRoadmap): string | null {
    return domainAggregate.id ? domainAggregate.id.toString() : null;
  }

  /**
   * Get version for optimistic concurrency
   */
  public static getVersion(domainAggregate: ExecutorRoadmap): number {
    return domainAggregate.version;
  }

  // ==================== ENUM MAPPING HELPERS ====================

  /**
   * Map Domain RoadmapPhase to Prisma string
   */
  private static mapDomainRoadmapPhaseToPrisma(phase: RoadmapPhase): string {
    const mapping: Record<RoadmapPhase, string> = {
      [RoadmapPhase.PRE_FILING]: 'PRE_FILING',
      [RoadmapPhase.FILING]: 'FILING',
      [RoadmapPhase.CONFIRMATION]: 'CONFIRMATION',
      [RoadmapPhase.DISTRIBUTION]: 'DISTRIBUTION',
      [RoadmapPhase.CLOSURE]: 'CLOSURE',
    };

    const prismaPhase = mapping[phase];
    if (!prismaPhase) {
      throw new Error(`Invalid RoadmapPhase: ${phase}`);
    }
    return prismaPhase;
  }

  /**
   * Map Prisma RoadmapPhase string to Domain
   */
  private static mapPrismaRoadmapPhaseToDomain(phase: string): RoadmapPhase {
    const mapping: Record<string, RoadmapPhase> = {
      PRE_FILING: RoadmapPhase.PRE_FILING,
      FILING: RoadmapPhase.FILING,
      CONFIRMATION: RoadmapPhase.CONFIRMATION,
      DISTRIBUTION: RoadmapPhase.DISTRIBUTION,
      CLOSURE: RoadmapPhase.CLOSURE,
    };

    const domainPhase = mapping[phase];
    if (!domainPhase) {
      throw new Error(`Invalid Prisma RoadmapPhase: ${phase}`);
    }
    return domainPhase;
  }

  /**
   * Map Domain RoadmapStatus to Prisma string
   */
  private static mapDomainRoadmapStatusToPrisma(status: RoadmapStatus): string {
    const mapping: Record<RoadmapStatus, string> = {
      [RoadmapStatus.DRAFT]: 'DRAFT',
      [RoadmapStatus.ACTIVE]: 'ACTIVE',
      [RoadmapStatus.PAUSED]: 'PAUSED',
      [RoadmapStatus.BLOCKED]: 'BLOCKED',
      [RoadmapStatus.COMPLETED]: 'COMPLETED',
      [RoadmapStatus.ABANDONED]: 'ABANDONED',
      [RoadmapStatus.ESCALATED]: 'ESCALATED',
    };

    const prismaStatus = mapping[status];
    if (!prismaStatus) {
      throw new Error(`Invalid RoadmapStatus: ${status}`);
    }
    return prismaStatus;
  }

  /**
   * Map Prisma RoadmapStatus string to Domain
   */
  private static mapPrismaRoadmapStatusToDomain(status: string): RoadmapStatus {
    const mapping: Record<string, RoadmapStatus> = {
      DRAFT: RoadmapStatus.DRAFT,
      ACTIVE: RoadmapStatus.ACTIVE,
      PAUSED: RoadmapStatus.PAUSED,
      BLOCKED: RoadmapStatus.BLOCKED,
      COMPLETED: RoadmapStatus.COMPLETED,
      ABANDONED: RoadmapStatus.ABANDONED,
      ESCALATED: RoadmapStatus.ESCALATED,
    };

    const domainStatus = mapping[status];
    if (!domainStatus) {
      throw new Error(`Invalid Prisma RoadmapStatus: ${status}`);
    }
    return domainStatus;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Extract roadmap IDs from Prisma models
   */
  public static extractIds(prismaModels: PrismaExecutorRoadmap[]): string[] {
    return prismaModels.map((model) => model.id);
  }

  /**
   * Check if roadmap is in a state that allows updates
   */
  public static isUpdatable(prismaModel: PrismaExecutorRoadmap): boolean {
    const nonUpdatableStatuses = ['COMPLETED', 'ABANDONED'];
    return !nonUpdatableStatuses.includes(prismaModel.status);
  }

  /**
   * Check if roadmap is blocked
   */
  public static isBlocked(prismaModel: PrismaExecutorRoadmap): boolean {
    return prismaModel.status === 'BLOCKED' || prismaModel.blockedByRiskIds.length > 0;
  }

  /**
   * Calculate roadmap health status
   */
  public static calculateHealthStatus(
    prismaModel: PrismaExecutorRoadmap,
  ): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const inactiveDays = prismaModel.daysInactive;
    const blockedTasks = prismaModel.blockedTasks;

    if (blockedTasks > 0 || inactiveDays > 30) {
      return 'CRITICAL';
    } else if (inactiveDays > 14) {
      return 'WARNING';
    } else {
      return 'HEALTHY';
    }
  }

  /**
   * Create update data for phase transition
   */
  public static createPhaseTransitionUpdateData(
    fromPhase: RoadmapPhase,
    toPhase: RoadmapPhase,
  ): Record<string, any> {
    const now = new Date();

    return {
      currentPhase: this.mapDomainRoadmapPhaseToPrisma(toPhase),
      lastActiveAt: now,
      // Note: Phase history would be updated separately as JSON
    };
  }

  /**
   * Create update data for task completion
   */
  public static createTaskCompletionUpdateData(
    tasksCompleted: number,
    tasksSkipped: number,
    timeSpentHours: number,
  ): Record<string, any> {
    const now = new Date();

    return {
      completedTasks: { increment: tasksCompleted },
      skippedTasks: { increment: tasksSkipped },
      totalTimeSpentHours: { increment: timeSpentHours },
      lastActiveAt: now,
      daysInactive: 0,
    };
  }

  /**
   * Create update data for risk linking
   */
  public static createRiskLinkUpdateData(riskId: string, isBlocking: boolean): Record<string, any> {
    if (isBlocking) {
      return {
        blockedByRiskIds: { push: riskId },
        status: 'BLOCKED',
        lastActiveAt: new Date(),
      };
    } else {
      return {
        resolvesRiskIds: { push: riskId },
        lastActiveAt: new Date(),
      };
    }
  }

  /**
   * Create update data for risk unlinking
   */
  public static createRiskUnlinkUpdateData(riskId: string): Record<string, any> {
    return {
      blockedByRiskIds: {
        set: [], // This would need to remove the specific riskId
        // In practice, we'd need to filter out the riskId from the array
      },
      resolvesRiskIds: { push: riskId },
      lastActiveAt: new Date(),
    };
  }

  /**
   * Validate Prisma model before conversion
   */
  public static validatePrismaModel(prismaModel: PrismaExecutorRoadmap): string[] {
    const errors: string[] = [];

    if (!prismaModel.estateId) {
      errors.push('estateId is required');
    }

    if (!prismaModel.readinessAssessmentId) {
      errors.push('readinessAssessmentId is required');
    }

    if (!prismaModel.userId) {
      errors.push('userId is required');
    }

    if (!prismaModel.executorName) {
      errors.push('executorName is required');
    }

    if (!prismaModel.currentPhase) {
      errors.push('currentPhase is required');
    }

    if (!prismaModel.status) {
      errors.push('status is required');
    }

    // Validate percent complete range
    if (prismaModel.percentComplete < 0 || prismaModel.percentComplete > 100) {
      errors.push('percentComplete must be between 0 and 100');
    }

    // Validate counters
    if (prismaModel.completedTasks > prismaModel.totalTasks) {
      errors.push('completedTasks cannot exceed totalTasks');
    }

    if (prismaModel.skippedTasks > prismaModel.totalTasks) {
      errors.push('skippedTasks cannot exceed totalTasks');
    }

    if (prismaModel.overdueTasks > prismaModel.totalTasks) {
      errors.push('overdueTasks cannot exceed totalTasks');
    }

    if (prismaModel.blockedTasks > prismaModel.totalTasks) {
      errors.push('blockedTasks cannot exceed totalTasks');
    }

    return errors;
  }

  /**
   * Create a mock Prisma ExecutorRoadmap for testing
   */
  public static createMockPrismaRoadmap(
    overrides: Partial<PrismaExecutorRoadmap> = {},
  ): PrismaExecutorRoadmap {
    const now = new Date();

    const base: PrismaExecutorRoadmap = {
      id: 'roadmap-123',
      estateId: 'estate-123',
      readinessAssessmentId: 'readiness-123',
      successionContext: JSON.stringify({
        regime: 'INTESTATE',
        marriageType: 'MONOGAMOUS',
        religion: 'STATUTORY',
      }),
      readinessScore: JSON.stringify({ overallScore: 75, breakdown: {} }),
      currentPhase: 'PRE_FILING',
      status: 'ACTIVE',
      percentComplete: 0,
      phases: JSON.stringify({
        PRE_FILING: {
          phase: 'PRE_FILING',
          completedTasks: 0,
          totalTasks: 10,
          percentComplete: 0,
          criticalTasksRemaining: 2,
        },
      }),
      phaseHistory: JSON.stringify([{ phase: 'PRE_FILING', enteredAt: now.toISOString() }]),
      totalTasks: 10,
      completedTasks: 0,
      skippedTasks: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      startedAt: now,
      estimatedCompletionDate: null,
      actualCompletionDate: null,
      totalTimeSpentHours: 0,
      blockedByRiskIds: [],
      resolvesRiskIds: [],
      linkedDocumentGaps: [],
      analytics: JSON.stringify({
        estimatedTotalTimeDays: 180,
        estimatedCostKES: 50000,
        complexityScore: 5,
        riskExposure: 20,
        predictedBottlenecks: [],
        recommendedAccelerations: [],
      }),
      userId: 'user-123',
      executorName: 'John Doe',
      lastActiveAt: now,
      daysInactive: 0,
      autoTransitionEnabled: true,
      autoTaskGenerationEnabled: true,
      escalationThresholdDays: 14,
      version: 1,
      lastOptimizedAt: null,
      optimizationCount: 0,
      notes: null,
      internalNotes: null,
      createdAt: now,
      updatedAt: now,
    };

    return { ...base, ...overrides };
  }

  /**
   * Extract task IDs from roadmap
   */
  public static extractTaskIds(
    prismaModel: PrismaExecutorRoadmap,
    tasks: PrismaRoadmapTask[],
  ): string[] {
    return tasks.map((task) => task.id);
  }

  /**
   * Check if roadmap needs optimization
   */
  public static needsOptimization(prismaModel: PrismaExecutorRoadmap): boolean {
    // Optimize if last optimized more than 7 days ago
    if (!prismaModel.lastOptimizedAt) {
      return true;
    }

    const now = new Date();
    const daysSinceOptimization = Math.floor(
      (now.getTime() - prismaModel.lastOptimizedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysSinceOptimization > 7;
  }
}

// ==================== TYPE UTILITIES ====================

/**
 * Types for roadmap operations
 */
export interface ExecutorRoadmapCreateData {
  estateId: string;
  readinessAssessmentId: string;
  userId: string;
  executorName: string;
  successionContext: string;
  currentPhase: string;
  status: string;
}

export interface ExecutorRoadmapUpdateData {
  currentPhase?: string;
  status?: string;
  percentComplete?: number;
  completedTasks?: number;
  skippedTasks?: number;
  overdueTasks?: number;
  blockedTasks?: number;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  totalTimeSpentHours?: number;
  blockedByRiskIds?: string[];
  resolvesRiskIds?: string[];
  lastActiveAt?: Date;
  daysInactive?: number;
  version?: number;
}

/**
 * Types for roadmap filtering
 */
export interface ExecutorRoadmapFilter {
  estateId?: string;
  userId?: string;
  status?: string[];
  currentPhase?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  hasBlockedTasks?: boolean;
  daysInactiveMin?: number;
}

/**
 * Types for roadmap analytics
 */
export interface RoadmapAnalyticsData {
  estimatedTotalTimeDays: number;
  estimatedCostKES: number;
  complexityScore: number;
  riskExposure: number;
  efficiencyScore?: number;
  predictedBottlenecks: string[];
  recommendedAccelerations: string[];
}

/**
 * Types for batch roadmap operations
 */
export interface ExecutorRoadmapBatchOperation {
  create?: ExecutorRoadmapCreateData[];
  update?: {
    where: { id: string };
    data: ExecutorRoadmapUpdateData;
  }[];
  delete?: string[];
}
