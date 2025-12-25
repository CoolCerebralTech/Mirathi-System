// domain/entities/disinheritance-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Disinheritance Record Entity
 *
 * Kenyan Legal Context (Law of Succession Act, Cap 160):
 * - S.5 LSA: Freedom of testation (but limited by S.26)
 * - S.26 LSA: Court may make provision for dependants despite will
 * - S.29 LSA: Definition of dependants who may claim
 * - S.30 LSA: Factors court considers for dependant provision
 *
 * Critical Legal Principles:
 * 1. Testator has right to exclude anyone from will (S.5)
 * 2. BUT dependants (S.29) can still make claims (S.26)
 * 3. Court considers reasons for disinheritance (S.30(f))
 * 4. Disinheritance must be CLEAR and UNAMBIGUOUS
 *
 * Entity Scope:
 * 1. Records explicit exclusion of a person from inheritance
 * 2. Stores testator's stated reasons for exclusion
 * 3. Tracks legal challenges to disinheritance
 * 4. Validates disinheritance doesn't violate S.26
 */

// =========================================================================
// VALUE OBJECTS
// =========================================================================

/**
 * Disinherited Person Identity Value Object
 */
export class DisinheritedPerson {
  constructor(
    readonly type:
      | 'FAMILY_MEMBER'
      | 'SPOUSE'
      | 'CHILD'
      | 'PARENT'
      | 'SIBLING'
      | 'OTHER_RELATIVE'
      | 'EXTERNAL',
    readonly id?: string, // Family member ID or user ID
    readonly externalDetails?: {
      name: string;
      nationalId?: string;
      relationshipToTestator: string; // e.g., "Son", "Brother", "Former Business Partner"
      contactInfo?: {
        phone?: string;
        email?: string;
        address?: string;
      };
    },
  ) {
    if (!type) {
      throw new Error('Disinherited person type is required');
    }

    // System person validation
    if (type !== 'EXTERNAL' && !id) {
      throw new Error('ID is required for system persons');
    }

    // External person validation
    if (type === 'EXTERNAL' && !externalDetails?.name) {
      throw new Error('External disinherited person must have name');
    }

    if (type === 'EXTERNAL' && !externalDetails?.relationshipToTestator) {
      throw new Error('External disinherited person must have relationship specified');
    }
  }

  equals(other: DisinheritedPerson): boolean {
    if (this.type !== other.type) return false;

    // Compare by ID for system persons
    if (this.type !== 'EXTERNAL' && this.id && other.id) {
      return this.id === other.id;
    }

    // Compare by details for external persons
    if (this.type === 'EXTERNAL' && this.externalDetails && other.externalDetails) {
      return (
        this.externalDetails.name === other.externalDetails.name &&
        this.externalDetails.nationalId === other.externalDetails.nationalId
      );
    }

    return false;
  }

  isFamilyMember(): boolean {
    return this.type === 'FAMILY_MEMBER';
  }

  isSpouse(): boolean {
    return this.type === 'SPOUSE';
  }

  isChild(): boolean {
    return this.type === 'CHILD';
  }

  isParent(): boolean {
    return this.type === 'PARENT';
  }

  isSibling(): boolean {
    return this.type === 'SIBLING';
  }

  isRelative(): boolean {
    return ['FAMILY_MEMBER', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER_RELATIVE'].includes(
      this.type,
    );
  }

  isExternal(): boolean {
    return this.type === 'EXTERNAL';
  }

  getName(): string {
    if (this.externalDetails) {
      return this.externalDetails.name;
    }
    // In real system, would fetch from family member or user service
    return `Disinherited ${this.type} (ID: ${this.id})`;
  }

  getRelationship(): string {
    if (this.externalDetails) {
      return this.externalDetails.relationshipToTestator;
    }
    return this.type.toLowerCase();
  }

  isDependant(): boolean {
    // S.29 LSA: Dependants include spouse, children, parents, siblings in some cases
    return ['SPOUSE', 'CHILD', 'PARENT'].includes(this.type);
  }

  static createFamilyMember(familyMemberId: string): DisinheritedPerson {
    return new DisinheritedPerson('FAMILY_MEMBER', familyMemberId);
  }

  static createSpouse(familyMemberId: string): DisinheritedPerson {
    return new DisinheritedPerson('SPOUSE', familyMemberId);
  }

  static createChild(familyMemberId: string): DisinheritedPerson {
    return new DisinheritedPerson('CHILD', familyMemberId);
  }

  static createParent(familyMemberId: string): DisinheritedPerson {
    return new DisinheritedPerson('PARENT', familyMemberId);
  }

  static createExternal(
    name: string,
    relationshipToTestator: string,
    nationalId?: string,
    contactInfo?: DisinheritedPerson['externalDetails']['contactInfo'],
  ): DisinheritedPerson {
    return new DisinheritedPerson('EXTERNAL', undefined, {
      name,
      nationalId,
      relationshipToTestator,
      contactInfo,
    });
  }
}

/**
 * Disinheritance Reason Value Object
 */
export class DisinheritanceReason {
  constructor(
    readonly category: 'MORAL' | 'FINANCIAL' | 'RELATIONSHIP' | 'LEGAL' | 'PERSONAL' | 'OTHER',
    readonly description: string,
    readonly details?: string, // More detailed explanation
    readonly evidenceReferences?: string[], // Document IDs or evidence references
    readonly dateOfIncident?: Date, // When relevant incident occurred
  ) {
    if (!description || description.trim().length < 20) {
      throw new Error('Disinheritance reason must have meaningful description (min 20 chars)');
    }

    // Specific validation for certain categories
    if (category === 'LEGAL' && !details) {
      throw new Error('Legal disinheritance reasons require detailed explanation');
    }
  }

  equals(other: DisinheritanceReason): boolean {
    return (
      this.category === other.category &&
      this.description === other.description &&
      this.details === other.details
    );
  }

  isMoral(): boolean {
    return this.category === 'MORAL';
  }

  isFinancial(): boolean {
    return this.category === 'FINANCIAL';
  }

  isRelationship(): boolean {
    return this.category === 'RELATIONSHIP';
  }

  isLegal(): boolean {
    return this.category === 'LEGAL';
  }

  isPersonal(): boolean {
    return this.category === 'PERSONAL';
  }

  getS30Factor(): string | undefined {
    // Map to S.30 LSA factors court considers
    const factorMap: Record<string, string> = {
      MORAL: 'Conduct of the dependant (S.30(f))',
      FINANCIAL: 'Financial resources and needs (S.30(a))',
      RELATIONSHIP: 'Obligations and responsibilities (S.30(b))',
      LEGAL: 'Legal obligations (S.30(c))',
      PERSONAL: 'Personal circumstances (S.30(g))',
      OTHER: 'Any other matter (S.30(i))',
    };
    return factorMap[this.category];
  }

  toString(): string {
    let result = `${this.category}: ${this.description}`;
    if (this.details) {
      result += `\nDetails: ${this.details}`;
    }
    if (this.dateOfIncident) {
      result += `\nIncident Date: ${this.dateOfIncident.toLocaleDateString()}`;
    }
    return result;
  }

  static createMoralReason(description: string, details?: string): DisinheritanceReason {
    return new DisinheritanceReason('MORAL', description, details);
  }

  static createFinancialReason(description: string, details?: string): DisinheritanceReason {
    return new DisinheritanceReason('FINANCIAL', description, details);
  }

  static createRelationshipReason(description: string, details?: string): DisinheritanceReason {
    return new DisinheritanceReason('RELATIONSHIP', description, details);
  }

  static createLegalReason(description: string, legalBasis: string): DisinheritanceReason {
    return new DisinheritanceReason('LEGAL', description, `Legal Basis: ${legalBasis}`);
  }
}

// =========================================================================
// ENUMS
// =========================================================================

/**
 * Disinheritance Status
 */
export enum DisinheritanceStatus {
  RECORDED = 'RECORDED', // Recorded in will but not yet effective
  EFFECTIVE = 'EFFECTIVE', // Will executed, disinheritance in effect
  CHALLENGED = 'CHALLENGED', // Challenged in court
  UPHELD = 'UPHELD', // Court upheld disinheritance
  OVERTURNED = 'OVERTURNED', // Court overturned disinheritance
  PARTIALLY_OVERTURNED = 'PARTIALLY_OVERTURNED', // Court granted partial provision
  SETTLED = 'SETTLED', // Settled out of court
  WITHDRAWN = 'WITHDRAWN', // Disinheritance withdrawn by codicil
  INVALID = 'INVALID', // Found to be legally invalid
}

/**
 * Disinheritance Severity
 */
export enum DisinheritanceSeverity {
  COMPLETE = 'COMPLETE', // No inheritance at all
  PARTIAL = 'PARTIAL', // Reduced inheritance
  CONDITIONAL = 'CONDITIONAL', // Inheritance with conditions
  TEMPORARY = 'TEMPORARY', // Temporary exclusion
}

/**
 * Legal Risk Level for Disinheritance
 */
export enum LegalRiskLevel {
  LOW = 'LOW', // Low risk of successful challenge
  MEDIUM = 'MEDIUM', // Moderate risk
  HIGH = 'HIGH', // High risk (e.g., disinheriting minor child)
  VERY_HIGH = 'VERY_HIGH', // Very high risk (e.g., disinheriting spouse)
  EXTREME = 'EXTREME', // Extreme risk (likely to be overturned)
}

// =========================================================================
// DISINHERITANCE RECORD ENTITY
// =========================================================================

interface DisinheritanceRecordProps {
  willId: string; // Reference to parent Will aggregate
  testatorId: string; // Reference to testator

  // Who is being disinherited
  disinheritedPerson: DisinheritedPerson;

  // Reason for disinheritance
  reason: DisinheritanceReason;

  // Legal Details
  status: DisinheritanceStatus;
  severity: DisinheritanceSeverity;
  legalRiskLevel: LegalRiskLevel;

  // S.26/S.29 Compliance
  isDependant: boolean; // Whether person qualifies as dependant under S.29
  isSubjectToS26: boolean; // Whether S.26 claims likely

  // Alternative Provisions (if any)
  tokenProvision?: {
    // Small token to show not forgotten
    description: string;
    value?: number;
    assetId?: string;
  };

  // Conditions for Reinstatement
  reinstatementConditions?: string[]; // Conditions for future inheritance
  reinstatementDeadline?: Date; // Deadline for meeting conditions

  // Legal Proceedings
  courtCaseNumber?: string;
  courtOutcome?: string;
  courtOrderDate?: Date;
  settlementAmount?: number; // If settled out of court

  // Timeline
  recordedAt: Date; // When recorded in will
  effectiveDate?: Date; // When disinheritance takes effect
  challengedAt?: Date; // When challenged in court
  resolvedAt?: Date; // When resolved

  // Evidence and Documentation
  supportingDocuments: string[]; // Document IDs supporting disinheritance
  witnessStatements: string[]; // Witness statement IDs
  legalOpinionId?: string; // Lawyer's opinion on validity

  // Metadata
  clauseReference: string; // Will clause reference
  notes?: string;
}

export class DisinheritanceRecord extends Entity<DisinheritanceRecordProps> {
  // =========================================================================
  // CONSTRUCTOR & FACTORY
  // =========================================================================

  private constructor(props: DisinheritanceRecordProps, id?: UniqueEntityID) {
    // Domain Rule: Cannot disinherit without clear reason
    if (!props.reason) {
      throw new Error('Disinheritance must have a stated reason');
    }

    // Domain Rule: Must reference specific will clause
    if (!props.clauseReference) {
      throw new Error('Disinheritance must reference specific will clause');
    }

    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory: Create disinheritance record
   */
  public static create(
    willId: string,
    testatorId: string,
    disinheritedPerson: DisinheritedPerson,
    reason: DisinheritanceReason,
    clauseReference: string,
    severity: DisinheritanceSeverity = DisinheritanceSeverity.COMPLETE,
  ): DisinheritanceRecord {
    // Determine if person is a dependant (S.29 LSA)
    const isDependant = disinheritedPerson.isDependant();

    // Determine legal risk level
    const legalRiskLevel = DisinheritanceRecord.calculateLegalRisk(
      disinheritedPerson,
      reason,
      severity,
    );

    const props: DisinheritanceRecordProps = {
      willId,
      testatorId,
      disinheritedPerson,
      reason,
      clauseReference,
      severity,
      status: DisinheritanceStatus.RECORDED,
      legalRiskLevel,
      isDependant,
      isSubjectToS26: isDependant, // Dependants may make S.26 claims
      recordedAt: new Date(),
      supportingDocuments: [],
      witnessStatements: [],
    };

    return new DisinheritanceRecord(props);
  }

  /**
   * Factory: Create disinheritance with token provision
   * (Shows person not forgotten, may strengthen legal position)
   */
  public static createWithTokenProvision(
    willId: string,
    testatorId: string,
    disinheritedPerson: DisinheritedPerson,
    reason: DisinheritanceReason,
    clauseReference: string,
    tokenProvision: DisinheritanceRecordProps['tokenProvision'],
  ): DisinheritanceRecord {
    const record = DisinheritanceRecord.create(
      willId,
      testatorId,
      disinheritedPerson,
      reason,
      clauseReference,
      DisinheritanceSeverity.PARTIAL,
    );

    (record as any).updateState({
      tokenProvision,
      severity: DisinheritanceSeverity.PARTIAL,
    });

    return record;
  }

  /**
   * Factory: Create conditional disinheritance
   */
  public static createConditional(
    willId: string,
    testatorId: string,
    disinheritedPerson: DisinheritedPerson,
    reason: DisinheritanceReason,
    clauseReference: string,
    conditions: string[],
    deadline?: Date,
  ): DisinheritanceRecord {
    const record = DisinheritanceRecord.create(
      willId,
      testatorId,
      disinheritedPerson,
      reason,
      clauseReference,
      DisinheritanceSeverity.CONDITIONAL,
    );

    (record as any).updateState({
      reinstatementConditions: conditions,
      reinstatementDeadline: deadline,
      severity: DisinheritanceSeverity.CONDITIONAL,
    });

    return record;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: DisinheritanceRecordProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): DisinheritanceRecord {
    const record = new DisinheritanceRecord(props, new UniqueEntityID(id));
    (record as any)._createdAt = createdAt;
    (record as any)._updatedAt = updatedAt;
    (record as any)._version = version;
    return record;
  }

  private static calculateLegalRisk(
    person: DisinheritedPerson,
    reason: DisinheritanceReason,
    severity: DisinheritanceSeverity,
  ): LegalRiskLevel {
    let riskScore = 0;

    // Person type scoring
    if (person.isSpouse()) riskScore += 40;
    if (person.isChild()) riskScore += 30;
    if (person.isParent()) riskScore += 20;
    if (person.isSibling()) riskScore += 10;
    if (person.isExternal()) riskScore += 5;

    // Reason scoring
    if (reason.isLegal()) riskScore += 5; // Strong legal reasons are good
    if (reason.isMoral()) riskScore += 15; // Moral reasons are weaker
    if (reason.isFinancial()) riskScore += 20; // Financial reasons often challenged
    if (reason.isPersonal()) riskScore += 25; // Personal reasons highly challenged

    // Severity scoring
    if (severity === DisinheritanceSeverity.COMPLETE) riskScore += 25;
    if (severity === DisinheritanceSeverity.PARTIAL) riskScore += 15;
    if (severity === DisinheritanceSeverity.CONDITIONAL) riskScore += 10;
    if (severity === DisinheritanceSeverity.TEMPORARY) riskScore += 5;

    // Determine risk level
    if (riskScore >= 70) return LegalRiskLevel.EXTREME;
    if (riskScore >= 55) return LegalRiskLevel.VERY_HIGH;
    if (riskScore >= 40) return LegalRiskLevel.HIGH;
    if (riskScore >= 25) return LegalRiskLevel.MEDIUM;
    return LegalRiskLevel.LOW;
  }

  // =========================================================================
  // BUSINESS LOGIC (MUTATIONS)
  // =========================================================================

  /**
   * Make disinheritance effective (upon testator's death)
   */
  public makeEffective(effectiveDate: Date = new Date()): void {
    if (this.status !== DisinheritanceStatus.RECORDED) {
      throw new Error('Can only make RECORDED disinheritance effective');
    }

    this.updateState({
      status: DisinheritanceStatus.EFFECTIVE,
      effectiveDate,
    });
  }

  /**
   * Challenge disinheritance in court
   */
  public challenge(courtCaseNumber?: string, challengedAt: Date = new Date()): void {
    if (this.status !== DisinheritanceStatus.EFFECTIVE) {
      throw new Error('Can only challenge EFFECTIVE disinheritance');
    }

    this.updateState({
      status: DisinheritanceStatus.CHALLENGED,
      courtCaseNumber,
      challengedAt,
    });
  }

  /**
   * Court upholds disinheritance
   */
  public uphold(courtOutcome: string, courtOrderDate: Date = new Date()): void {
    if (this.status !== DisinheritanceStatus.CHALLENGED) {
      throw new Error('Can only uphold CHALLENGED disinheritance');
    }

    this.updateState({
      status: DisinheritanceStatus.UPHELD,
      courtOutcome,
      courtOrderDate,
      resolvedAt: new Date(),
    });
  }

  /**
   * Court overturns disinheritance
   */
  public overturn(
    courtOutcome: string,
    provisionDetails?: string,
    courtOrderDate: Date = new Date(),
  ): void {
    if (this.status !== DisinheritanceStatus.CHALLENGED) {
      throw new Error('Can only overturn CHALLENGED disinheritance');
    }

    this.updateState({
      status: DisinheritanceStatus.OVERTURNED,
      courtOutcome: `${courtOutcome}${provisionDetails ? ` - ${provisionDetails}` : ''}`,
      courtOrderDate,
      resolvedAt: new Date(),
    });
  }

  /**
   * Court grants partial provision
   */
  public partiallyOverturn(
    courtOutcome: string,
    provisionAmount?: number,
    courtOrderDate: Date = new Date(),
  ): void {
    if (this.status !== DisinheritanceStatus.CHALLENGED) {
      throw new Error('Can only partially overturn CHALLENGED disinheritance');
    }

    this.updateState({
      status: DisinheritanceStatus.PARTIALLY_OVERTURNED,
      courtOutcome,
      settlementAmount: provisionAmount,
      courtOrderDate,
      resolvedAt: new Date(),
    });
  }

  /**
   * Settle disinheritance challenge out of court
   */
  public settle(
    settlementAmount: number,
    settlementTerms: string,
    settledAt: Date = new Date(),
  ): void {
    if (this.status !== DisinheritanceStatus.CHALLENGED) {
      throw new Error('Can only settle CHALLENGED disinheritance');
    }

    this.updateState({
      status: DisinheritanceStatus.SETTLED,
      settlementAmount,
      courtOutcome: `Settled: ${settlementTerms}`,
      resolvedAt: settledAt,
    });
  }

  /**
   * Withdraw disinheritance (by codicil)
   */
  public withdraw(withdrawalDate: Date = new Date()): void {
    if (this.status === DisinheritanceStatus.WITHDRAWN) {
      throw new Error('Disinheritance already withdrawn');
    }

    this.updateState({
      status: DisinheritanceStatus.WITHDRAWN,
      resolvedAt: withdrawalDate,
    });
  }

  /**
   * Mark as legally invalid
   */
  public invalidate(invalidationReason: string, invalidatedAt: Date = new Date()): void {
    this.updateState({
      status: DisinheritanceStatus.INVALID,
      courtOutcome: `Invalid: ${invalidationReason}`,
      resolvedAt: invalidatedAt,
    });
  }

  /**
   * Add supporting document
   */
  public addSupportingDocument(documentId: string): void {
    if (
      this.status !== DisinheritanceStatus.RECORDED &&
      this.status !== DisinheritanceStatus.EFFECTIVE
    ) {
      throw new Error('Can only add documents to RECORDED or EFFECTIVE disinheritance');
    }

    const updatedDocuments = [...this.supportingDocuments, documentId];
    this.updateState({
      supportingDocuments: updatedDocuments,
    });
  }

  /**
   * Add witness statement
   */
  public addWitnessStatement(statementId: string): void {
    if (
      this.status !== DisinheritanceStatus.RECORDED &&
      this.status !== DisinheritanceStatus.EFFECTIVE
    ) {
      throw new Error('Can only add witness statements to RECORDED or EFFECTIVE disinheritance');
    }

    const updatedStatements = [...this.witnessStatements, statementId];
    this.updateState({
      witnessStatements: updatedStatements,
    });
  }

  /**
   * Update legal risk assessment
   */
  public updateLegalRiskAssessment(): void {
    const newRiskLevel = DisinheritanceRecord.calculateLegalRisk(
      this.disinheritedPerson,
      this.reason,
      this.severity,
    );

    this.updateState({
      legalRiskLevel: newRiskLevel,
    });
  }

  /**
   * Add token provision (small inheritance to show not forgotten)
   */
  public addTokenProvision(provision: DisinheritanceRecordProps['tokenProvision']): void {
    if (this.status !== DisinheritanceStatus.RECORDED) {
      throw new Error('Can only add token provision to RECORDED disinheritance');
    }

    this.updateState({
      tokenProvision: provision,
      severity: DisinheritanceSeverity.PARTIAL,
    });
  }

  /**
   * Update S.26 assessment
   */
  public updateS26Assessment(isSubjectToS26: boolean): void {
    this.updateState({
      isSubjectToS26,
    });
  }

  // =========================================================================
  // QUERY METHODS (PURE)
  // =========================================================================

  /**
   * Check if disinheritance is currently in effect
   */
  public isInEffect(): boolean {
    const effectiveStatuses = [DisinheritanceStatus.EFFECTIVE, DisinheritanceStatus.UPHELD];
    return effectiveStatuses.includes(this.status);
  }

  /**
   * Check if disinheritance has been overturned
   */
  public isOverturned(): boolean {
    const overturnedStatuses = [
      DisinheritanceStatus.OVERTURNED,
      DisinheritanceStatus.PARTIALLY_OVERTURNED,
      DisinheritanceStatus.WITHDRAWN,
      DisinheritanceStatus.INVALID,
    ];
    return overturnedStatuses.includes(this.status);
  }

  /**
   * Check if disinheritance is being challenged
   */
  public isBeingChallenged(): boolean {
    return this.status === DisinheritanceStatus.CHALLENGED;
  }

  /**
   * Check if disinheritance is complete (no inheritance)
   */
  public isCompleteDisinheritance(): boolean {
    return this.severity === DisinheritanceSeverity.COMPLETE;
  }

  /**
   * Check if disinheritance is partial (some inheritance)
   */
  public isPartialDisinheritance(): boolean {
    return this.severity === DisinheritanceSeverity.PARTIAL;
  }

  /**
   * Check if disinheritance is conditional
   */
  public isConditional(): boolean {
    return this.severity === DisinheritanceSeverity.CONDITIONAL;
  }

  /**
   * Check if disinheritance is temporary
   */
  public isTemporary(): boolean {
    return this.severity === DisinheritanceSeverity.TEMPORARY;
  }

  /**
   * Check if person has token provision
   */
  public hasTokenProvision(): boolean {
    return !!this.tokenProvision;
  }

  /**
   * Check if disinheritance is high risk
   */
  public isHighRisk(): boolean {
    return [LegalRiskLevel.HIGH, LegalRiskLevel.VERY_HIGH, LegalRiskLevel.EXTREME].includes(
      this.legalRiskLevel,
    );
  }

  /**
   * Check if conditions for reinstatement have deadline passed
   */
  public isReinstatementDeadlinePassed(): boolean {
    if (!this.reinstatementDeadline) return false;
    return new Date() > this.reinstatementDeadline;
  }

  /**
   * Check if disinheritance is legally sound (low risk and proper documentation)
   */
  public isLegallySound(): boolean {
    return (
      !this.isHighRisk() &&
      this.supportingDocuments.length > 0 &&
      this.reason.category !== 'PERSONAL' && // Personal reasons are weak
      (this.hasTokenProvision() || !this.disinheritedPerson.isDependant())
    );
  }

  /**
   * Get S.30 LSA factor that applies to this disinheritance
   */
  public getApplicableS30Factor(): string {
    return this.reason.getS30Factor() || 'Any other matter (S.30(i))';
  }

  /**
   * Get days since disinheritance was recorded
   */
  public daysSinceRecorded(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.recordedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // =========================================================================
  // PROPERTY GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get testatorId(): string {
    return this.props.testatorId;
  }

  get disinheritedPerson(): DisinheritedPerson {
    return this.props.disinheritedPerson;
  }

  get reason(): DisinheritanceReason {
    return this.props.reason;
  }

  get status(): DisinheritanceStatus {
    return this.props.status;
  }

  get severity(): DisinheritanceSeverity {
    return this.props.severity;
  }

  get legalRiskLevel(): LegalRiskLevel {
    return this.props.legalRiskLevel;
  }

  get isDependant(): boolean {
    return this.props.isDependant;
  }

  get isSubjectToS26(): boolean {
    return this.props.isSubjectToS26;
  }

  get tokenProvision(): DisinheritanceRecordProps['tokenProvision'] {
    return this.props.tokenProvision;
  }

  get reinstatementConditions(): string[] | undefined {
    return this.props.reinstatementConditions;
  }

  get reinstatementDeadline(): Date | undefined {
    return this.props.reinstatementDeadline;
  }

  get courtCaseNumber(): string | undefined {
    return this.props.courtCaseNumber;
  }

  get courtOutcome(): string | undefined {
    return this.props.courtOutcome;
  }

  get courtOrderDate(): Date | undefined {
    return this.props.courtOrderDate;
  }

  get settlementAmount(): number | undefined {
    return this.props.settlementAmount;
  }

  get recordedAt(): Date {
    return this.props.recordedAt;
  }

  get effectiveDate(): Date | undefined {
    return this.props.effectiveDate;
  }

  get challengedAt(): Date | undefined {
    return this.props.challengedAt;
  }

  get resolvedAt(): Date | undefined {
    return this.props.resolvedAt;
  }

  get supportingDocuments(): string[] {
    return [...this.props.supportingDocuments];
  }

  get witnessStatements(): string[] {
    return [...this.props.witnessStatements];
  }

  get legalOpinionId(): string | undefined {
    return this.props.legalOpinionId;
  }

  get clauseReference(): string {
    return this.props.clauseReference;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  // Status checkers
  public isRecorded(): boolean {
    return this.status === DisinheritanceStatus.RECORDED;
  }

  public isEffective(): boolean {
    return this.status === DisinheritanceStatus.EFFECTIVE;
  }

  public isUpheld(): boolean {
    return this.status === DisinheritanceStatus.UPHELD;
  }

  public isOverturnedComplete(): boolean {
    return this.status === DisinheritanceStatus.OVERTURNED;
  }

  public isPartiallyOverturned(): boolean {
    return this.status === DisinheritanceStatus.PARTIALLY_OVERTURNED;
  }

  public isSettled(): boolean {
    return this.status === DisinheritanceStatus.SETTLED;
  }

  public isWithdrawn(): boolean {
    return this.status === DisinheritanceStatus.WITHDRAWN;
  }

  public isInvalid(): boolean {
    return this.status === DisinheritanceStatus.INVALID;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  /**
   * Validate disinheritance against Kenyan legal requirements
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!this.clauseReference) {
      errors.push('Disinheritance must reference specific will clause');
    }

    if (!this.reason.description || this.reason.description.length < 20) {
      errors.push('Disinheritance reason must be detailed (min 20 characters)');
    }

    // S.26 LSA warnings for dependants
    if (this.isDependant && this.isCompleteDisinheritance()) {
      warnings.push(
        'Complete disinheritance of dependant is likely to be challenged under S.26 LSA',
      );
    }

    if (this.isDependant && this.reason.isPersonal()) {
      warnings.push('Personal reasons for disinheriting dependants are weak in court (S.30(f))');
    }

    // Evidence requirements
    if (this.isDependant && this.supportingDocuments.length === 0) {
      warnings.push('Disinheriting a dependant should be supported by documentary evidence');
    }

    // Legal risk warnings
    if (this.isHighRisk()) {
      warnings.push(`High legal risk (${this.legalRiskLevel}) - consider legal counsel`);
    }

    // Token provision recommendation
    if (this.isDependant && !this.hasTokenProvision() && this.isCompleteDisinheritance()) {
      warnings.push('Consider adding token provision to show dependant was not forgotten');
    }

    // Clarity of reason
    if (this.reason.description.length < 50) {
      warnings.push('Disinheritance reasons should be detailed and specific for legal defense');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    const validation = this.validate();

    return {
      id: this.id.toString(),
      willId: this.willId,
      testatorId: this.testatorId,

      // Disinherited person
      disinheritedPerson: {
        type: this.disinheritedPerson.type,
        id: this.disinheritedPerson.id,
        name: this.disinheritedPerson.getName(),
        relationship: this.disinheritedPerson.getRelationship(),
        isFamilyMember: this.disinheritedPerson.isFamilyMember(),
        isSpouse: this.disinheritedPerson.isSpouse(),
        isChild: this.disinheritedPerson.isChild(),
        isParent: this.disinheritedPerson.isParent(),
        isRelative: this.disinheritedPerson.isRelative(),
        isExternal: this.disinheritedPerson.isExternal(),
        isDependant: this.disinheritedPerson.isDependant(),
        externalDetails: this.disinheritedPerson.externalDetails,
      },

      // Reason
      reason: {
        category: this.reason.category,
        description: this.reason.description,
        details: this.reason.details,
        evidenceReferences: this.reason.evidenceReferences,
        dateOfIncident: this.reason.dateOfIncident?.toISOString(),
        s30Factor: this.reason.getS30Factor(),
        toString: this.reason.toString(),
      },

      // Legal status
      status: this.status,
      severity: this.severity,
      legalRiskLevel: this.legalRiskLevel,
      isHighRisk: this.isHighRisk(),
      isInEffect: this.isInEffect(),
      isOverturned: this.isOverturned(),
      isBeingChallenged: this.isBeingChallenged(),
      isCompleteDisinheritance: this.isCompleteDisinheritance(),
      isPartialDisinheritance: this.isPartialDisinheritance(),
      isConditional: this.isConditional(),
      isTemporary: this.isTemporary(),

      // S.26/S.29 compliance
      isDependant: this.isDependant,
      isSubjectToS26: this.isSubjectToS26,
      applicableS30Factor: this.getApplicableS30Factor(),

      // Alternative provisions
      tokenProvision: this.tokenProvision,
      hasTokenProvision: this.hasTokenProvision(),
      reinstatementConditions: this.reinstatementConditions,
      reinstatementDeadline: this.reinstatementDeadline?.toISOString(),
      isReinstatementDeadlinePassed: this.isReinstatementDeadlinePassed(),

      // Legal proceedings
      courtCaseNumber: this.courtCaseNumber,
      courtOutcome: this.courtOutcome,
      courtOrderDate: this.courtOrderDate?.toISOString(),
      settlementAmount: this.settlementAmount,

      // Timeline
      recordedAt: this.recordedAt.toISOString(),
      effectiveDate: this.effectiveDate?.toISOString(),
      challengedAt: this.challengedAt?.toISOString(),
      resolvedAt: this.resolvedAt?.toISOString(),
      daysSinceRecorded: this.daysSinceRecorded(),

      // Evidence
      supportingDocuments: this.supportingDocuments,
      witnessStatements: this.witnessStatements,
      legalOpinionId: this.legalOpinionId,
      hasSupportingDocuments: this.supportingDocuments.length > 0,
      hasWitnessStatements: this.witnessStatements.length > 0,

      // Metadata
      clauseReference: this.clauseReference,
      notes: this.notes,
      isLegallySound: this.isLegallySound(),

      // Validation
      validation,

      // Status flags
      isRecorded: this.isRecorded(),
      isEffective: this.isEffective(),
      isUpheld: this.isUpheld(),
      isOverturnedComplete: this.isOverturnedComplete(),
      isPartiallyOverturned: this.isPartiallyOverturned(),
      isSettled: this.isSettled(),
      isWithdrawn: this.isWithdrawn(),
      isInvalid: this.isInvalid(),

      // System
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
