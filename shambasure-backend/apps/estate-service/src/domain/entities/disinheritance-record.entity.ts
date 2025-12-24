// domain/entities/disinheritance-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Disinheritance Record Entity
 *
 * Kenyan Legal Context:
 * - Testator has testamentary freedom to exclude people
 * - HOWEVER: Section 26 LSA allows dependants to challenge
 * - Court may override will if it fails to provide for dependants
 *
 * WHEN TO USE:
 * - Explicitly exclude someone who would otherwise inherit
 * - Provide reasons (helps defend against S.26 challenges)
 * - Document grounds (e.g., estrangement, misconduct)
 *
 * LEGAL EFFECT:
 * - Prevents default intestate rules from applying
 * - Shows testator's clear intention
 * - Creates rebuttable presumption against claimant
 *
 * IMPORTANT:
 * - Cannot absolutely disinherit dependant children
 * - Cannot absolutely disinherit spouse (unless valid reason)
 * - Court has discretion to override under S.26
 * - Reasons should be specific and documented
 *
 * ENTITY RESPONSIBILITIES:
 * - Record who is disinherited
 * - Document reasons (critical for court)
 * - Track challenges and outcomes
 * - Support S.26 defense
 *
 * Owned by: Will Aggregate
 */

export enum DisinheritanceType {
  COMPLETE = 'COMPLETE', // Fully excluded from will
  PARTIAL = 'PARTIAL', // Reduced share (e.g., $1 nominal)
  CONDITIONAL = 'CONDITIONAL', // Only if certain behavior continues
}

export enum DisinheritanceReason {
  ESTRANGEMENT = 'ESTRANGEMENT', // No relationship for years
  ABANDONMENT = 'ABANDONMENT', // Left family, no contact
  ABUSE = 'ABUSE', // Physical/emotional abuse
  FINANCIAL_INDEPENDENCE = 'FINANCIAL_INDEPENDENCE', // Already wealthy
  ADEQUATE_PROVISION = 'ADEQUATE_PROVISION', // Provided for during life
  MISCONDUCT = 'MISCONDUCT', // Serious wrongdoing
  LACK_OF_DEPENDENCY = 'LACK_OF_DEPENDENCY', // Not dependent on testator
  PRIOR_GIFT = 'PRIOR_GIFT', // Received substantial gift
  OTHER = 'OTHER', // Specify in details
}

export enum DisinheritanceStatus {
  ACTIVE = 'ACTIVE', // Currently in effect
  CHALLENGED = 'CHALLENGED', // Under S.26 dispute
  UPHELD = 'UPHELD', // Court upheld disinheritance
  OVERTURNED = 'OVERTURNED', // Court overrode disinheritance
  REVOKED = 'REVOKED', // Testator changed mind
}

interface DisinheritanceRecordProps {
  willId: string;

  // Who is disinherited
  disinheritedMemberId: string; // From family-service
  disinheritedName: string; // For readability
  relationshipToTestator: string; // "Son", "Daughter", "Spouse"

  // Type & Extent
  type: DisinheritanceType;
  nominalAmountKES?: number; // If PARTIAL (e.g., KES 1)

  // Reasons (CRITICAL for S.26 defense)
  primaryReason: DisinheritanceReason;
  reasonDetails: string; // Specific facts
  supportingEvidence?: string[]; // Document IDs

  // Timeline
  effectiveDate: Date; // When disinheritance takes effect

  // Status & Challenges
  status: DisinheritanceStatus;
  challengedAt?: Date;
  challengeGrounds?: string; // S.26 claim basis
  courtDecision?: string;
  courtDecisionDate?: Date;

  // Revocation
  revokedAt?: Date;
  revocationReason?: string;

  // Alternative provision
  alternativeProvisionMade: boolean;
  alternativeProvisionDetails?: string;

  // Testator's statement (verbatim)
  testatorStatement?: string;

  // Warnings
  isVulnerableToChallenge: boolean;
  vulnerabilityReason?: string;

  // Notes
  notes?: string;
}

export class DisinheritanceRecord extends Entity<DisinheritanceRecordProps> {
  private constructor(id: UniqueEntityID, props: DisinheritanceRecordProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // Factory: Create new disinheritance
  public static create(
    willId: string,
    disinheritedMemberId: string,
    disinheritedName: string,
    relationshipToTestator: string,
    type: DisinheritanceType,
    primaryReason: DisinheritanceReason,
    reasonDetails: string,
    testatorStatement?: string,
  ): DisinheritanceRecord {
    const id = new UniqueEntityID();

    const props: DisinheritanceRecordProps = {
      willId,
      disinheritedMemberId,
      disinheritedName,
      relationshipToTestator,
      type,
      primaryReason,
      reasonDetails,
      testatorStatement,
      effectiveDate: new Date(),
      status: DisinheritanceStatus.ACTIVE,
      alternativeProvisionMade: false,
      isVulnerableToChallenge: false,
    };

    const record = new DisinheritanceRecord(id, props);

    // Auto-assess vulnerability
    record.assessVulnerability();

    return record;
  }

  // Factory: Reconstitute
  public static reconstitute(
    id: string,
    props: DisinheritanceRecordProps,
    createdAt: Date,
    updatedAt: Date,
  ): DisinheritanceRecord {
    const record = new DisinheritanceRecord(new UniqueEntityID(id), props, createdAt);
    (record as any)._updatedAt = updatedAt;
    return record;
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get disinheritedMemberId(): string {
    return this.props.disinheritedMemberId;
  }

  get disinheritedName(): string {
    return this.props.disinheritedName;
  }

  get relationshipToTestator(): string {
    return this.props.relationshipToTestator;
  }

  get type(): DisinheritanceType {
    return this.props.type;
  }

  get primaryReason(): DisinheritanceReason {
    return this.props.primaryReason;
  }

  get reasonDetails(): string {
    return this.props.reasonDetails;
  }

  get status(): DisinheritanceStatus {
    return this.props.status;
  }

  get isVulnerableToChallenge(): boolean {
    return this.props.isVulnerableToChallenge;
  }

  get testatorStatement(): string | undefined {
    return this.props.testatorStatement;
  }

  // =========================================================================
  // BUSINESS LOGIC - VULNERABILITY ASSESSMENT
  // =========================================================================

  /**
   * Assess if this disinheritance is vulnerable to S.26 challenge
   *
   * High Risk:
   * - Minor children
   * - Dependent spouse
   * - Disabled adult children
   * - Weak/vague reasons
   *
   * Low Risk:
   * - Adult, independent children
   * - Documented abuse/estrangement
   * - Alternative provision made
   */
  public assessVulnerability(): void {
    this.ensureNotDeleted();

    const vulnerabilityFactors: string[] = [];
    let isVulnerable = false;

    // Factor 1: Relationship (children/spouse more protected)
    if (
      this.props.relationshipToTestator.toLowerCase().includes('child') ||
      this.props.relationshipToTestator.toLowerCase().includes('son') ||
      this.props.relationshipToTestator.toLowerCase().includes('daughter')
    ) {
      vulnerabilityFactors.push('Children have strong S.26 rights');
      isVulnerable = true;
    }

    if (this.props.relationshipToTestator.toLowerCase().includes('spouse')) {
      vulnerabilityFactors.push('Spouse has strong S.26 rights');
      isVulnerable = true;
    }

    // Factor 2: Reason strength
    const weakReasons = [DisinheritanceReason.OTHER, DisinheritanceReason.LACK_OF_DEPENDENCY];

    if (weakReasons.includes(this.props.primaryReason)) {
      vulnerabilityFactors.push('Reason may be considered weak by court');
      isVulnerable = true;
    }

    // Factor 3: Reason detail sufficiency
    if (this.props.reasonDetails.length < 50) {
      vulnerabilityFactors.push('Insufficient detail in reasons');
      isVulnerable = true;
    }

    // Factor 4: Evidence
    if (!this.props.supportingEvidence || this.props.supportingEvidence.length === 0) {
      vulnerabilityFactors.push('No supporting evidence provided');
      isVulnerable = true;
    }

    // Factor 5: Alternative provision
    if (!this.props.alternativeProvisionMade) {
      vulnerabilityFactors.push('No alternative provision made');
      isVulnerable = true;
    }

    // Factor 6: Complete vs Partial
    if (this.props.type === DisinheritanceType.COMPLETE) {
      vulnerabilityFactors.push('Complete disinheritance is harder to defend');
      isVulnerable = true;
    }

    (this.props as any).isVulnerableToChallenge = isVulnerable;
    (this.props as any).vulnerabilityReason = isVulnerable
      ? vulnerabilityFactors.join('; ')
      : 'Well-documented disinheritance with strong grounds';

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - REASON & EVIDENCE
  // =========================================================================

  /**
   * Update reason details (strengthen defense)
   */
  public updateReasonDetails(details: string): void {
    this.ensureNotDeleted();

    if (this.status === DisinheritanceStatus.UPHELD) {
      throw new Error('Cannot update after court upheld');
    }

    if (details.length < 20) {
      throw new Error('Reason details must be at least 20 characters');
    }

    (this.props as any).reasonDetails = details;
    this.assessVulnerability();
    this.incrementVersion();
  }

  /**
   * Add supporting evidence document
   */
  public addSupportingEvidence(documentId: string): void {
    this.ensureNotDeleted();

    if (!this.props.supportingEvidence) {
      (this.props as any).supportingEvidence = [];
    }

    if (this.props.supportingEvidence.includes(documentId)) {
      throw new Error('Document already added as evidence');
    }

    this.props.supportingEvidence.push(documentId);
    this.assessVulnerability();
    this.incrementVersion();
  }

  /**
   * Set testator's verbatim statement
   */
  public setTestatorStatement(statement: string): void {
    this.ensureNotDeleted();

    if (statement.length < 20) {
      throw new Error('Testator statement must be at least 20 characters');
    }

    (this.props as any).testatorStatement = statement;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - ALTERNATIVE PROVISION
  // =========================================================================

  /**
   * Record that alternative provision was made
   * (e.g., paid for education, gave house during life)
   */
  public recordAlternativeProvision(details: string): void {
    this.ensureNotDeleted();

    (this.props as any).alternativeProvisionMade = true;
    (this.props as any).alternativeProvisionDetails = details;
    this.assessVulnerability();
    this.incrementVersion();
  }

  /**
   * Set nominal amount (for PARTIAL disinheritance)
   */
  public setNominalAmount(amountKES: number): void {
    this.ensureNotDeleted();

    if (this.props.type !== DisinheritanceType.PARTIAL) {
      throw new Error('Can only set nominal amount for PARTIAL disinheritance');
    }

    if (amountKES <= 0) {
      throw new Error('Nominal amount must be positive');
    }

    (this.props as any).nominalAmountKES = amountKES;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - CHALLENGES (S.26 LSA)
  // =========================================================================

  /**
   * Mark as challenged under S.26 (dependant claim)
   */
  public challenge(grounds: string): void {
    this.ensureNotDeleted();

    if (this.status === DisinheritanceStatus.CHALLENGED) {
      throw new Error('Already challenged');
    }

    if (this.status === DisinheritanceStatus.UPHELD) {
      throw new Error('Cannot challenge after being upheld');
    }

    (this.props as any).status = DisinheritanceStatus.CHALLENGED;
    (this.props as any).challengedAt = new Date();
    (this.props as any).challengeGrounds = grounds;
    this.incrementVersion();
  }

  /**
   * Record court decision on challenge
   */
  public recordCourtDecision(decision: 'UPHELD' | 'OVERTURNED', reasoning?: string): void {
    this.ensureNotDeleted();

    if (this.status !== DisinheritanceStatus.CHALLENGED) {
      throw new Error('Can only record decision for challenged disinheritance');
    }

    (this.props as any).status =
      decision === 'UPHELD' ? DisinheritanceStatus.UPHELD : DisinheritanceStatus.OVERTURNED;

    (this.props as any).courtDecision = reasoning;
    (this.props as any).courtDecisionDate = new Date();
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - REVOCATION
  // =========================================================================

  /**
   * Testator revokes disinheritance (changed mind)
   */
  public revoke(reason?: string): void {
    this.ensureNotDeleted();

    if (this.status === DisinheritanceStatus.UPHELD) {
      throw new Error('Cannot revoke after court upheld');
    }

    if (this.status === DisinheritanceStatus.REVOKED) {
      throw new Error('Already revoked');
    }

    (this.props as any).status = DisinheritanceStatus.REVOKED;
    (this.props as any).revokedAt = new Date();
    (this.props as any).revocationReason = reason;
    this.incrementVersion();
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  public isActive(): boolean {
    return this.status === DisinheritanceStatus.ACTIVE;
  }

  public isChallenged(): boolean {
    return this.status === DisinheritanceStatus.CHALLENGED;
  }

  public isUpheld(): boolean {
    return this.status === DisinheritanceStatus.UPHELD;
  }

  public isOverturned(): boolean {
    return this.status === DisinheritanceStatus.OVERTURNED;
  }

  public isRevoked(): boolean {
    return this.status === DisinheritanceStatus.REVOKED;
  }

  public isComplete(): boolean {
    return this.type === DisinheritanceType.COMPLETE;
  }

  public isPartial(): boolean {
    return this.type === DisinheritanceType.PARTIAL;
  }

  public hasStrongDefense(): boolean {
    return (
      !this.props.isVulnerableToChallenge &&
      this.props.supportingEvidence &&
      this.props.supportingEvidence.length > 0 &&
      this.props.reasonDetails.length >= 100
    );
  }

  public hasAlternativeProvision(): boolean {
    return this.props.alternativeProvisionMade;
  }

  public hasEvidenceSupport(): boolean {
    return !!this.props.supportingEvidence && this.props.supportingEvidence.length > 0;
  }

  // =========================================================================
  // BUSINESS LOGIC - VALIDATION
  // =========================================================================

  /**
   * Validate disinheritance record
   */
  public validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Mandatory fields
    if (!this.props.disinheritedName || this.props.disinheritedName.trim().length === 0) {
      errors.push('Disinherited person name is required');
    }

    if (
      !this.props.relationshipToTestator ||
      this.props.relationshipToTestator.trim().length === 0
    ) {
      errors.push('Relationship to testator is required');
    }

    if (!this.props.reasonDetails || this.props.reasonDetails.length < 20) {
      errors.push('Reason details must be at least 20 characters');
    }

    // Partial disinheritance validation
    if (this.props.type === DisinheritanceType.PARTIAL && !this.props.nominalAmountKES) {
      errors.push('Nominal amount required for PARTIAL disinheritance');
    }

    // Warnings for vulnerability
    if (this.props.isVulnerableToChallenge) {
      warnings.push(`Vulnerable to challenge: ${this.props.vulnerabilityReason}`);
    }

    if (!this.hasEvidenceSupport()) {
      warnings.push('No supporting evidence - consider adding documentation');
    }

    if (!this.hasAlternativeProvision()) {
      warnings.push('No alternative provision recorded - may weaken defense');
    }

    if (this.props.reasonDetails.length < 100) {
      warnings.push('Consider providing more detailed reasons (< 100 chars)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get legal strength assessment
   */
  public getLegalStrength(): {
    score: number;
    rating: 'STRONG' | 'MODERATE' | 'WEAK';
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // Deduct for vulnerability factors
    if (this.props.isVulnerableToChallenge) {
      score -= 30;
    }

    // Deduct for lack of evidence
    if (!this.hasEvidenceSupport()) {
      score -= 20;
      recommendations.push('Add supporting documentation');
    }

    // Deduct for weak reasons
    if (this.props.reasonDetails.length < 50) {
      score -= 15;
      recommendations.push('Provide more detailed reasons');
    }

    // Deduct for no alternative provision
    if (!this.hasAlternativeProvision()) {
      score -= 15;
      recommendations.push('Document any alternative provision made');
    }

    // Deduct for complete vs partial
    if (this.isComplete()) {
      score -= 10;
      recommendations.push('Consider partial disinheritance instead of complete');
    }

    // Bonus for testator statement
    if (this.props.testatorStatement && this.props.testatorStatement.length > 50) {
      score += 10;
    }

    const rating: 'STRONG' | 'MODERATE' | 'WEAK' =
      score >= 70 ? 'STRONG' : score >= 40 ? 'MODERATE' : 'WEAK';

    return {
      score,
      rating,
      recommendations,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    const validation = this.validate();
    const legalStrength = this.getLegalStrength();

    return {
      id: this.id.toString(),
      willId: this.props.willId,
      disinheritedMemberId: this.props.disinheritedMemberId,
      disinheritedName: this.props.disinheritedName,
      relationshipToTestator: this.props.relationshipToTestator,
      type: this.props.type,
      nominalAmountKES: this.props.nominalAmountKES,
      primaryReason: this.props.primaryReason,
      reasonDetails: this.props.reasonDetails,
      supportingEvidence: this.props.supportingEvidence,
      effectiveDate: this.props.effectiveDate.toISOString(),
      status: this.props.status,
      challengedAt: this.props.challengedAt?.toISOString(),
      challengeGrounds: this.props.challengeGrounds,
      courtDecision: this.props.courtDecision,
      courtDecisionDate: this.props.courtDecisionDate?.toISOString(),
      revokedAt: this.props.revokedAt?.toISOString(),
      revocationReason: this.props.revocationReason,
      alternativeProvisionMade: this.props.alternativeProvisionMade,
      alternativeProvisionDetails: this.props.alternativeProvisionDetails,
      testatorStatement: this.props.testatorStatement,
      isVulnerableToChallenge: this.props.isVulnerableToChallenge,
      vulnerabilityReason: this.props.vulnerabilityReason,
      notes: this.props.notes,
      hasStrongDefense: this.hasStrongDefense(),
      validation,
      legalStrength,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
