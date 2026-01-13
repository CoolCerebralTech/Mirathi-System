import { CourtJurisdiction, KenyanFormType, SuccessionRegime } from '@prisma/client';

import { SuccessionContext } from '../value-objects/succession-context.vo';

export interface ProbatePreviewProps {
  id: string;
  userId: string;
  estateId: string;
  assessmentId?: string;

  // FIXED: Changed from string to Enums
  regime: SuccessionRegime;
  targetCourt: CourtJurisdiction;
  requiredForms: KenyanFormType[];

  isReady: boolean;
  readinessScore: number;
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProbatePreview {
  private constructor(private props: ProbatePreviewProps) {}

  static create(
    userId: string,
    estateId: string,
    context: SuccessionContext,
    readinessScore: number,
  ): ProbatePreview {
    return new ProbatePreview({
      id: crypto.randomUUID(),
      userId,
      estateId,
      regime: context.regime,
      targetCourt: context.targetCourt,
      requiredForms: context.getRequiredForms(), // Now types match
      isReady: readinessScore >= 80,
      readinessScore,
      disclaimer: 'This is an educational preview only. Not for official court submission.',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ProbatePreviewProps): ProbatePreview {
    return new ProbatePreview(props);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get isReady(): boolean {
    return this.props.isReady;
  }
  get requiredForms(): KenyanFormType[] {
    return this.props.requiredForms;
  }

  // Business Logic
  updateReadiness(score: number): void {
    this.props.readinessScore = score;
    this.props.isReady = score >= 80;
    this.props.updatedAt = new Date();
  }

  toJSON(): ProbatePreviewProps {
    return { ...this.props };
  }
}
