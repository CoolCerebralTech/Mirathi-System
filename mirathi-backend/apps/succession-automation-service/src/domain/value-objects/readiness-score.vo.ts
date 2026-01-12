import { ReadinessStatus } from '@prisma/client';

export class ReadinessScore {
  constructor(
    public readonly overall: number,
    public readonly document: number, // Weight: 30
    public readonly legal: number, // Weight: 30
    public readonly family: number, // Weight: 20
    public readonly financial: number, // Weight: 20
  ) {}

  /**
   * Maps numeric score to the Prisma Enum Status
   */
  get status(): ReadinessStatus {
    if (this.overall === 0) return ReadinessStatus.NOT_STARTED;
    if (this.overall < 80) return ReadinessStatus.IN_PROGRESS;
    if (this.overall < 100) return ReadinessStatus.READY;
    return ReadinessStatus.COMPLETE;
  }

  get formattedPercentage(): string {
    return `${Math.round(this.overall)}%`;
  }

  /**
   * Court filing usually requires ~80% readiness (Chief's letter, Death Cert, Petition).
   * It doesn't need to be 100% (e.g., minor details can follow).
   */
  canGenerateForms(): boolean {
    return this.overall >= 80;
  }

  /**
   * Helper to merge scores from different subsystems
   */
  static compute(
    docScore: number,
    legalScore: number,
    famScore: number,
    finScore: number,
  ): ReadinessScore {
    // Ensure weights
    const weightedDoc = Math.min(docScore, 30);
    const weightedLegal = Math.min(legalScore, 30);
    const weightedFam = Math.min(famScore, 20);
    const weightedFin = Math.min(finScore, 20);

    const total = weightedDoc + weightedLegal + weightedFam + weightedFin;

    return new ReadinessScore(total, weightedDoc, weightedLegal, weightedFam, weightedFin);
  }
}
