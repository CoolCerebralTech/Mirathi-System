import {
  CourtJurisdiction,
  RoadmapPhase,
  SuccessionRegime,
  SuccessionReligion,
} from '@prisma/client';

import { SuccessionContext } from '../value-objects/succession-context.vo';

export interface ExecutorRoadmapProps {
  id: string;
  userId: string;
  estateId: string;
  assessmentId?: string;

  // FIXED: Changed from string to Enums
  regime: SuccessionRegime;
  religion: SuccessionReligion;
  targetCourt: CourtJurisdiction;
  currentPhase: RoadmapPhase;

  overallProgress: number;
  totalTasks: number;
  completedTasks: number;
  availableTasks: number;
  lockedTasks: number;
  estimatedDays?: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ExecutorRoadmap {
  private constructor(private props: ExecutorRoadmapProps) {}

  static create(userId: string, estateId: string, context: SuccessionContext): ExecutorRoadmap {
    return new ExecutorRoadmap({
      id: crypto.randomUUID(),
      userId,
      estateId,
      regime: context.regime,
      religion: context.religion,
      targetCourt: context.targetCourt,
      // FIXED: Use Enum instead of string literal
      currentPhase: RoadmapPhase.PRE_FILING,
      overallProgress: 0,
      totalTasks: 0,
      completedTasks: 0,
      availableTasks: 0,
      lockedTasks: 0,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ExecutorRoadmapProps): ExecutorRoadmap {
    return new ExecutorRoadmap(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get estateId(): string {
    return this.props.estateId;
  }
  get currentPhase(): RoadmapPhase {
    return this.props.currentPhase;
  }
  get overallProgress(): number {
    return this.props.overallProgress;
  }

  // Business Logic
  updateProgress(completed: number, total: number): void {
    this.props.completedTasks = completed;
    this.props.totalTasks = total;
    this.props.overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.props.updatedAt = new Date();
  }

  transitionToPhase(newPhase: RoadmapPhase): void {
    this.props.currentPhase = newPhase;
    this.props.updatedAt = new Date();
  }

  toJSON(): ExecutorRoadmapProps {
    return { ...this.props };
  }
}
