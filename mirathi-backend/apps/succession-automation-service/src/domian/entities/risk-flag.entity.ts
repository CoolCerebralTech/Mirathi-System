import { RiskCategory, RiskSeverity } from '@prisma/client';

export interface RiskFlagProps {
  id: string;
  assessmentId: string;
  severity: RiskSeverity;
  category: RiskCategory;
  title: string;
  description: string;
  legalBasis?: string;
  isResolved: boolean;
  resolutionSteps: string[];
  isBlocking: boolean;
  affectsScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export class RiskFlag {
  private constructor(private props: RiskFlagProps) {}

  static create(
    assessmentId: string,
    severity: RiskSeverity,
    category: RiskCategory,
    title: string,
    description: string,
    legalBasis: string | undefined,
    isBlocking: boolean,
    resolutionSteps: string[],
  ): RiskFlag {
    return new RiskFlag({
      id: crypto.randomUUID(),
      assessmentId,
      severity,
      category,
      title,
      description,
      legalBasis,
      isResolved: false,
      resolutionSteps,
      isBlocking,
      affectsScore: RiskFlag.calculateScoreImpact(severity),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RiskFlagProps): RiskFlag {
    return new RiskFlag(props);
  }

  private static calculateScoreImpact(severity: RiskSeverity): number {
    switch (severity) {
      case RiskSeverity.CRITICAL:
        return 20;
      case RiskSeverity.HIGH:
        return 15;
      case RiskSeverity.MEDIUM:
        return 10;
      case RiskSeverity.LOW:
        return 5;
      default:
        return 0;
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get severity(): RiskSeverity {
    return this.props.severity;
  }
  get category(): RiskCategory {
    return this.props.category;
  }
  get isBlocking(): boolean {
    return this.props.isBlocking;
  }
  get isResolved(): boolean {
    return this.props.isResolved;
  }
  get affectsScore(): number {
    return this.props.affectsScore;
  }

  // Business Logic
  resolve(): void {
    this.props.isResolved = true;
    this.props.updatedAt = new Date();
  }

  toJSON(): RiskFlagProps {
    return { ...this.props };
  }
}
