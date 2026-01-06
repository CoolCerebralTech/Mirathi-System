export interface RoadmapTaskProps {
  id: string;
  roadmapId: string;
  phase: string;
  category: string;
  orderIndex: number;
  title: string;
  description: string;
  status: string;
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
    phase: string,
    category: string,
    orderIndex: number,
    title: string,
    description: string,
  ): RoadmapTask {
    return new RoadmapTask({
      id: crypto.randomUUID(),
      roadmapId,
      phase,
      category,
      orderIndex,
      title,
      description,
      status: 'LOCKED',
      dependsOnTaskIds: [],
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
  get status(): string {
    return this.props.status;
  }
  get isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  // Business Logic
  unlock(): void {
    if (this.props.status === 'LOCKED') {
      this.props.status = 'AVAILABLE';
      this.props.updatedAt = new Date();
    }
  }

  start(): void {
    if (this.props.status === 'AVAILABLE') {
      this.props.status = 'IN_PROGRESS';
      this.props.updatedAt = new Date();
    }
  }

  complete(userId: string, notes?: string): void {
    this.props.status = 'COMPLETED';
    this.props.completedAt = new Date();
    this.props.completedBy = userId;
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  skip(): void {
    this.props.status = 'SKIPPED';
    this.props.updatedAt = new Date();
  }

  toJSON(): RoadmapTaskProps {
    return { ...this.props };
  }
}
