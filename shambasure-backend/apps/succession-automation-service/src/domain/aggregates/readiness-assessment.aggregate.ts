// src/succession-automation/src/domain/aggregates/readiness-assessment.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import { RiskCategory, RiskFlag, RiskSeverity } from '../entities/risk-flag.entity';
import {
  ReadinessAssessmentCompleted,
  ReadinessAssessmentCreated,
  ReadinessScoreUpdated,
  ReadinessStatusChanged,
  RiskFlagDetected,
  RiskFlagResolved,
} from '../events/readiness-assessment.events';
import { DocumentGap } from '../value-objects/document-gap.vo';
import { ReadinessScore, ReadinessStatus } from '../value-objects/readiness-score.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Readiness Assessment Aggregate Root
 *
 * PURPOSE: The "Digital Lawyer's Report Card"
 * Answers: "Can this family file for succession?"
 *
 * AGGREGATE BOUNDARY:
 * - Root: ReadinessAssessment
 * - Entities: RiskFlag[] (collection)
 * - Value Objects: SuccessionContext, ReadinessScore
 *
 * INVARIANTS:
 * 1. Score must match risk counts (no manual score override)
 * 2. Status must align with score (BLOCKED if critical risk exists)
 * 3. No duplicate risks (same fingerprint)
 * 4. All risks must have valid sources
 *
 * LIFECYCLE:
 * 1. Created when Estate is first analyzed
 * 2. Updated when Family/Estate/Will data changes (event-driven)
 * 3. Never deleted (audit trail) - marked complete when filed
 *
 * LEGAL CONTEXT:
 * This aggregate embodies the "Fatal 10" compliance rules
 * and guides the user through court readiness.
 */

interface ReadinessAssessmentProps {
  estateId: string; // The estate being assessed
  successionContext: SuccessionContext; // The "lens" we use
  readinessScore: ReadinessScore; // Current score (0-100)
  riskFlags: RiskFlag[]; // Collection of risks
  missingDocuments: DocumentGap[]; // Calculated gaps (transient)
  blockingIssues: string[]; // Human-readable blockers
  recommendedStrategy: string; // Next steps for user
  lastAssessedAt: Date; // When was this calculated?
  isComplete: boolean; // Has user filed?
  completedAt?: Date;
}

export class ReadinessAssessment extends AggregateRoot<ReadinessAssessmentProps> {
  private constructor(id: UniqueEntityID, props: ReadinessAssessmentProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get estateId(): string {
    return this.props.estateId;
  }

  get successionContext(): SuccessionContext {
    return this.props.successionContext;
  }

  get readinessScore(): ReadinessScore {
    return this.props.readinessScore;
  }

  get riskFlags(): ReadonlyArray<RiskFlag> {
    return Object.freeze([...this.props.riskFlags]);
  }

  get missingDocuments(): ReadonlyArray<DocumentGap> {
    return Object.freeze([...this.props.missingDocuments]);
  }

  get blockingIssues(): ReadonlyArray<string> {
    return Object.freeze([...this.props.blockingIssues]);
  }

  get recommendedStrategy(): string {
    return this.props.recommendedStrategy;
  }

  get lastAssessedAt(): Date {
    return this.props.lastAssessedAt;
  }

  get isComplete(): boolean {
    return this.props.isComplete;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Get all unresolved risks
   */
  public getUnresolvedRisks(): RiskFlag[] {
    return this.props.riskFlags.filter((risk) => !risk.isResolved);
  }

  /**
   * Get risks by severity
   */
  public getRisksBySeverity(severity: RiskSeverity): RiskFlag[] {
    return this.getUnresolvedRisks().filter((risk) => risk.severity === severity);
  }

  /**
   * Get blocking risks
   */
  public getBlockingRisks(): RiskFlag[] {
    return this.getUnresolvedRisks().filter((risk) => risk.isBlocking());
  }

  /**
   * Check if assessment is ready to file
   */
  public canFile(): boolean {
    return this.props.readinessScore.canFile() && !this.props.isComplete;
  }

  /**
   * Check if assessment is blocked
   */
  public isBlocked(): boolean {
    return this.props.readinessScore.isBlocked();
  }

  /**
   * Get top 3 priority risks (for UI)
   */
  public getTopPriorityRisks(limit: number = 3): RiskFlag[] {
    return this.getUnresolvedRisks()
      .sort((a, b) => b.getPriorityScore() - a.getPriorityScore())
      .slice(0, limit);
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Add a new risk flag
   * INVARIANT: No duplicate risks (same fingerprint)
   */
  public addRiskFlag(risk: RiskFlag): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    // Check for duplicates
    const existingFingerprint = risk.getFingerprint();
    const duplicate = this.props.riskFlags.find(
      (r) => r.getFingerprint() === existingFingerprint && !r.isResolved,
    );

    if (duplicate) {
      throw new Error(`Risk with fingerprint ${existingFingerprint} already exists`);
    }

    // Add risk
    const updatedRisks = [...this.props.riskFlags, risk];

    // Recalculate score
    const newScore = this.recalculateScore(updatedRisks);

    // Update state
    this.updateState({
      riskFlags: updatedRisks,
      readinessScore: newScore,
      lastAssessedAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new RiskFlagDetected(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        estateId: this.props.estateId,
        riskId: risk.id.toString(),
        severity: risk.severity,
        category: risk.category,
        description: risk.description,
        isBlocking: risk.isBlocking(),
      }),
    );

    // If score changed significantly, emit score update event
    if (this.props.readinessScore.score !== newScore.score) {
      this.addDomainEvent(
        new ReadinessScoreUpdated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          previousScore: this.props.readinessScore.score,
          newScore: newScore.score,
          previousStatus: this.props.readinessScore.status,
          newStatus: newScore.status,
        }),
      );
    }
  }

  /**
   * Resolve a risk flag
   * BUSINESS RULE: Risk must exist and be unresolved
   */
  public resolveRiskFlag(riskId: string, resolutionNotes?: string): void {
    this.ensureNotDeleted();

    const risk = this.props.riskFlags.find((r) => r.id.equals(riskId));
    if (!risk) {
      throw new Error(`Risk ${riskId} not found in assessment ${this.id.toString()}`);
    }

    if (risk.isResolved) {
      throw new Error(`Risk ${riskId} is already resolved`);
    }

    // Resolve the risk
    risk.resolve(resolutionNotes);

    // Recalculate score
    const newScore = this.recalculateScore(this.props.riskFlags);

    // Update state
    this.updateState({
      readinessScore: newScore,
      lastAssessedAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new RiskFlagResolved(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        estateId: this.props.estateId,
        riskId: risk.id.toString(),
        category: risk.category,
        resolutionNotes: resolutionNotes || 'Resolved',
      }),
    );

    // If status changed (e.g., BLOCKED -> IN_PROGRESS), emit status change event
    if (this.props.readinessScore.status !== newScore.status) {
      this.addDomainEvent(
        new ReadinessStatusChanged(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          previousStatus: this.props.readinessScore.status,
          newStatus: newScore.status,
          newScore: newScore.score,
        }),
      );
    }
  }

  /**
   * Recalculate the entire assessment
   * Called when external data changes (Family/Estate updates)
   */
  public recalculate(newContext?: SuccessionContext, newRisks?: RiskFlag[]): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const updatedContext = newContext || this.props.successionContext;
    const updatedRisks = newRisks || this.props.riskFlags;

    // Recalculate score
    const newScore = this.recalculateScore(updatedRisks);

    // Recalculate missing documents
    const missingDocs = this.calculateMissingDocuments(updatedRisks);

    // Recalculate blocking issues
    const blockingIssues = this.calculateBlockingIssues(updatedRisks);

    // Generate recommended strategy
    const strategy = this.generateRecommendedStrategy(updatedContext, newScore, blockingIssues);

    // Update state
    this.updateState({
      successionContext: updatedContext,
      readinessScore: newScore,
      riskFlags: updatedRisks,
      missingDocuments: missingDocs,
      blockingIssues,
      recommendedStrategy: strategy,
      lastAssessedAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new ReadinessScoreUpdated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        estateId: this.props.estateId,
        previousScore: this.props.readinessScore.score,
        newScore: newScore.score,
        previousStatus: this.props.readinessScore.status,
        newStatus: newScore.status,
      }),
    );
  }

  /**
   * Mark assessment as complete (user has filed)
   * BUSINESS RULE: Can only complete if ready to file
   */
  public markAsComplete(): void {
    this.ensureNotDeleted();

    if (this.props.isComplete) {
      throw new Error('Assessment is already complete');
    }

    if (!this.canFile()) {
      throw new Error(
        'Cannot complete assessment - not ready to file. ' +
          `Current score: ${this.props.readinessScore.score}%, ` +
          `Status: ${this.props.readinessScore.status}`,
      );
    }

    this.updateState({
      isComplete: true,
      completedAt: new Date(),
    });

    // Emit completion event
    this.addDomainEvent(
      new ReadinessAssessmentCompleted(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          estateId: this.props.estateId,
          finalScore: this.props.readinessScore.score,
          completedAt: new Date(),
        },
      ),
    );
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Recalculate readiness score from risk flags
   */
  private recalculateScore(risks: RiskFlag[]): ReadinessScore {
    const unresolvedRisks = risks.filter((r) => !r.isResolved);

    const criticalCount = unresolvedRisks.filter(
      (r) => r.severity === RiskSeverity.CRITICAL,
    ).length;
    const highCount = unresolvedRisks.filter((r) => r.severity === RiskSeverity.HIGH).length;
    const mediumCount = unresolvedRisks.filter((r) => r.severity === RiskSeverity.MEDIUM).length;
    const lowCount = unresolvedRisks.filter((r) => r.severity === RiskSeverity.LOW).length;

    return ReadinessScore.calculate(criticalCount, highCount, mediumCount, lowCount);
  }

  /**
   * Calculate missing documents from risks
   */
  private calculateMissingDocuments(risks: RiskFlag[]): DocumentGap[] {
    return risks
      .filter((r) => !r.isResolved && r.documentGap !== undefined)
      .map((r) => r.documentGap!)
      .filter(
        (gap, index, self) =>
          // Remove duplicates by type
          index === self.findIndex((g) => g.type === gap.type),
      );
  }

  /**
   * Calculate blocking issues (human-readable)
   */
  private calculateBlockingIssues(risks: RiskFlag[]): string[] {
    return risks.filter((r) => r.isBlocking()).map((r) => `${r.category}: ${r.description}`);
  }

  /**
   * Generate recommended strategy based on context
   */
  private generateRecommendedStrategy(
    context: SuccessionContext,
    score: ReadinessScore,
    blockingIssues: string[],
  ): string {
    if (blockingIssues.length > 0) {
      return (
        `BLOCKED: Resolve ${blockingIssues.length} critical issue(s) before filing:\n` +
        blockingIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      );
    }

    if (score.canFile()) {
      const courtType = context.requiresKadhisCourt()
        ? "Kadhi's Court"
        : context.requiresHighCourt(5_000_000)
          ? 'High Court'
          : "Magistrate's Court";

      return (
        `✅ Ready to file in ${courtType}. ` +
        `Application type: ${this.getApplicationType(context)}. ` +
        `Review generated forms and submit.`
      );
    }

    // In progress
    const topRisks = risks
      .filter((r) => !r.isResolved && r.severity === RiskSeverity.HIGH)
      .slice(0, 3);

    if (topRisks.length > 0) {
      return (
        `IN PROGRESS: Address these high-priority issues:\n` +
        topRisks.map((r, i) => `${i + 1}. ${r.description}`).join('\n')
      );
    }

    return `Continue improving your case. Current score: ${score.score}%. Target: 80%+`;
  }

  /**
   * Determine application type from context
   */
  private getApplicationType(context: SuccessionContext): string {
    if (context.regime === 'TESTATE') {
      return 'Grant of Probate (P&A 1)';
    }
    if (context.regime === 'INTESTATE') {
      return 'Letters of Administration (P&A 80)';
    }
    return 'Summary Administration (P&A 5)';
  }

  /**
   * Ensure assessment is not complete
   */
  private ensureNotComplete(): void {
    if (this.props.isComplete) {
      throw new Error(`Cannot modify completed assessment ${this.id.toString()}`);
    }
  }

  // ==================== VALIDATION ====================

  public validate(): void {
    // INVARIANT 1: Score must match risk counts
    const calculatedScore = this.recalculateScore(this.props.riskFlags);
    if (calculatedScore.score !== this.props.readinessScore.score) {
      throw new Error(
        `Score mismatch: stored=${this.props.readinessScore.score}, calculated=${calculatedScore.score}`,
      );
    }

    // INVARIANT 2: Status must align with score
    if (calculatedScore.status !== this.props.readinessScore.status) {
      throw new Error(
        `Status mismatch: stored=${this.props.readinessScore.status}, calculated=${calculatedScore.status}`,
      );
    }

    // INVARIANT 3: No duplicate unresolved risks
    const unresolvedFingerprints = this.getUnresolvedRisks().map((r) => r.getFingerprint());
    const uniqueFingerprints = new Set(unresolvedFingerprints);
    if (unresolvedFingerprints.length !== uniqueFingerprints.size) {
      throw new Error('Duplicate unresolved risks detected');
    }

    // INVARIANT 4: If complete, must have been ready
    if (this.props.isComplete && !this.props.readinessScore.canFile()) {
      throw new Error('Cannot complete assessment that is not ready to file');
    }
  }

  // ==================== EVENT SOURCING ====================

  protected applyEvent(event: DomainEvent): void {
    // Event replay logic (for event sourcing)
    switch (event.getEventType()) {
      case 'ReadinessAssessmentCreated':
        // Initial state set in factory
        break;
      case 'RiskFlagDetected':
        // Risk already added via business logic
        break;
      case 'RiskFlagResolved':
        // Risk already resolved via business logic
        break;
      case 'ReadinessScoreUpdated':
        // Score already updated via business logic
        break;
      default:
        // Unknown event type - ignore
        break;
    }
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new readiness assessment
   */
  public static create(
    estateId: string,
    successionContext: SuccessionContext,
  ): ReadinessAssessment {
    const id = UniqueEntityID.newID();
    const initialScore = ReadinessScore.perfect(); // Start with 100%

    const assessment = new ReadinessAssessment(id, {
      estateId,
      successionContext,
      readinessScore: initialScore,
      riskFlags: [],
      missingDocuments: [],
      blockingIssues: [],
      recommendedStrategy: 'Starting assessment...',
      lastAssessedAt: new Date(),
      isComplete: false,
    });

    // Emit creation event
    assessment.addDomainEvent(
      new ReadinessAssessmentCreated(id.toString(), assessment.getAggregateType(), 1, {
        estateId,
        successionContext: successionContext.toJSON(),
      }),
    );

    return assessment;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: ReadinessAssessmentProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): ReadinessAssessment {
    const aggregate = new ReadinessAssessment(new UniqueEntityID(id), props, createdAt);
    (aggregate as any)._updatedAt = updatedAt;
    (aggregate as any)._version = version;
    return aggregate;
  }
}
