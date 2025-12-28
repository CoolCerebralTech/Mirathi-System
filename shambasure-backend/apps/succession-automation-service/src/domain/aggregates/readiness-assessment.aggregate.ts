// src/succession-automation/src/domain/aggregates/readiness-assessment.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  ResolutionMethod,
  RiskCategory,
  RiskFlag,
  RiskSeverity,
} from '../entities/risk-flag.entity';
import {
  DocumentGapIdentified,
  ReadinessAssessmentCompleted,
  ReadinessAssessmentCreated,
  ReadinessAssessmentRecalculated,
  ReadinessScoreUpdated,
  ReadinessStatusChanged,
  RecommendedStrategyUpdated,
  RiskFlagAutoResolved,
  RiskFlagDetected,
  RiskFlagResolved,
} from '../events/readiness-assessment.events';
import {
  DocumentGap,
  DocumentGapSeverity,
  DocumentGapType,
} from '../value-objects/document-gap.vo';
import { ReadinessScore } from '../value-objects/readiness-score.vo';
import { RiskSource } from '../value-objects/risk-source.vo';
import { SuccessionContext, SuccessionRegime } from '../value-objects/succession-context.vo';

/**
 * Readiness Assessment Aggregate Root
 *
 * INNOVATION: The "Digital Lawyer's Brain"
 *
 * This aggregate is the CENTRAL INTELLIGENCE of the Succession Copilot:
 * 1. **Real-Time Risk Detection**: Constantly monitors Family & Estate data
 * 2. **Event-Driven Recalculation**: Auto-updates when external data changes
 * 3. **Smart Strategy Generation**: Tells user exactly what to do next
 * 4. **Legal Compliance Engine**: Enforces Kenyan succession law (S.56, S.40, etc.)
 *
 * AGGREGATE BOUNDARY:
 * - Root: ReadinessAssessment
 * - Entities: RiskFlag[] (collection) - Each risk is a legal compliance issue
 * - Value Objects: SuccessionContext (lens), ReadinessScore (traffic light)
 *
 * INVARIANTS (Business Rules):
 * 1. CRITICAL risk = Score = 0% (S.56 LSA blocker)
 * 2. 80%+ score with no critical risks = READY_TO_FILE
 * 3. Risk must have traceable source (RiskSource for audit trail)
 * 4. Context determines court jurisdiction (High vs Kadhi's vs Magistrate)
 *
 * EVENT-DRIVEN ARCHITECTURE:
 * Listens to events from Family & Estate services:
 * - AssetVerified → Resolves ASSET_VERIFICATION_FAILED
 * - GuardianAppointed → Resolves MINOR_WITHOUT_GUARDIAN
 * - DeathCertificateUploaded → Resolves MISSING_DOCUMENT
 * - WillValidated → Resolves INVALID_WILL_SIGNATURE
 */

interface ReadinessAssessmentProps {
  estateId: string;
  familyId?: string;
  successionContext: SuccessionContext;
  readinessScore: ReadinessScore;
  riskFlags: RiskFlag[];
  missingDocuments: DocumentGap[];
  blockingIssues: string[];
  recommendedStrategy: string;
  lastAssessedAt: Date;
  lastRecalculationTrigger?: string; // Event or manual
  isComplete: boolean;
  completedAt?: Date;
  totalRecalculations: number;
  version: number; // For optimistic concurrency
}

export class ReadinessAssessment extends AggregateRoot<ReadinessAssessmentProps> {
  // Constants for business rules
  private static readonly READY_THRESHOLD = 80;
  private static readonly AUTO_RECALCULATE_DAYS = 7; // Recalculate if older than 7 days

  private constructor(id: UniqueEntityID, props: ReadinessAssessmentProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get estateId(): string {
    return this.props.estateId;
  }

  get familyId(): string | undefined {
    return this.props.familyId;
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

  get lastRecalculationTrigger(): string | undefined {
    return this.props.lastRecalculationTrigger;
  }

  get isComplete(): boolean {
    return this.props.isComplete;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get totalRecalculations(): number {
    return this.props.totalRecalculations;
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
   * Get risks by category
   */
  public getRisksByCategory(category: RiskCategory): RiskFlag[] {
    return this.getUnresolvedRisks().filter((risk) => risk.category === category);
  }

  /**
   * Get risks by affected entity
   */
  public getRisksByEntity(entityId: string): RiskFlag[] {
    return this.getUnresolvedRisks().filter((risk) => risk.affectedEntityIds.includes(entityId));
  }

  /**
   * Get blocking risks
   */
  public getBlockingRisks(): RiskFlag[] {
    return this.getUnresolvedRisks().filter((risk) => risk.isBlocking);
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
   * Is this assessment stale (needs recalculation)?
   */
  public isStale(now: Date = new Date()): boolean {
    const ageInDays = (now.getTime() - this.props.lastAssessedAt.getTime()) / (1000 * 60 * 60 * 24);
    return ageInDays > ReadinessAssessment.AUTO_RECALCULATE_DAYS;
  }

  /**
   * Get top priority risks (for UI)
   */
  public getTopPriorityRisks(limit: number = 3): RiskFlag[] {
    return this.getUnresolvedRisks()
      .sort((a, b) => b.getPriorityScore() - a.getPriorityScore())
      .slice(0, limit);
  }

  // ==================== RISK MANAGEMENT ====================

  /**
   * Add a new risk flag
   * INVARIANT: No duplicate unresolved risks (same fingerprint)
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

    // Recalculate entire assessment
    this.recalculateWithUpdatedRisks(updatedRisks, 'risk_added');

    // Emit event
    this.addDomainEvent(
      new RiskFlagDetected(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        estateId: this.props.estateId,
        riskId: risk.id.toString(),
        severity: risk.severity,
        category: risk.category,
        description: risk.description,
        source: risk.source.toJSON(),
        isBlocking: risk.isBlocking,
      }),
    );
  }

  /**
   * Resolve a risk flag manually
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
    risk.resolve(ResolutionMethod.MANUAL_RESOLUTION, 'user', resolutionNotes);
    // Recalculate
    this.recalculateWithUpdatedRisks(this.props.riskFlags, 'risk_resolved_manual');

    // Emit event
    this.addDomainEvent(
      new RiskFlagResolved(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        estateId: this.props.estateId,
        riskId: risk.id.toString(),
        category: risk.category,
        resolutionMethod: 'MANUAL_ACTION',
        resolvedBy: 'user',
        resolutionNotes,
      }),
    );
  }

  /**
   * Auto-resolve risk based on external event
   * Used by event handlers in Application Layer
   */
  public autoResolveRisk(
    entityId: string,
    category: RiskCategory,
    eventType: string,
    resolvedBy: string = 'system',
  ): void {
    this.ensureNotDeleted();

    const matchingRisks = this.getUnresolvedRisks().filter(
      (risk) =>
        risk.affectedEntityIds.includes(entityId) &&
        risk.category === category &&
        risk.canBeResolvedByEvent(eventType),
    );

    if (matchingRisks.length === 0) {
      return; // No matching risks to resolve
    }

    // Resolve each matching risk
    matchingRisks.forEach((risk) => {
      risk.resolve(
        ResolutionMethod.EVENT_DRIVEN,
        resolvedBy,
        `Auto-resolved by ${eventType} event`,
      );
    });

    // Recalculate
    this.recalculateWithUpdatedRisks(this.props.riskFlags, `auto_resolve_${eventType}`);

    // Emit events for each resolved risk
    matchingRisks.forEach((risk) => {
      this.addDomainEvent(
        new RiskFlagAutoResolved(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          riskId: risk.id.toString(),
          category: risk.category,
          triggeredByEvent: eventType,
          resolvedBy,
        }),
      );
    });
  }

  // ==================== EVENT-DRIVEN METHODS ====================

  /**
   * Handle Asset Verified event from Estate Service
   */
  public handleAssetVerified(assetId: string): void {
    this.autoResolveRisk(assetId, RiskCategory.ASSET_VERIFICATION_FAILED, 'AssetVerified');
  }

  /**
   * Handle Guardian Appointed event from Family Service
   */
  public handleGuardianAppointed(minorId: string): void {
    this.autoResolveRisk(minorId, RiskCategory.MINOR_WITHOUT_GUARDIAN, 'GuardianAppointed');
  }

  /**
   * Handle Death Certificate Uploaded event
   */
  public handleDeathCertificateUploaded(): void {
    // Find and resolve all MISSING_DOCUMENT risks for death certificate
    const deathCertRisks = this.getUnresolvedRisks().filter(
      (risk) => risk.documentGap?.type === DocumentGapType.DEATH_CERTIFICATE,
    );

    deathCertRisks.forEach((risk) => {
      risk.resolve(ResolutionMethod.EVENT_DRIVEN, 'system', 'Death certificate uploaded');
    });

    if (deathCertRisks.length > 0) {
      this.recalculateWithUpdatedRisks(this.props.riskFlags, 'death_cert_uploaded');
    }
  }

  /**
   * Handle Will Validated event
   */
  public handleWillValidated(willId: string): void {
    this.autoResolveRisk(willId, RiskCategory.INVALID_WILL_SIGNATURE, 'WillValidated');
  }

  /**
   * Handle Estate Value Updated event
   * May change court jurisdiction (High vs Magistrate)
   */
  public handleEstateValueUpdated(newValue: number): void {
    const currentContext = this.props.successionContext;

    // Check if court jurisdiction changes
    const currentCourt = currentContext.determineCourtJurisdiction();
    const newCourt = currentContext.determineCourtJurisdiction(); // Note: This needs context with new value

    if (currentCourt !== newCourt) {
      // Create new context with updated estate value
      const newContextProps = {
        ...currentContext.toJSON(),
        estateValueKES: newValue,
      };

      const newContext = SuccessionContext.fromJSON(newContextProps);

      // Update context and recalculate
      this.updateContext(newContext, 'estate_value_updated');
    }
  }

  // ==================== CONTEXT & STRATEGY ====================

  /**
   * Update succession context (e.g., Will discovered, marriage type changed)
   */
  public updateContext(newContext: SuccessionContext, trigger: string = 'manual_update'): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    // Check if context actually changed
    if (this.props.successionContext.equals(newContext)) {
      return;
    }

    // Update context
    this.updateState({
      successionContext: newContext,
      lastAssessedAt: new Date(),
      lastRecalculationTrigger: trigger,
    });

    // Recalculate with new context
    this.recalculateFull(newContext, trigger);
  }

  /**
   * Generate and update recommended strategy
   */
  public updateRecommendedStrategy(): void {
    const newStrategy = this.generateRecommendedStrategy();

    this.updateState({
      recommendedStrategy: newStrategy,
      lastAssessedAt: new Date(),
    });

    this.addDomainEvent(
      new RecommendedStrategyUpdated(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          estateId: this.props.estateId,
          strategy: newStrategy,
        },
      ),
    );
  }

  // ==================== ASSESSMENT LIFECYCLE ====================

  /**
   * Recalculate the entire assessment
   * Called when external data changes or periodically
   */
  public recalculate(trigger: string = 'manual_recalculation'): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    this.recalculateFull(this.props.successionContext, trigger);
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
      const blockingCount = this.getBlockingRisks().length;
      throw new Error(
        `Cannot complete assessment - not ready to file. ` +
          `Current score: ${this.props.readinessScore.score}%, ` +
          `Blocking risks: ${blockingCount}`,
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
          familyId: this.props.familyId,
          finalScore: this.props.readinessScore.score,
          finalStatus: this.props.readinessScore.status,
          completedAt: new Date(),
          totalRecalculations: this.props.totalRecalculations,
        },
      ),
    );
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Recalculate with updated risks
   */
  private recalculateWithUpdatedRisks(updatedRisks: RiskFlag[], trigger: string): void {
    const newScore = this.recalculateScore(updatedRisks);
    const missingDocs = this.calculateMissingDocuments(updatedRisks);
    const blockingIssues = this.calculateBlockingIssues(updatedRisks);
    const strategy = this.generateRecommendedStrategy();

    // Check if score or status changed
    const scoreChanged = this.props.readinessScore.score !== newScore.score;
    const statusChanged = this.props.readinessScore.status !== newScore.status;

    this.updateState({
      readinessScore: newScore,
      riskFlags: updatedRisks,
      missingDocuments: missingDocs,
      blockingIssues,
      recommendedStrategy: strategy,
      lastAssessedAt: new Date(),
      lastRecalculationTrigger: trigger,
      totalRecalculations: this.props.totalRecalculations + 1,
    });

    // Emit appropriate events
    if (scoreChanged || statusChanged) {
      this.addDomainEvent(
        new ReadinessScoreUpdated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          previousScore: this.props.readinessScore.score,
          newScore: newScore.score,
          previousStatus: this.props.readinessScore.status,
          newStatus: newScore.status,
          trigger,
        }),
      );

      if (statusChanged) {
        this.addDomainEvent(
          new ReadinessStatusChanged(
            this.id.toString(),
            this.getAggregateType(),
            this.getVersion(),
            {
              estateId: this.props.estateId,
              previousStatus: this.props.readinessScore.status,
              newStatus: newScore.status,
              newScore: newScore.score,
              trigger,
            },
          ),
        );
      }
    }

    // Emit recalculation event
    this.addDomainEvent(
      new ReadinessAssessmentRecalculated(
        this.id.toString(),
        this.getAggregateType(),
        this.getVersion(),
        {
          estateId: this.props.estateId,
          newScore: newScore.score,
          newStatus: newScore.status,
          trigger,
          totalRisks: updatedRisks.length,
          unresolvedRisks: this.getUnresolvedRisks().length,
        },
      ),
    );
  }

  /**
   * Full recalculation with optional new context
   */
  private recalculateFull(newContext: SuccessionContext, trigger: string): void {
    const newScore = this.recalculateScore(this.props.riskFlags);
    const missingDocs = this.calculateMissingDocuments(this.props.riskFlags);
    const blockingIssues = this.calculateBlockingIssues(this.props.riskFlags);
    const strategy = this.generateRecommendedStrategy();

    // Check for changes
    const scoreChanged = this.props.readinessScore.score !== newScore.score;
    const statusChanged = this.props.readinessScore.status !== newScore.status;

    this.updateState({
      successionContext: newContext,
      readinessScore: newScore,
      missingDocuments: missingDocs,
      blockingIssues,
      recommendedStrategy: strategy,
      lastAssessedAt: new Date(),
      lastRecalculationTrigger: trigger,
      totalRecalculations: this.props.totalRecalculations + 1,
    });

    // Emit events for changes
    if (scoreChanged || statusChanged) {
      this.addDomainEvent(
        new ReadinessScoreUpdated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          previousScore: this.props.readinessScore.score,
          newScore: newScore.score,
          previousStatus: this.props.readinessScore.status,
          newStatus: newScore.status,
          trigger,
        }),
      );
    }

    if (statusChanged) {
      this.addDomainEvent(
        new ReadinessStatusChanged(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          estateId: this.props.estateId,
          previousStatus: this.props.readinessScore.status,
          newStatus: newScore.status,
          newScore: newScore.score,
          trigger,
        }),
      );
    }

    // Emit document gap events for new missing documents
    const previousDocTypes = this.props.missingDocuments.map((doc) => doc.type);
    const newDocTypes = missingDocs.map((doc) => doc.type);

    newDocTypes.forEach((docType) => {
      if (!previousDocTypes.includes(docType)) {
        const docGap = missingDocs.find((doc) => doc.type === docType);
        if (docGap) {
          this.addDomainEvent(
            new DocumentGapIdentified(
              this.id.toString(),
              this.getAggregateType(),
              this.getVersion(),
              {
                estateId: this.props.estateId,
                documentType: docType,
                severity: this.convertToRiskSeverity(docGap.severity),
                description: docGap.description,
                isBlocking: docGap.isBlocking(),
              },
            ),
          );
        }
      }
    });
  }

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

    return ReadinessScore.calculate(
      { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount },
      this.props.successionContext,
      'system',
    );
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
    return risks
      .filter((r) => r.isBlocking)
      .map((r) => `${r.category}: ${r.description} (${r.legalBasis})`);
  }

  /**
   * Generate recommended strategy based on context and risks
   */
  private generateRecommendedStrategy(): string {
    const context = this.props.successionContext;
    const score = this.props.readinessScore;
    const blockingRisks = this.getBlockingRisks();

    // If blocked, list blocking issues
    if (blockingRisks.length > 0) {
      const court = context.determineCourtJurisdiction();
      return (
        `⛔ **BLOCKED - Cannot File in ${court}**\n\n` +
        `**Critical Issues (${blockingRisks.length}):**\n` +
        blockingRisks
          .map((risk, i) => `${i + 1}. ${risk.description}\n   → ${risk.mitigationSteps[0]}`)
          .join('\n\n') +
        `\n\n**Next Action:** Resolve all critical issues above.`
      );
    }

    // If ready to file, provide filing instructions
    if (score.canFile()) {
      const court = context.determineCourtJurisdiction();
      const courtName = this.getCourtName(court);
      const applicationType = this.getApplicationType(context);
      const confidence = score.filingConfidence.toLowerCase();

      return (
        `✅ **READY TO FILE - ${score.score}% Ready**\n\n` +
        `**Court:** ${courtName}\n` +
        `**Application:** ${applicationType}\n` +
        `**Confidence:** ${confidence}\n\n` +
        `**Next Steps:**\n` +
        `1. Review generated forms\n` +
        `2. Collect ${this.props.missingDocuments.length} missing document(s)\n` +
        `3. Submit to ${court} registry\n` +
        `4. Pay estimated fees: KES ${this.estimateFilingFees()}\n\n` +
        `**Note:** ${score.getMessage()}`
      );
    }

    // In progress - prioritize next actions
    const topRisks = this.getTopPriorityRisks(3);
    const percentageToGo = score.getPercentageToFiling();

    return (
      `🔄 **IN PROGRESS - ${score.score}% Ready**\n\n` +
      `**Target:** ${ReadinessAssessment.READY_THRESHOLD}% (${percentageToGo}% to go)\n\n` +
      `**Priority Actions:**\n` +
      (topRisks.length > 0
        ? topRisks
            .map((risk, i) => `${i + 1}. ${risk.description}\n   → ${risk.mitigationSteps[0]}`)
            .join('\n\n')
        : 'No high-priority risks. Continue gathering documents.') +
      `\n\n**Timeline:** Estimated ${score.estimatedDaysToReady || 30} days to ready`
    );
  }

  /**
   * Get court name from jurisdiction
   */
  private getCourtName(jurisdiction: string): string {
    const courts: Record<string, string> = {
      HIGH_COURT: 'High Court of Kenya',
      MAGISTRATE_COURT: "Resident Magistrate's Court",
      KADHIS_COURT: "Kadhi's Court",
      FAMILY_DIVISION: 'High Court (Family Division)',
    };
    return courts[jurisdiction] || jurisdiction;
  }

  /**
   * Get application type from context
   */
  private getApplicationType(context: SuccessionContext): string {
    if (context.requiresKadhisCourt()) {
      return 'Islamic Succession Petition';
    }
    if (context.regime === SuccessionRegime.TESTATE) {
      return 'Grant of Probate (P&A 1)';
    }
    if (context.regime === SuccessionRegime.INTESTATE) {
      return 'Letters of Administration (P&A 80)';
    }
    return 'Summary Administration (P&A 5)';
  }

  /**
   * Estimate filing fees (simplified)
   */
  private estimateFilingFees(): number {
    const court = this.props.successionContext.determineCourtJurisdiction();
    const baseFees: Record<string, number> = {
      HIGH_COURT: 5000,
      MAGISTRATE_COURT: 2000,
      KADHIS_COURT: 3000,
      FAMILY_DIVISION: 5000,
    };
    return baseFees[court] || 2000;
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

    // INVARIANT 5: All risks must have valid sources
    this.props.riskFlags.forEach((risk) => {
      if (!risk.source) {
        throw new Error(`Risk ${risk.id.toString()} has no source`);
      }
    });
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
      case 'RiskFlagAutoResolved':
        // Risk already resolved via business logic
        break;
      case 'ReadinessScoreUpdated':
        // Score already updated via business logic
        break;
      case 'ReadinessStatusChanged':
        // Status already updated via business logic
        break;
      case 'DocumentGapIdentified':
        // Document gap already identified
        break;
      case 'RecommendedStrategyUpdated':
        // Strategy already updated
        break;
      default:
        // Unknown event type - ignore
        break;
    }
  }
  private convertToRiskSeverity(gapSeverity: DocumentGapSeverity): RiskSeverity {
    // This is safe because the enums have identical string values
    const severityMap: Record<DocumentGapSeverity, RiskSeverity> = {
      [DocumentGapSeverity.CRITICAL]: RiskSeverity.CRITICAL,
      [DocumentGapSeverity.HIGH]: RiskSeverity.HIGH,
      [DocumentGapSeverity.MEDIUM]: RiskSeverity.MEDIUM,
      [DocumentGapSeverity.LOW]: RiskSeverity.LOW,
    };

    return severityMap[gapSeverity];
  }
  // ==================== FACTORY METHODS ====================

  /**
   * Create a new readiness assessment
   */
  public static create(
    estateId: string,
    familyId: string,
    successionContext: SuccessionContext,
    initialRisks: RiskFlag[] = [],
  ): ReadinessAssessment {
    const id = UniqueEntityID.newID();

    // Calculate initial score
    const initialScore = ReadinessScore.calculate(
      { critical: 0, high: 0, medium: 0, low: 0 }, // Start perfect
      successionContext,
      'system',
    );

    const assessment = new ReadinessAssessment(id, {
      estateId,
      familyId,
      successionContext,
      readinessScore: initialScore,
      riskFlags: initialRisks,
      missingDocuments: [],
      blockingIssues: [],
      recommendedStrategy: 'Starting assessment...',
      lastAssessedAt: new Date(),
      isComplete: false,
      totalRecalculations: 0,
      version: 1,
    });

    // If there are initial risks, recalculate
    if (initialRisks.length > 0) {
      const recalculatedScore = assessment.recalculateScore(initialRisks);
      const missingDocs = assessment.calculateMissingDocuments(initialRisks);
      const blockingIssues = assessment.calculateBlockingIssues(initialRisks);
      const strategy = assessment.generateRecommendedStrategy();

      assessment.updateState({
        readinessScore: recalculatedScore,
        missingDocuments: missingDocs,
        blockingIssues,
        recommendedStrategy: strategy,
      });
    }

    // Emit creation event
    assessment.addDomainEvent(
      new ReadinessAssessmentCreated(id.toString(), assessment.getAggregateType(), 1, {
        estateId,
        familyId,
        successionContext: successionContext.toJSON(),
        initialScore: assessment.props.readinessScore.score,
        initialStatus: assessment.props.readinessScore.status,
      }),
    );

    return assessment;
  }

  /**
   * Create assessment with common initial risks
   */
  public static createWithInitialRisks(
    estateId: string,
    familyId: string,
    deceasedId: string,
    successionContext: SuccessionContext,
    hasDeathCert: boolean,
    hasKraPin: boolean,
    hasChiefLetter: boolean,
  ): ReadinessAssessment {
    const initialRisks: RiskFlag[] = [];

    // Always check for death certificate
    if (!hasDeathCert) {
      initialRisks.push(
        RiskFlag.createMissingDeathCert(
          estateId,
          RiskSource.fromComplianceEngine('RULE_DEATH_CERT_REQUIRED', [
            {
              act: 'LSA',
              section: '56',
              description: 'Death Certificate mandatory',
              isMandatory: true,
            },
          ]),
        ),
      );
    }

    // Always check for KRA PIN
    if (!hasKraPin) {
      initialRisks.push(
        RiskFlag.createMissingKraPin(
          deceasedId,
          estateId,
          RiskSource.fromComplianceEngine('RULE_KRA_PIN_REQUIRED', [
            {
              act: 'Tax Procedures Act',
              section: '56A',
              description: 'KRA PIN required',
              isMandatory: true,
            },
          ]),
        ),
      );
    }

    // Check for chief's letter if intestate
    if (successionContext.regime === SuccessionRegime.INTESTATE && !hasChiefLetter) {
      initialRisks.push(
        RiskFlag.createMissingChiefLetter(
          estateId,
          RiskSource.fromComplianceEngine('RULE_CHIEF_LETTER_REQUIRED', [
            {
              act: 'Customary Law',
              section: 'N/A',
              description: "Chief's letter for intestate",
              isMandatory: true,
            },
          ]),
        ),
      );
    }

    return ReadinessAssessment.create(estateId, familyId, successionContext, initialRisks);
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
