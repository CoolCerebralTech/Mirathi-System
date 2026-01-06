export interface RiskFlagProps {
  id: string;
  assessmentId: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
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
    severity: RiskFlagProps['severity'],
    category: string,
    title: string,
    description: string,
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
      isResolved: false,
      resolutionSteps,
      isBlocking,
      affectsScore: this.calculateScoreImpact(severity),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: RiskFlagProps): RiskFlag {
    return new RiskFlag(props);
  }

  private static calculateScoreImpact(severity: string): number {
    const impact = {
      CRITICAL: 20,
      HIGH: 15,
      MEDIUM: 10,
      LOW: 5,
      INFO: 0,
    };
    return impact[severity as keyof typeof impact] || 0;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get severity(): string {
    return this.props.severity;
  }
  get isBlocking(): boolean {
    return this.props.isBlocking;
  }
  get isResolved(): boolean {
    return this.props.isResolved;
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
