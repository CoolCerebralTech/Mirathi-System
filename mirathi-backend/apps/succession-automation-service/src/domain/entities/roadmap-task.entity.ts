import { RoadmapPhase, TaskCategory, TaskStatus } from '@prisma/client';

export interface RoadmapTaskProps {
  id: string;
  roadmapId: string;
  phase: RoadmapPhase;
  category: TaskCategory;
  orderIndex: number;
  title: string;
  description: string;
  status: TaskStatus;
  dependsOnTaskIds: string[];
  unlocksTaskIds: string[];
  whatIsIt?: string;
  whyNeeded?: string;
  howToGet?: string;
  estimatedDays?: number;
  legalBasis?: string;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class RoadmapTask {
  private constructor(private props: RoadmapTaskProps) {}

  static create(
    roadmapId: string,
    phase: RoadmapPhase,
    category: TaskCategory,
    orderIndex: number,
    title: string,
    description: string,
    dependencies: string[] = [],
  ): RoadmapTask {
    return new RoadmapTask({
      id: crypto.randomUUID(),
      roadmapId,
      phase,
      category,
      orderIndex,
      title,
      description,
      status: TaskStatus.LOCKED,
      dependsOnTaskIds: dependencies,
      unlocksTaskIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RoadmapTaskProps): RoadmapTask {
    return new RoadmapTask(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get status(): TaskStatus {
    return this.props.status;
  }
  get dependsOn(): string[] {
    return this.props.dependsOnTaskIds;
  }

  // Business Logic
  unlock(): void {
    if (this.props.status === TaskStatus.LOCKED) {
      this.props.status = TaskStatus.AVAILABLE;
      this.props.updatedAt = new Date();
    }
  }

  start(): void {
    if (this.props.status === TaskStatus.AVAILABLE) {
      this.props.status = TaskStatus.IN_PROGRESS;
      this.props.updatedAt = new Date();
    }
  }

  complete(userId: string, notes?: string): void {
    this.props.status = TaskStatus.COMPLETED;
    this.props.completedAt = new Date();
    this.props.completedBy = userId;
    if (notes) this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  toJSON(): RoadmapTaskProps {
    return { ...this.props };
  }
}
