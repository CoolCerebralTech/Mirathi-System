// src/succession-automation/src/domain/value-objects/readiness-score.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';

/**
 * Readiness Score Value Object
 *
 * PURPOSE: The "Traffic Light" - tells the user if they can file.
 *
 * SCORING LOGIC (Hybrid: Gates + Weights):
 * - GATES (Blockers): If ANY critical risk exists -> Score = 0
 * - WEIGHTS: Deduct points for each non-critical risk
 *
 * LEGAL CONTEXT:
 * - 100% = Ready to file (all documents, no disputes)
 * - 80-99% = Can file but expect queries from court
 * - 50-79% = Significant gaps, likely rejection
 * - 0-49% = Do not file (will be rejected)
 * - 0% = BLOCKED (critical issue like missing Death Cert)
 *
 * The score is NOT subjective - it's calculated deterministically
 * based on the "Fatal 10" compliance rules.
 */

export enum ReadinessStatus {
  IN_PROGRESS = 'IN_PROGRESS', // Still building the case
  READY_TO_FILE = 'READY_TO_FILE', // 80%+ score, no blockers
  BLOCKED = 'BLOCKED', // Critical risk exists
}

interface ReadinessScoreProps {
  score: number; // 0-100
  status: ReadinessStatus;
  criticalRisksCount: number;
  highRisksCount: number;
  mediumRisksCount: number;
  lowRisksCount: number;
  calculatedAt: Date;
}

export class ReadinessScore extends ValueObject<ReadinessScoreProps> {
  // Scoring Weights (tuned for Kenyan court rejection patterns)
  private static readonly CRITICAL_RISK_PENALTY = 100; // Instant block
  private static readonly HIGH_RISK_PENALTY = 20;
  private static readonly MEDIUM_RISK_PENALTY = 10;
  private static readonly LOW_RISK_PENALTY = 5;

  private static readonly READY_THRESHOLD = 80; // 80%+ = Ready to file
  private static readonly POOR_THRESHOLD = 50; // <50% = Don't file

  private constructor(props: ReadinessScoreProps) {
    super(props);
  }

  protected validate(): void {
    const { score, criticalRisksCount, highRisksCount, mediumRisksCount, lowRisksCount } =
      this.props;

    // Score must be 0-100
    if (score < 0 || score > 100) {
      throw new ValueObjectValidationError('Score must be between 0 and 100', 'score');
    }

    // Counts must be non-negative
    if (criticalRisksCount < 0 || highRisksCount < 0 || mediumRisksCount < 0 || lowRisksCount < 0) {
      throw new ValueObjectValidationError('Risk counts cannot be negative', 'riskCounts');
    }

    // BUSINESS RULE: If critical risks exist, score MUST be 0
    if (criticalRisksCount > 0 && score !== 0) {
      throw new ValueObjectValidationError('Score must be 0 when critical risks exist', 'score');
    }

    // BUSINESS RULE: Status must match score
    if (criticalRisksCount > 0 && this.props.status !== ReadinessStatus.BLOCKED) {
      throw new ValueObjectValidationError(
        'Status must be BLOCKED when critical risks exist',
        'status',
      );
    }

    if (
      score >= ReadinessScore.READY_THRESHOLD &&
      this.props.status !== ReadinessStatus.READY_TO_FILE
    ) {
      throw new ValueObjectValidationError(
        `Status must be READY_TO_FILE when score is ${score}%`,
        'status',
      );
    }
  }

  // ==================== GETTERS ====================

  get score(): number {
    return this.props.score;
  }

  get status(): ReadinessStatus {
    return this.props.status;
  }

  get criticalRisksCount(): number {
    return this.props.criticalRisksCount;
  }

  get highRisksCount(): number {
    return this.props.highRisksCount;
  }

  get mediumRisksCount(): number {
    return this.props.mediumRisksCount;
  }

  get lowRisksCount(): number {
    return this.props.lowRisksCount;
  }

  get calculatedAt(): Date {
    return this.props.calculatedAt;
  }

  get totalRisks(): number {
    return (
      this.props.criticalRisksCount +
      this.props.highRisksCount +
      this.props.mediumRisksCount +
      this.props.lowRisksCount
    );
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Can the user file with this score?
   */
  public canFile(): boolean {
    return this.props.status === ReadinessStatus.READY_TO_FILE;
  }

  /**
   * Is the case blocked by critical risks?
   */
  public isBlocked(): boolean {
    return this.props.status === ReadinessStatus.BLOCKED;
  }

  /**
   * Is the case still in progress?
   */
  public isInProgress(): boolean {
    return this.props.status === ReadinessStatus.IN_PROGRESS;
  }

  /**
   * Get a color indicator (for UI)
   */
  public getColorIndicator(): 'green' | 'yellow' | 'red' {
    if (this.props.score >= ReadinessScore.READY_THRESHOLD) {
      return 'green'; // Ready to file
    } else if (this.props.score >= ReadinessScore.POOR_THRESHOLD) {
      return 'yellow'; // Proceed with caution
    } else {
      return 'red'; // Do not file
    }
  }

  /**
   * Get a human-readable message for the user
   */
  public getMessage(): string {
    if (this.isBlocked()) {
      return `Cannot file. You have ${this.props.criticalRisksCount} critical issue(s) that must be resolved.`;
    }

    if (this.canFile()) {
      if (this.props.score === 100) {
        return 'Perfect! Your case is ready to file with no issues.';
      }
      return `Ready to file. You have ${this.totalRisks} minor issue(s) that may result in court queries.`;
    }

    // In Progress
    if (this.props.score >= ReadinessScore.POOR_THRESHOLD) {
      return `${this.props.score}% ready. Address ${this.props.highRisksCount} high-priority risk(s) to improve your chances.`;
    } else {
      return `${this.props.score}% ready. You need to resolve ${this.totalRisks} issue(s) before filing.`;
    }
  }

  /**
   * Get percentage remaining to reach "Ready" status
   */
  public getPercentageToReady(): number {
    if (this.canFile()) {
      return 0;
    }
    return Math.max(0, ReadinessScore.READY_THRESHOLD - this.props.score);
  }

  // ==================== CALCULATION LOGIC ====================

  /**
   * Calculate score from risk counts (the core algorithm)
   */
  public static calculateScore(
    criticalRisks: number,
    highRisks: number,
    mediumRisks: number,
    lowRisks: number,
  ): number {
    // GATE: Critical risks = instant block
    if (criticalRisks > 0) {
      return 0;
    }

    // WEIGHTS: Deduct points
    let score = 100;
    score -= highRisks * ReadinessScore.HIGH_RISK_PENALTY;
    score -= mediumRisks * ReadinessScore.MEDIUM_RISK_PENALTY;
    score -= lowRisks * ReadinessScore.LOW_RISK_PENALTY;

    // Floor at 0
    return Math.max(0, score);
  }

  /**
   * Determine status from score and critical risks
   */
  public static determineStatus(score: number, criticalRisks: number): ReadinessStatus {
    if (criticalRisks > 0) {
      return ReadinessStatus.BLOCKED;
    }

    if (score >= ReadinessScore.READY_THRESHOLD) {
      return ReadinessStatus.READY_TO_FILE;
    }

    return ReadinessStatus.IN_PROGRESS;
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Calculate a new ReadinessScore from risk counts
   */
  public static calculate(
    criticalRisks: number,
    highRisks: number,
    mediumRisks: number,
    lowRisks: number,
  ): ReadinessScore {
    const score = ReadinessScore.calculateScore(criticalRisks, highRisks, mediumRisks, lowRisks);
    const status = ReadinessScore.determineStatus(score, criticalRisks);

    return new ReadinessScore({
      score,
      status,
      criticalRisksCount: criticalRisks,
      highRisksCount: highRisks,
      mediumRisksCount: mediumRisks,
      lowRisksCount: lowRisks,
      calculatedAt: new Date(),
    });
  }

  /**
   * Create a perfect score (100%, no risks)
   */
  public static perfect(): ReadinessScore {
    return ReadinessScore.calculate(0, 0, 0, 0);
  }

  /**
   * Create a blocked score (critical risk exists)
   */
  public static blocked(criticalRisksCount: number): ReadinessScore {
    return new ReadinessScore({
      score: 0,
      status: ReadinessStatus.BLOCKED,
      criticalRisksCount,
      highRisksCount: 0,
      mediumRisksCount: 0,
      lowRisksCount: 0,
      calculatedAt: new Date(),
    });
  }

  /**
   * Generic factory
   */
  public static create(props: ReadinessScoreProps): ReadinessScore {
    return new ReadinessScore(props);
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      score: this.props.score,
      status: this.props.status,
      criticalRisksCount: this.props.criticalRisksCount,
      highRisksCount: this.props.highRisksCount,
      mediumRisksCount: this.props.mediumRisksCount,
      lowRisksCount: this.props.lowRisksCount,
      totalRisks: this.totalRisks,
      calculatedAt: this.props.calculatedAt.toISOString(),
      // Derived properties
      canFile: this.canFile(),
      isBlocked: this.isBlocked(),
      colorIndicator: this.getColorIndicator(),
      message: this.getMessage(),
      percentageToReady: this.getPercentageToReady(),
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON(json: Record<string, any>): ReadinessScore {
    return new ReadinessScore({
      score: json.score,
      status: json.status as ReadinessStatus,
      criticalRisksCount: json.criticalRisksCount,
      highRisksCount: json.highRisksCount,
      mediumRisksCount: json.mediumRisksCount,
      lowRisksCount: json.lowRisksCount,
      calculatedAt: new Date(json.calculatedAt),
    });
  }
}
