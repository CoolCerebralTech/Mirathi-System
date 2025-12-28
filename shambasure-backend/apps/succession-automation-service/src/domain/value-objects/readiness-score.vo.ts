// src/succession-automation/src/domain/value-objects/readiness-score.vo.ts
import { ValueObject, ValueObjectValidationError } from '../base/value-object';
import { SuccessionContext } from './succession-context.vo';

/**
 * Readiness Score Value Object
 *
 * PURPOSE: The "Traffic Light" - tells the user if they can file.
 *
 * INNOVATION: Context-Aware Scoring
 * - Simple cases (Monogamous, no minors) need 80% to file
 * - Complex cases (Polygamous, disputes) need 90% to file (court is stricter)
 * - Islamic cases (Kadhi's Court) need 85% (different filing standards)
 *
 * SCORING LOGIC (Tiered System):
 * - TIER 1: Critical risks = INSTANT BLOCK (score = 0)
 * - TIER 2: High risks = Major deductions (context-sensitive)
 * - TIER 3: Medium risks = Standard deductions
 * - TIER 4: Low risks = Minor deductions
 *
 * LEGAL CONTEXT:
 * - 90-100% = "Court Ready" (High probability of acceptance)
 * - 80-89% = "Filing Ready" (Acceptable, may get queries)
 * - 60-79% = "Needs Work" (Likely to face objections)
 * - 0-59% = "Not Ready" (Will be rejected or returned)
 * - 0% = "Blocked" (Critical legal requirement missing)
 */

export enum ReadinessStatus {
  BLOCKED = 'BLOCKED', // Critical risk exists - cannot file
  READY_TO_FILE = 'READY_TO_FILE', // Above threshold, can file
  NEARLY_READY = 'NEARLY_READY', // Close to threshold, minor fixes needed
  NEEDS_WORK = 'NEEDS_WORK', // Significant gaps, not ready
  IN_PROGRESS = 'IN_PROGRESS', // Early stage, still building case
}

export enum FilingConfidence {
  HIGH = 'HIGH', // 90-100%: Very likely to succeed
  MEDIUM = 'MEDIUM', // 80-89%: Likely to succeed with minor queries
  LOW = 'LOW', // 60-79%: Might face objections
  VERY_LOW = 'VERY_LOW', // 0-59%: Likely to be rejected
  BLOCKED = 'BLOCKED', // Cannot file due to blockers
}

interface RiskBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ReadinessScoreProps {
  score: number; // 0-100
  status: ReadinessStatus;
  filingConfidence: FilingConfidence;
  riskBreakdown: RiskBreakdown;
  calculatedAt: Date;
  context?: SuccessionContext; // Optional: Context for scoring decisions
  nextMilestone?: string; // Next major milestone to achieve
  estimatedDaysToReady?: number; // Based on gap severity and types
  lastUpdatedBy?: string; // System, user, or event that triggered update
  version: number; // Score calculation version for algorithm updates
}

export class ReadinessScore extends ValueObject<ReadinessScoreProps> {
  private static readonly BASE_HIGH_RISK_PENALTY = 25;
  private static readonly BASE_MEDIUM_RISK_PENALTY = 12;
  private static readonly BASE_LOW_RISK_PENALTY = 6;

  // Context-aware thresholds (different courts have different standards)
  private static readonly THRESHOLDS = {
    SIMPLE: {
      READY: 80, // Simple cases can file at 80%
      COURT_READY: 90, // But 90% is better for smooth process
    },
    COMPLEX: {
      READY: 85, // Complex cases need higher score
      COURT_READY: 95, // Courts scrutinize complex cases more
    },
    ISLAMIC: {
      READY: 85, // Kadhi's Court has different standards
      COURT_READY: 90,
    },
    POLYGAMOUS: {
      READY: 90, // Section 40 cases need high readiness
      COURT_READY: 95,
    },
  };

  // Time-based decay: Scores older than 30 days should be recalculated
  private static readonly SCORE_TTL_DAYS = 30;

  // Score calculation version (increment when algorithm changes)
  private static readonly CURRENT_VERSION = 2;

  constructor(props: ReadinessScoreProps) {
    super(props);
  }

  protected validate(): void {
    const { score, status, filingConfidence, riskBreakdown, version } = this.props;

    // Score must be 0-100
    if (score < 0 || score > 100) {
      throw new ValueObjectValidationError('Score must be between 0 and 100', 'score');
    }

    // Risk breakdown validation
    const { critical, high, medium, low } = riskBreakdown;
    if (critical < 0 || high < 0 || medium < 0 || low < 0) {
      throw new ValueObjectValidationError('Risk counts cannot be negative', 'riskBreakdown');
    }

    // BUSINESS RULE: If critical risks exist, score MUST be 0 and status BLOCKED
    if (critical > 0) {
      if (score !== 0) {
        throw new ValueObjectValidationError('Score must be 0 when critical risks exist', 'score');
      }
      if (status !== ReadinessStatus.BLOCKED) {
        throw new ValueObjectValidationError(
          'Status must be BLOCKED when critical risks exist',
          'status',
        );
      }
      if (filingConfidence !== FilingConfidence.BLOCKED) {
        throw new ValueObjectValidationError(
          'Filing confidence must be BLOCKED when critical risks exist',
          'filingConfidence',
        );
      }
    }

    // BUSINESS RULE: Status must align with score ranges
    if (critical === 0) {
      const expectedStatus = this.determineStatusFromScore(score);
      if (status !== expectedStatus) {
        throw new ValueObjectValidationError(
          `Status should be ${expectedStatus} for score ${score}`,
          'status',
        );
      }

      const expectedConfidence = this.determineConfidenceFromScore(score);
      if (filingConfidence !== expectedConfidence) {
        throw new ValueObjectValidationError(
          `Filing confidence should be ${expectedConfidence} for score ${score}`,
          'filingConfidence',
        );
      }
    }

    // Version validation
    if (version > ReadinessScore.CURRENT_VERSION) {
      throw new ValueObjectValidationError(
        `Score version ${version} is from future calculation algorithm`,
        'version',
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

  get filingConfidence(): FilingConfidence {
    return this.props.filingConfidence;
  }

  get riskBreakdown(): RiskBreakdown {
    return this.props.riskBreakdown;
  }

  get calculatedAt(): Date {
    return this.props.calculatedAt;
  }

  get context(): SuccessionContext | undefined {
    return this.props.context;
  }

  get nextMilestone(): string | undefined {
    return this.props.nextMilestone;
  }

  get estimatedDaysToReady(): number | undefined {
    return this.props.estimatedDaysToReady;
  }

  get lastUpdatedBy(): string | undefined {
    return this.props.lastUpdatedBy;
  }

  get version(): number {
    return this.props.version;
  }

  get criticalRisksCount(): number {
    return this.props.riskBreakdown.critical;
  }

  get highRisksCount(): number {
    return this.props.riskBreakdown.high;
  }

  get mediumRisksCount(): number {
    return this.props.riskBreakdown.medium;
  }

  get lowRisksCount(): number {
    return this.props.riskBreakdown.low;
  }

  get totalRisks(): number {
    const { critical, high, medium, low } = this.props.riskBreakdown;
    return critical + high + medium + low;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Can the user file with this score?
   * Considers context-specific thresholds
   */
  public canFile(): boolean {
    if (this.isBlocked()) {
      return false;
    }

    const threshold = this.getFilingThreshold();
    return this.props.score >= threshold;
  }

  /**
   * Is the case blocked by critical risks?
   */
  public isBlocked(): boolean {
    return this.props.status === ReadinessStatus.BLOCKED;
  }

  /**
   * Is this score stale (should be recalculated)?
   */
  public isStale(now: Date = new Date()): boolean {
    const ageInDays = (now.getTime() - this.props.calculatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > ReadinessScore.SCORE_TTL_DAYS;
  }

  /**
   * Get appropriate filing threshold based on context
   */
  public getFilingThreshold(): number {
    if (!this.props.context) {
      return ReadinessScore.THRESHOLDS.SIMPLE.READY;
    }

    const context = this.props.context;

    if (context.isSection40Applicable()) {
      return ReadinessScore.THRESHOLDS.POLYGAMOUS.READY;
    }

    if (context.requiresKadhisCourt()) {
      return ReadinessScore.THRESHOLDS.ISLAMIC.READY;
    }

    if (context.isSimpleCase()) {
      return ReadinessScore.THRESHOLDS.SIMPLE.READY;
    }

    return ReadinessScore.THRESHOLDS.COMPLEX.READY;
  }

  /**
   * Get "Court Ready" threshold (higher standard for smooth processing)
   */
  public getCourtReadyThreshold(): number {
    if (!this.props.context) {
      return ReadinessScore.THRESHOLDS.SIMPLE.COURT_READY;
    }

    const context = this.props.context;

    if (context.isSection40Applicable()) {
      return ReadinessScore.THRESHOLDS.POLYGAMOUS.COURT_READY;
    }

    if (context.requiresKadhisCourt()) {
      return ReadinessScore.THRESHOLDS.ISLAMIC.COURT_READY;
    }

    if (context.isSimpleCase()) {
      return ReadinessScore.THRESHOLDS.SIMPLE.COURT_READY;
    }

    return ReadinessScore.THRESHOLDS.COMPLEX.COURT_READY;
  }

  /**
   * Is the case "Court Ready" (high probability of acceptance)?
   */
  public isCourtReady(): boolean {
    if (this.isBlocked()) {
      return false;
    }

    const threshold = this.getCourtReadyThreshold();
    return this.props.score >= threshold;
  }

  /**
   * Get percentage to reach filing threshold
   */
  public getPercentageToFiling(): number {
    if (this.canFile()) {
      return 0;
    }

    if (this.isBlocked()) {
      return 100; // Blocked needs 100% more
    }

    const threshold = this.getFilingThreshold();
    return Math.max(0, threshold - this.props.score);
  }

  /**
   * Get percentage to reach court ready threshold
   */
  public getPercentageToCourtReady(): number {
    if (this.isCourtReady()) {
      return 0;
    }

    if (this.isBlocked()) {
      return 100;
    }

    const threshold = this.getCourtReadyThreshold();
    return Math.max(0, threshold - this.props.score);
  }

  /**
   * Get a color indicator (for UI)
   */
  public getColorIndicator(): 'green' | 'yellow' | 'orange' | 'red' {
    if (this.isBlocked()) {
      return 'red';
    }

    if (this.isCourtReady()) {
      return 'green';
    }

    if (this.canFile()) {
      return 'yellow';
    }

    if (this.props.score >= 60) {
      return 'orange';
    }

    return 'red';
  }

  /**
   * Get progress stage (0-5)
   */
  public getProgressStage(): number {
    if (this.isBlocked()) {
      return 0;
    }

    if (this.props.score < 20) return 1;
    if (this.props.score < 40) return 2;
    if (this.props.score < 60) return 3;
    if (this.props.score < 80) return 4;
    if (this.props.score < 90) return 5;
    return 6; // Court ready
  }

  /**
   * Get a human-readable message for the user
   */
  public getMessage(): string {
    if (this.isBlocked()) {
      return `⛔ BLOCKED: ${this.criticalRisksCount} critical issue(s) must be resolved before filing.`;
    }

    if (this.isCourtReady()) {
      return `✅ COURT READY: Your case is well-prepared (${this.props.score}%) and likely to be accepted smoothly.`;
    }

    if (this.canFile()) {
      const confidence = this.props.filingConfidence.toLowerCase();
      return `🟢 READY TO FILE: You can file (${this.props.score}%) with ${confidence} confidence. ${this.totalRisks} minor issue(s) may cause queries.`;
    }

    // Not ready yet
    const percentageToGo = this.getPercentageToFiling();

    if (percentageToGo <= 10) {
      return `🟡 NEARLY READY: ${this.props.score}%. Just ${percentageToGo}% to go! Resolve ${this.highRisksCount} high-priority risk(s).`;
    }

    if (this.props.score >= 60) {
      return `🟠 NEEDS WORK: ${this.props.score}%. Address ${this.totalRisks} issue(s) before filing.`;
    }

    return `🔴 NOT READY: ${this.props.score}%. Significant work needed (${this.totalRisks} issues).`;
  }

  /**
   * Get recommendations to improve score
   */
  public getImprovementRecommendations(): string[] {
    const recommendations: string[] = [];
    const { critical, high, medium, low } = this.props.riskBreakdown;

    if (critical > 0) {
      recommendations.push(`Resolve ${critical} critical issue(s) first (blocking filing)`);
    }

    if (high > 0) {
      recommendations.push(`Address ${high} high-priority risk(s) to boost score significantly`);
    }

    if (medium > 0 && high === 0) {
      recommendations.push(`Fix ${medium} medium-priority issue(s) to reach filing threshold`);
    }

    if (low > 0 && high === 0 && medium === 0) {
      recommendations.push(`Clear ${low} low-priority item(s) for optimal preparation`);
    }

    if (!this.props.context && this.props.score < 80) {
      recommendations.push('Complete case context setup for personalized scoring');
    }

    return recommendations;
  }

  // ==================== CALCULATION LOGIC ====================

  /**
   * Calculate score from risk counts with context-aware weights
   */
  public static calculateScore(riskBreakdown: RiskBreakdown, context?: SuccessionContext): number {
    const { critical, high, medium, low } = riskBreakdown;

    // GATE: Critical risks = instant block
    if (critical > 0) {
      return 0;
    }

    // Get context-aware weights
    const weights = ReadinessScore.getContextWeights(context);

    // Calculate deductions
    let deductions = 0;
    deductions += high * weights.high;
    deductions += medium * weights.medium;
    deductions += low * weights.low;

    // Calculate final score
    let score = 100 - deductions;

    // Apply context-specific adjustments
    if (context) {
      score = ReadinessScore.applyContextAdjustments(score, context);
    }

    // Clamp between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get context-aware risk weights
   */
  private static getContextWeights(context?: SuccessionContext): {
    high: number;
    medium: number;
    low: number;
  } {
    const base = {
      high: ReadinessScore.BASE_HIGH_RISK_PENALTY,
      medium: ReadinessScore.BASE_MEDIUM_RISK_PENALTY,
      low: ReadinessScore.BASE_LOW_RISK_PENALTY,
    };

    if (!context) {
      return base;
    }

    // Adjust weights based on context
    if (context.isSection40Applicable()) {
      // Polygamous cases: High risks are more severe
      return {
        high: 30,
        medium: 15,
        low: 8,
      };
    }

    if (context.requiresKadhisCourt()) {
      // Islamic cases: Different risk profile
      return {
        high: 22,
        medium: 11,
        low: 5,
      };
    }

    if (context.isSimpleCase()) {
      // Simple cases: Lower penalties
      return {
        high: 20,
        medium: 10,
        low: 5,
      };
    }

    return base;
  }

  /**
   * Apply context-specific adjustments to score
   */
  private static applyContextAdjustments(score: number, context: SuccessionContext): number {
    let adjustedScore = score;

    // Boost for well-documented simple cases
    if (context.isSimpleCase() && score > 85) {
      adjustedScore += 2; // Small boost for excellent preparation
    }

    // Penalty for disputed assets
    if (context.hasDisputedAssets && score > 70) {
      adjustedScore -= 5; // Courts scrutinize disputes
    }

    // Penalty for complex business assets
    if (context.isBusinessAssetsInvolved && score > 75) {
      adjustedScore -= 3; // Additional documentation required
    }

    return Math.max(0, Math.min(100, adjustedScore));
  }

  /**
   * Determine status from score (without critical risks)
   */
  private determineStatusFromScore(score: number): ReadinessStatus {
    if (score >= this.getCourtReadyThreshold()) {
      return ReadinessStatus.READY_TO_FILE; // Actually court ready, but same status
    }

    if (score >= this.getFilingThreshold()) {
      return ReadinessStatus.READY_TO_FILE;
    }

    if (score >= this.getFilingThreshold() - 10) {
      return ReadinessStatus.NEARLY_READY;
    }

    if (score >= 50) {
      return ReadinessStatus.NEEDS_WORK;
    }

    return ReadinessStatus.IN_PROGRESS;
  }

  /**
   * Determine confidence level from score
   */
  private determineConfidenceFromScore(score: number): FilingConfidence {
    if (score >= 90) return FilingConfidence.HIGH;
    if (score >= 80) return FilingConfidence.MEDIUM;
    if (score >= 60) return FilingConfidence.LOW;
    return FilingConfidence.VERY_LOW;
  }

  /**
   * Determine next milestone to reach
   */
  private static determineNextMilestone(
    score: number,
    riskBreakdown: RiskBreakdown,
    context?: SuccessionContext,
  ): string {
    const { critical, high, medium } = riskBreakdown;

    if (critical > 0) {
      return 'Resolve critical blockers';
    }

    if (high > 0) {
      return 'Address high-priority risks';
    }

    if (medium > 0) {
      return 'Fix medium-priority issues';
    }

    const threshold = context
      ? new ReadinessScore({
          score: 0,
          status: ReadinessStatus.IN_PROGRESS,
          filingConfidence: FilingConfidence.VERY_LOW,
          riskBreakdown,
          calculatedAt: new Date(),
          context,
          version: ReadinessScore.CURRENT_VERSION,
        }).getFilingThreshold()
      : 80;

    if (score < threshold) {
      return `Reach ${threshold}% filing threshold`;
    }

    return 'Ready for filing';
  }

  /**
   * Estimate days to ready based on risk severity
   */
  private static estimateDaysToReady(riskBreakdown: RiskBreakdown): number {
    const { critical, high, medium, low } = riskBreakdown;

    let totalDays = 0;

    // Critical: 7-14 days each (varies by type)
    totalDays += critical * 10;

    // High: 5-10 days each
    totalDays += high * 7;

    // Medium: 2-5 days each
    totalDays += medium * 3;

    // Low: 1-3 days each
    totalDays += low * 2;

    return Math.min(90, totalDays); // Cap at 90 days
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Calculate a new ReadinessScore from risk breakdown and context
   */
  public static calculate(
    riskBreakdown: RiskBreakdown,
    context?: SuccessionContext,
    lastUpdatedBy?: string,
  ): ReadinessScore {
    const score = ReadinessScore.calculateScore(riskBreakdown, context);
    const criticalRisks = riskBreakdown.critical;

    let status: ReadinessStatus;
    let filingConfidence: FilingConfidence;

    if (criticalRisks > 0) {
      status = ReadinessStatus.BLOCKED;
      filingConfidence = FilingConfidence.BLOCKED;
    } else {
      // Create temporary instance to use instance methods
      const tempScore = new ReadinessScore({
        score,
        status: ReadinessStatus.IN_PROGRESS,
        filingConfidence: FilingConfidence.VERY_LOW,
        riskBreakdown,
        calculatedAt: new Date(),
        context,
        version: ReadinessScore.CURRENT_VERSION,
      });

      status = tempScore.determineStatusFromScore(score);
      filingConfidence = tempScore.determineConfidenceFromScore(score);
    }

    return new ReadinessScore({
      score,
      status,
      filingConfidence,
      riskBreakdown,
      calculatedAt: new Date(),
      context,
      nextMilestone: ReadinessScore.determineNextMilestone(score, riskBreakdown, context),
      estimatedDaysToReady: ReadinessScore.estimateDaysToReady(riskBreakdown),
      lastUpdatedBy,
      version: ReadinessScore.CURRENT_VERSION,
    });
  }

  /**
   * Create a perfect score (100%, no risks)
   */
  public static perfect(context?: SuccessionContext): ReadinessScore {
    return ReadinessScore.calculate({ critical: 0, high: 0, medium: 0, low: 0 }, context, 'system');
  }

  /**
   * Create a blocked score (critical risk exists)
   */
  public static blocked(criticalCount: number, context?: SuccessionContext): ReadinessScore {
    return ReadinessScore.calculate(
      { critical: criticalCount, high: 0, medium: 0, low: 0 },
      context,
      'system',
    );
  }

  /**
   * Create a score from existing risk counts (backward compatibility)
   */
  public static fromRiskCounts(
    critical: number,
    high: number,
    medium: number,
    low: number,
    context?: SuccessionContext,
    lastUpdatedBy?: string,
  ): ReadinessScore {
    return ReadinessScore.calculate({ critical, high, medium, low }, context, lastUpdatedBy);
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
      filingConfidence: this.props.filingConfidence,
      riskBreakdown: this.props.riskBreakdown,
      calculatedAt: this.props.calculatedAt.toISOString(),
      context: this.props.context?.toJSON(),
      nextMilestone: this.props.nextMilestone,
      estimatedDaysToReady: this.props.estimatedDaysToReady,
      lastUpdatedBy: this.props.lastUpdatedBy,
      version: this.props.version,

      // Derived properties for convenience
      totalRisks: this.totalRisks,
      canFile: this.canFile(),
      isBlocked: this.isBlocked(),
      isCourtReady: this.isCourtReady(),
      isStale: this.isStale(),
      colorIndicator: this.getColorIndicator(),
      progressStage: this.getProgressStage(),
      message: this.getMessage(),
      filingThreshold: this.getFilingThreshold(),
      courtReadyThreshold: this.getCourtReadyThreshold(),
      percentageToFiling: this.getPercentageToFiling(),
      percentageToCourtReady: this.getPercentageToCourtReady(),
      improvementRecommendations: this.getImprovementRecommendations(),
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON(json: Record<string, any>): ReadinessScore {
    return new ReadinessScore({
      score: json.score,
      status: json.status as ReadinessStatus,
      filingConfidence: json.filingConfidence as FilingConfidence,
      riskBreakdown: json.riskBreakdown as RiskBreakdown,
      calculatedAt: new Date(json.calculatedAt),
      context: json.context ? SuccessionContext.fromJSON(json.context) : undefined,
      nextMilestone: json.nextMilestone,
      estimatedDaysToReady: json.estimatedDaysToReady,
      lastUpdatedBy: json.lastUpdatedBy,
      version: json.version || 1,
    });
  }
}
