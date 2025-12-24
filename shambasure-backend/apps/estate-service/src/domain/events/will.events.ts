// domain/events/will.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Will Domain Events
 *
 * Purpose:
 * - Audit trail for legal compliance (Section 83 LSA - executor accountability)
 * - Event sourcing (rebuild will state at any point in time)
 * - Integration events (notify other bounded contexts)
 * - Temporal queries ("What was the will status on date X?")
 *
 * Kenyan Legal Context:
 * - Every state change must be recorded (court may request history)
 * - Events form chain of evidence for disputes
 * - Immutable once persisted (legal requirement)
 *
 * Event Naming Convention:
 * - Past tense (WillCreated, not CreateWill)
 * - Specific (TestamentaryCapacityAssessed, not CapacityChanged)
 * - Domain language (not technical jargon)
 */

// ============================================================================
// WILL LIFECYCLE EVENTS
// ============================================================================

/**
 * WillCreatedEvent
 *
 * Emitted when: Testator creates a new will (DRAFT status)
 *
 * Business Impact:
 * - Starts will lifecycle
 * - May trigger notification to family service
 * - Creates audit trail entry
 */
export interface WillCreatedPayload {
  testatorId: string;
  testatorFullName: string;
  willType: string; // STANDARD, JOINT, MUTUAL, etc.
  title: string;
  createdBy?: string; // If created by lawyer on behalf
  createdVia?: string; // 'WEB', 'MOBILE', 'API', 'LAWYER'
}

export class WillCreatedEvent extends DomainEvent<WillCreatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillCreatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get testatorId(): string {
    return this.payload.testatorId;
  }

  get willType(): string {
    return this.payload.willType;
  }
}

/**
 * WillPreparedForWitnessingEvent
 *
 * Emitted when: Will transitions from DRAFT → PENDING_WITNESS
 *
 * Business Impact:
 * - Locks will content for witnessing
 * - May trigger witness notification emails/SMS
 * - Indicates testator is ready to finalize
 */
export interface WillPreparedForWitnessingPayload {
  testatorId: string;
  preparedAt?: Date;
  witnessesRequired: number;
}

export class WillPreparedForWitnessingEvent extends DomainEvent<WillPreparedForWitnessingPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillPreparedForWitnessingPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * WillWitnessedEvent
 *
 * Emitted when: Will transitions from PENDING_WITNESS → WITNESSED
 *
 * Business Impact:
 * - Will is now legally valid (Section 11 LSA compliant)
 * - Can be activated as testator's current will
 * - Creates immutable record of witnessing
 *
 * Legal Significance: HIGH
 * - Proves Section 11 LSA compliance
 * - Documents witness simultaneity
 */
export interface WillWitnessedPayload {
  testatorId: string;
  witnessCount: number;
  witnessedAt: Date;
  witness1Id?: string;
  witness1Name?: string;
  witness2Id?: string;
  witness2Name?: string;
  witnessLocation?: string; // Where witnessing occurred
  simultaneityConfirmed: boolean;
}

export class WillWitnessedEvent extends DomainEvent<WillWitnessedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillWitnessedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get witnessedAt(): Date {
    return this.payload.witnessedAt;
  }
}

/**
 * WillActivatedEvent
 *
 * Emitted when: Will becomes the active/current will for testator
 *
 * Business Impact:
 * - This is now the legally operative will
 * - Previous active will (if any) must be superseded
 * - CRITICAL: Only ONE active will per testator allowed
 *
 * Integration:
 * - May trigger family-service notification
 * - May update estate-service planning
 *
 * Legal Significance: CRITICAL
 * - Establishes testamentary intent
 * - Supersedes all prior wills
 */
export interface WillActivatedPayload {
  testatorId: string;
  activatedAt: Date;
  supersedesWillId?: string; // Previous will that's being replaced
  activatedBy?: string; // Usually testator, or executor if post-death
}

export class WillActivatedEvent extends DomainEvent<WillActivatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillActivatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get activatedAt(): Date {
    return this.payload.activatedAt;
  }

  get supersedesWillId(): string | undefined {
    return this.payload.supersedesWillId;
  }
}

/**
 * WillExecutedEvent
 *
 * Emitted when: Testator has died and will is being executed
 *
 * Business Impact:
 * - Triggers estate distribution process
 * - All beneficiary assignments become active
 * - Executor powers take effect
 * - Estate-service creates Estate aggregate
 *
 * Integration:
 * - Notifies succession-service to start probate
 * - Notifies family-service of death
 * - Creates estate inventory in estate-service
 *
 * Legal Significance: CRITICAL
 * - Starts Section 83 LSA executor duties
 * - Triggers Section 45 LSA debt payment priority
 * - Activates Section 26 LSA dependant rights
 */
export interface WillExecutedPayload {
  testatorId: string;
  dateOfDeath: Date;
  executedAt: Date;
  beneficiaryCount: number;
  executorId?: string; // Primary executor
  estateValueKES?: number; // If known
  hasDebts?: boolean;
  hasDependants?: boolean;
}

export class WillExecutedEvent extends DomainEvent<WillExecutedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillExecutedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get dateOfDeath(): Date {
    return this.payload.dateOfDeath;
  }

  get executedAt(): Date {
    return this.payload.executedAt;
  }
}

/**
 * WillEnteredProbateEvent
 *
 * Emitted when: Will enters court probate process
 *
 * Business Impact:
 * - Court oversight begins
 * - Grant of Probate being sought
 * - Succession-service takes over court process
 *
 * Legal Significance: HIGH
 * - Formal court recognition process
 * - May face Section 26 challenges
 */
export interface WillEnteredProbatePayload {
  testatorId: string;
  caseNumber: string; // Court case number
  courtStation: string; // E.g., "Nairobi High Court"
  filingDate?: Date;
  executorId?: string; // Who is seeking grant
}

export class WillEnteredProbateEvent extends DomainEvent<WillEnteredProbatePayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillEnteredProbatePayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get caseNumber(): string {
    return this.payload.caseNumber;
  }
}

/**
 * WillRevokedEvent
 *
 * Emitted when: Will is revoked (Section 17 LSA)
 *
 * Business Impact:
 * - Will is no longer valid
 * - Testator may create new will
 * - All provisions voided
 *
 * Legal Significance: CRITICAL
 * - Complete invalidation
 * - May revert to intestacy if no other will
 */
export interface WillRevokedPayload {
  testatorId: string;
  revocationMethod: string; // NEW_WILL, DESTRUCTION, MARRIAGE, etc.
  revokedAt?: Date;
  reason?: string;
  revokedBy?: string; // Usually testator
  newWillId?: string; // If revoked by new will
}

export class WillRevokedEvent extends DomainEvent<WillRevokedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillRevokedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get revocationMethod(): string {
    return this.payload.revocationMethod;
  }
}

/**
 * WillSupersededEvent
 *
 * Emitted when: Will is replaced by a newer will
 *
 * Business Impact:
 * - Old will is inactive
 * - New will takes precedence
 * - Automatic supersession (Section 17 LSA)
 */
export interface WillSupersededPayload {
  testatorId: string;
  supersededByWillId: string; // ID of newer will
  supersededAt?: Date;
}

export class WillSupersededEvent extends DomainEvent<WillSupersededPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillSupersededPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get supersededByWillId(): string {
    return this.payload.supersededByWillId;
  }
}

/**
 * WillContestedEvent
 *
 * Emitted when: Will is challenged in court (Section 26 LSA)
 *
 * Business Impact:
 * - Distribution halted pending court decision
 * - Legal dispute process starts
 * - May trigger mediation
 *
 * Legal Significance: HIGH
 * - Common with Section 26 dependant claims
 * - May invalidate or modify will
 */
export interface WillContestedPayload {
  testatorId: string;
  challenger: string;
  challengerId?: string;
  grounds: string; // Legal basis (e.g., "Section 26 dependant")
  contestedAt?: Date;
  claimType?: string; // DEPENDANT, CAPACITY, UNDUE_INFLUENCE
}

export class WillContestedEvent extends DomainEvent<WillContestedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillContestedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get challenger(): string {
    return this.payload.challenger;
  }

  get grounds(): string {
    return this.payload.grounds;
  }
}

// ============================================================================
// TESTAMENTARY CAPACITY EVENTS
// ============================================================================

/**
 * TestamentaryCapacityAssessedEvent
 *
 * Emitted when: Testator's mental capacity is assessed (Section 9 LSA)
 *
 * Business Impact:
 * - Determines if testator can make valid will
 * - Critical for will validity
 * - May require medical evidence
 *
 * Legal Significance: CRITICAL
 * - Section 9 LSA requirement
 * - Common ground for will contests
 */
export interface TestamentaryCapacityAssessedPayload {
  testatorId: string;
  hasCapacity: boolean;
  assessedBy: string; // Doctor, lawyer, court
  assessmentDate?: Date;
  reason?: string;
  medicalReportId?: string; // Link to medical document
}

export class TestamentaryCapacityAssessedEvent extends DomainEvent<TestamentaryCapacityAssessedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TestamentaryCapacityAssessedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get hasCapacity(): boolean {
    return this.payload.hasCapacity;
  }
}

/**
 * TestamentaryCapacityChallengedEvent
 *
 * Emitted when: Someone challenges testator's capacity
 *
 * Business Impact:
 * - May invalidate will if upheld
 * - Requires court determination
 * - Halts probate process
 */
export interface TestamentaryCapacityChallengedPayload {
  testatorId: string;
  challenger: string;
  challengerId?: string;
  grounds: string;
  challengedAt?: Date;
  evidenceDocumentIds?: string[];
}

export class TestamentaryCapacityChallengedEvent extends DomainEvent<TestamentaryCapacityChallengedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TestamentaryCapacityChallengedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// WITNESS EVENTS (Section 11 LSA)
// ============================================================================

/**
 * WitnessAddedEvent
 *
 * Emitted when: Witness is added to will
 *
 * Business Impact:
 * - Progress toward Section 11 LSA compliance
 * - May trigger witness notification
 */
export interface WitnessAddedPayload {
  witnessId: string;
  witnessName: string;
  witnessType: string; // REGISTERED_USER, EXTERNAL, PROFESSIONAL
  witnessUserId?: string;
  witnessNationalId?: string;
  isEligible: boolean;
  addedAt?: Date;
}

export class WitnessAddedEvent extends DomainEvent<WitnessAddedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WitnessAddedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get witnessId(): string {
    return this.payload.witnessId;
  }
}

/**
 * WitnessRemovedEvent
 *
 * Emitted when: Witness is removed from will (DRAFT only)
 */
export interface WitnessRemovedPayload {
  witnessId: string;
  witnessName: string;
  reason?: string;
  removedAt?: Date;
}

export class WitnessRemovedEvent extends DomainEvent<WitnessRemovedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WitnessRemovedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * WitnessSignedEvent
 *
 * Emitted when: Witness signs the will
 *
 * Business Impact:
 * - Progress toward full witnessing
 * - Section 11 LSA compliance step
 *
 * Legal Significance: HIGH
 * - Creates legal attestation
 * - Part of will validity proof
 */
export interface WitnessSignedPayload {
  witnessId: string;
  witnessName: string;
  signatureType: string; // DIGITAL, WET, BIOMETRIC
  signedAt: Date;
  ipAddress?: string;
  deviceId?: string;
  location?: string;
}

export class WitnessSignedEvent extends DomainEvent<WitnessSignedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WitnessSignedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get signedAt(): Date {
    return this.payload.signedAt;
  }
}

// ============================================================================
// EXECUTOR EVENTS
// ============================================================================

/**
 * ExecutorNominatedEvent
 *
 * Emitted when: Executor is nominated in will
 *
 * Business Impact:
 * - Designates person to manage estate
 * - May trigger executor notification
 * - Section 83 LSA powers defined
 */
export interface ExecutorNominatedPayload {
  executorId: string;
  executorName: string;
  executorUserId?: string;
  priority: string; // PRIMARY, ALTERNATE, CO_EXECUTOR
  isPrimary: boolean;
  orderNumber: number;
  powers?: Record<string, any>; // ExecutorPowers serialized
  nominatedAt?: Date;
}

export class ExecutorNominatedEvent extends DomainEvent<ExecutorNominatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ExecutorNominatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get executorId(): string {
    return this.payload.executorId;
  }

  get isPrimary(): boolean {
    return this.payload.isPrimary;
  }
}

/**
 * ExecutorRemovedEvent
 *
 * Emitted when: Executor nomination is removed
 */
export interface ExecutorRemovedPayload {
  executorId: string;
  executorName: string;
  reason?: string;
  removedAt?: Date;
}

export class ExecutorRemovedEvent extends DomainEvent<ExecutorRemovedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ExecutorRemovedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * ExecutorAcceptedEvent
 *
 * Emitted when: Nominee accepts executorship
 *
 * Business Impact:
 * - Confirms willingness to serve
 * - Executor can now apply for probate
 */
export interface ExecutorAcceptedPayload {
  executorId: string;
  executorName: string;
  acceptedAt: Date;
  acceptanceMethod?: string; // EMAIL, SMS, IN_PERSON
}

export class ExecutorAcceptedEvent extends DomainEvent<ExecutorAcceptedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ExecutorAcceptedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * ExecutorDeclinedEvent
 *
 * Emitted when: Nominee declines executorship
 *
 * Business Impact:
 * - Alternate executor needed
 * - May delay probate
 */
export interface ExecutorDeclinedPayload {
  executorId: string;
  executorName: string;
  reason?: string;
  declinedAt: Date;
}

export class ExecutorDeclinedEvent extends DomainEvent<ExecutorDeclinedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ExecutorDeclinedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// BENEFICIARY EVENTS
// ============================================================================

/**
 * BeneficiaryAssignedEvent
 *
 * Emitted when: Beneficiary is assigned a bequest
 *
 * Business Impact:
 * - Creates inheritance entitlement
 * - Defines distribution plan
 * - May trigger family-service notification
 */
export interface BeneficiaryAssignedPayload {
  assignmentId: string;
  beneficiaryName: string;
  beneficiaryType: string; // USER, FAMILY_MEMBER, EXTERNAL, CHARITY
  beneficiaryUserId?: string;
  beneficiaryFamilyMemberId?: string;
  shareType: string; // SPECIFIC, PERCENTAGE, FIXED_AMOUNT, RESIDUARY
  percentage?: number;
  assetId?: string;
  amountKES?: number;
  condition?: Record<string, any>;
  assignedAt?: Date;
}

export class BeneficiaryAssignedEvent extends DomainEvent<BeneficiaryAssignedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: BeneficiaryAssignedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get assignmentId(): string {
    return this.payload.assignmentId;
  }

  get beneficiaryName(): string {
    return this.payload.beneficiaryName;
  }
}

/**
 * BeneficiaryRemovedEvent
 *
 * Emitted when: Beneficiary assignment is revoked
 */
export interface BeneficiaryRemovedPayload {
  assignmentId: string;
  beneficiaryName: string;
  reason?: string;
  removedAt?: Date;
}

export class BeneficiaryRemovedEvent extends DomainEvent<BeneficiaryRemovedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: BeneficiaryRemovedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * BeneficiaryShareUpdatedEvent
 *
 * Emitted when: Beneficiary's share is modified
 */
export interface BeneficiaryShareUpdatedPayload {
  assignmentId: string;
  beneficiaryName: string;
  oldShare: Record<string, any>;
  newShare: Record<string, any>;
  reason?: string;
  updatedAt?: Date;
}

export class BeneficiaryShareUpdatedEvent extends DomainEvent<BeneficiaryShareUpdatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: BeneficiaryShareUpdatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// CODICIL EVENTS
// ============================================================================

/**
 * CodicilAddedEvent
 *
 * Emitted when: Codicil (amendment) is added to will
 *
 * Business Impact:
 * - Modifies will provisions
 * - Requires witnessing (Section 11 LSA)
 * - Creates version history
 */
export interface CodicilAddedPayload {
  codicilId: string;
  codicilNumber: number; // 1st, 2nd, 3rd codicil
  type: string; // AMENDMENT, ADDITION, REVOCATION, CLARIFICATION
  affectedClauses: string[];
  content: string;
  addedAt?: Date;
}

export class CodicilAddedEvent extends DomainEvent<CodicilAddedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: CodicilAddedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get codicilId(): string {
    return this.payload.codicilId;
  }

  get codicilNumber(): number {
    return this.payload.codicilNumber;
  }
}

/**
 * CodicilActivatedEvent
 *
 * Emitted when: Codicil is witnessed and becomes effective
 */
export interface CodicilActivatedPayload {
  codicilId: string;
  codicilNumber: number;
  activatedAt: Date;
  witnessCount: number;
}

export class CodicilActivatedEvent extends DomainEvent<CodicilActivatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: CodicilActivatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// DISINHERITANCE EVENTS (Section 26 Defense)
// ============================================================================

/**
 * PersonDisinheritedEvent
 *
 * Emitted when: Person is explicitly excluded from will
 *
 * Business Impact:
 * - Prevents default inheritance
 * - May face Section 26 challenge
 * - Requires strong justification
 *
 * Legal Significance: HIGH
 * - Common source of Section 26 disputes
 * - Court may override if dependant
 */
export interface PersonDisinheritedPayload {
  disinheritanceId: string;
  disinheritedMemberId: string;
  disinheritedName: string;
  relationshipToTestator: string;
  type: string; // COMPLETE, PARTIAL, CONDITIONAL
  reason: string;
  reasonDetails?: string;
  isVulnerableToChallenge: boolean;
  vulnerabilityReason?: string;
  disinheritedAt?: Date;
}

export class PersonDisinheritedEvent extends DomainEvent<PersonDisinheritedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: PersonDisinheritedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  get disinheritedMemberId(): string {
    return this.payload.disinheritedMemberId;
  }

  get isVulnerableToChallenge(): boolean {
    return this.payload.isVulnerableToChallenge;
  }
}

/**
 * DisinheritanceChallengedEvent
 *
 * Emitted when: Disinheritance is challenged (Section 26)
 */
export interface DisinheritanceChallengedPayload {
  disinheritanceId: string;
  disinheritedName: string;
  challenger: string;
  grounds: string; // Section 26 basis
  challengedAt: Date;
}

export class DisinheritanceChallengedEvent extends DomainEvent<DisinheritanceChallengedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: DisinheritanceChallengedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// INTEGRATION EVENTS (Cross-Bounded Context)
// ============================================================================

/**
 * WillActivationRequiredEvent
 *
 * Integration Event: Signals to application layer that old will needs deactivation
 *
 * Purpose:
 * - When activating new will, old will must be superseded
 * - Application layer coordinates across aggregates
 * - Ensures only ONE active will per testator
 */
export interface WillActivationRequiredPayload {
  testatorId: string;
  newWillId: string;
  oldWillId?: string;
  activationRequestedAt: Date;
}

export class WillActivationRequiredEvent extends DomainEvent<WillActivationRequiredPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: WillActivationRequiredPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * EstateDistributionTriggeredEvent
 *
 * Integration Event: Signals estate-service to create Estate aggregate
 *
 * Purpose:
 * - When will is executed, estate must be inventoried
 * - Estate-service creates Estate aggregate
 * - Links will instructions to estate assets
 */
export interface EstateDistributionTriggeredPayload {
  willId: string;
  testatorId: string;
  dateOfDeath: Date;
  executorId?: string;
  beneficiaryCount: number;
}

export class EstateDistributionTriggeredEvent extends DomainEvent<EstateDistributionTriggeredPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: EstateDistributionTriggeredPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ============================================================================
// EVENT FACTORY (Convenience)
// ============================================================================

/**
 * WillEventFactory
 *
 * Convenience factory for creating events with proper typing
 */
export class WillEventFactory {
  static willCreated(
    willId: string,
    version: number,
    payload: WillCreatedPayload,
  ): WillCreatedEvent {
    return new WillCreatedEvent(willId, 'Will', version, payload);
  }

  static willActivated(
    willId: string,
    version: number,
    payload: WillActivatedPayload,
  ): WillActivatedEvent {
    return new WillActivatedEvent(willId, 'Will', version, payload);
  }

  static willExecuted(
    willId: string,
    version: number,
    payload: WillExecutedPayload,
  ): WillExecutedEvent {
    return new WillExecutedEvent(willId, 'Will', version, payload);
  }

  static willRevoked(
    willId: string,
    version: number,
    payload: WillRevokedPayload,
  ): WillRevokedEvent {
    return new WillRevokedEvent(willId, 'Will', version, payload);
  }

  static witnessAdded(
    willId: string,
    version: number,
    payload: WitnessAddedPayload,
  ): WitnessAddedEvent {
    return new WitnessAddedEvent(willId, 'Will', version, payload);
  }

  static executorNominated(
    willId: string,
    version: number,
    payload: ExecutorNominatedPayload,
  ): ExecutorNominatedEvent {
    return new ExecutorNominatedEvent(willId, 'Will', version, payload);
  }

  static beneficiaryAssigned(
    willId: string,
    version: number,
    payload: BeneficiaryAssignedPayload,
  ): BeneficiaryAssignedEvent {
    return new BeneficiaryAssignedEvent(willId, 'Will', version, payload);
  }

  static personDisinherited(
    willId: string,
    version: number,
    payload: PersonDisinheritedPayload,
  ): PersonDisinheritedEvent {
    return new PersonDisinheritedEvent(willId, 'Will', version, payload);
  }
}

// ============================================================================
// EVENT TYPE REGISTRY (For Event Store)
// ============================================================================

/**
 * WillEventTypes
 *
 * Central registry of all will event types
 * Used by event store for deserialization
 */
export const WillEventTypes = {
  // Lifecycle
  WILL_CREATED: 'WillCreatedEvent',
  WILL_PREPARED_FOR_WITNESSING: 'WillPreparedForWitnessingEvent',
  WILL_WITNESSED: 'WillWitnessedEvent',
  WILL_ACTIVATED: 'WillActivatedEvent',
  WILL_EXECUTED: 'WillExecutedEvent',
  WILL_ENTERED_PROBATE: 'WillEnteredProbateEvent',
  WILL_REVOKED: 'WillRevokedEvent',
  WILL_SUPERSEDED: 'WillSupersededEvent',
  WILL_CONTESTED: 'WillContestedEvent',

  // Capacity
  TESTAMENTARY_CAPACITY_ASSESSED: 'TestamentaryCapacityAssessedEvent',
  TESTAMENTARY_CAPACITY_CHALLENGED: 'TestamentaryCapacityChallengedEvent',

  // Witnesses
  WITNESS_ADDED: 'WitnessAddedEvent',
  WITNESS_REMOVED: 'WitnessRemovedEvent',
  WITNESS_SIGNED: 'WitnessSignedEvent',

  // Executors
  EXECUTOR_NOMINATED: 'ExecutorNominatedEvent',
  EXECUTOR_REMOVED: 'ExecutorRemovedEvent',
  EXECUTOR_ACCEPTED: 'ExecutorAcceptedEvent',
  EXECUTOR_DECLINED: 'ExecutorDeclinedEvent',

  // Beneficiaries
  BENEFICIARY_ASSIGNED: 'BeneficiaryAssignedEvent',
  BENEFICIARY_REMOVED: 'BeneficiaryRemovedEvent',
  BENEFICIARY_SHARE_UPDATED: 'BeneficiaryShareUpdatedEvent',

  // Codicils
  CODICIL_ADDED: 'CodicilAddedEvent',
  CODICIL_ACTIVATED: 'CodicilActivatedEvent',

  // Disinheritance
  PERSON_DISINHERITED: 'PersonDisinheritedEvent',
  DISINHERITANCE_CHALLENGED: 'DisinheritanceChallengedEvent',

  // Integration
  WILL_ACTIVATION_REQUIRED: 'WillActivationRequiredEvent',
  ESTATE_DISTRIBUTION_TRIGGERED: 'EstateDistributionTriggeredEvent',
} as const;

// ============================================================================
// EVENT HANDLER TYPES (For Application Layer)
// ============================================================================

/**
 * Event Handler Interface
 *
 * Application layer implements handlers for each event type
 * Handlers perform side effects (notifications, integrations, etc.)
 */
export interface IWillEventHandler<T extends DomainEvent<any>> {
  handle(event: T): Promise<void>;
}

/**
 * Event Bus Interface
 *
 * Infrastructure layer implements event bus
 * Publishes events to handlers and external systems
 */
export interface IWillEventBus {
  publish(event: DomainEvent<any>): Promise<void>;
  publishMany(events: DomainEvent<any>[]): Promise<void>;
  subscribe<T extends DomainEvent<any>>(eventType: string, handler: IWillEventHandler<T>): void;
}
