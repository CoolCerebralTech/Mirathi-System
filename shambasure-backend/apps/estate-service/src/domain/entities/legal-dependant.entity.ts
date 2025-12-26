// src/estate-service/src/domain/entities/legal-dependant.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DependencyLevel, DependencyLevelHelper } from '../enums/dependency-level.enum';
import { EvidenceType } from '../enums/evidence-type.enum';
import { KenyanLawSection } from '../enums/kenyan-law-section.enum';
import {
  DependantEvidenceAddedEvent,
  LegalDependantCreatedEvent,
  LegalDependantRejectedEvent,
  LegalDependantStatusChangedEvent,
  LegalDependantVerifiedEvent,
} from '../events/legal-dependant.event';
import {
  DependantValidationException,
  MissingEvidenceException,
} from '../exceptions/legal-dependant.exception';
import { MoneyVO } from '../value-objects/money.vo';
import { DependantEvidence } from './dependant-evidence.entity';

/**
 * Dependant Relationship Enum
 *
 * S.29 LSA Categories:
 * - SPOUSE: S.29(a) - Automatic dependency
 * - CHILD: S.29(a) - Automatic dependency (includes adopted, born out of wedlock)
 * - PARENT: S.29(b) - Must prove maintenance
 * - STEP_CHILD: S.29(b) - Must prove maintenance
 * - SIBLING: S.29(b) - Must prove maintenance
 * - OTHER: S.29(b) - Any person maintained by deceased
 */
export enum DependantRelationship {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  ADOPTED_CHILD = 'ADOPTED_CHILD',
  STEP_CHILD = 'STEP_CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  GRANDCHILD = 'GRANDCHILD',
  NIECE_NEPHEW = 'NIECE_NEPHEW',
  OTHER = 'OTHER',
}

/**
 * Dependant Status Enum
 */
export enum DependantStatus {
  DRAFT = 'DRAFT',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  APPEALED = 'APPEALED',
  SETTLED = 'SETTLED',
  DISPUTED = 'DISPUTED',
}

export interface LegalDependantProps {
  estateId: string;
  deceasedId: string;

  // Claimant Identity
  dependantId: string;
  dependantName: string;
  relationship: DependantRelationship;

  // Legal Basis
  lawSection: KenyanLawSection;
  dependencyLevel: DependencyLevel;

  // Demographics
  dateOfBirth?: Date;
  age?: number;
  isMinor: boolean;
  isIncapacitated: boolean;
  hasDisability: boolean;
  disabilityPercentage?: number;

  // Financial Dependency
  monthlyMaintenanceNeeds: MoneyVO;
  annualSupportProvided?: MoneyVO;
  proposedAllocation?: MoneyVO;

  // Evidence & Verification
  evidence: DependantEvidence[];
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Status
  status: DependantStatus;
  rejectionReason?: string;
  appealedReason?: string;

  // Custodial Information
  custodialParentId?: string;
  guardianId?: string;

  // Court Information
  courtCaseNumber?: string;
  courtOrderRef?: string;

  // Metadata
  notes?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiresCourtDetermination: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Legal Dependant Entity
 */
export class LegalDependant extends Entity<LegalDependantProps> {
  private constructor(props: LegalDependantProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory method to create a new dependant claim
   */
  public static create(
    props: Omit<
      LegalDependantProps,
      | 'status'
      | 'isVerified'
      | 'evidence'
      | 'riskLevel'
      | 'requiresCourtDetermination'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): LegalDependant {
    // Validate age calculations
    let isMinor = props.isMinor;
    if (props.dateOfBirth) {
      const age = Math.floor(
        (new Date().getTime() - props.dateOfBirth.getTime()) / (1000 * 3600 * 24 * 365.25),
      );
      isMinor = age < 18;
    }

    // Determine risk level
    const riskLevel = LegalDependant.calculateRiskLevel(
      props.relationship,
      props.dependencyLevel,
      props.isIncapacitated,
      isMinor,
    );

    // Determine if court determination is required
    const requiresCourtDetermination = LegalDependant.requiresCourtDetermination(
      props.relationship,
      props.monthlyMaintenanceNeeds,
    );

    const now = new Date();
    const dependant = new LegalDependant(
      {
        ...props,
        isMinor,
        status: DependantStatus.PENDING_VERIFICATION,
        isVerified: false,
        evidence: [],
        riskLevel,
        requiresCourtDetermination,
        createdAt: now,
        updatedAt: now,
      },
      id,
    );

    dependant.addDomainEvent(
      new LegalDependantCreatedEvent(
        dependant.id.toString(),
        props.estateId,
        props.dependantId,
        props.relationship,
        props.lawSection,
        dependant.version,
      ),
    );

    return dependant;
  }

  /**
   * Factory for spouse dependant (S.29(a))
   */
  public static createSpouseDependant(
    estateId: string,
    deceasedId: string,
    dependantId: string,
    dependantName: string,
    monthlyMaintenanceNeeds: MoneyVO,
    isIncapacitated: boolean = false,
  ): LegalDependant {
    return LegalDependant.create({
      estateId,
      deceasedId,
      dependantId,
      dependantName,
      relationship: DependantRelationship.SPOUSE,
      lawSection: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: DependencyLevel.FULL,
      isMinor: false,
      isIncapacitated,
      hasDisability: false,
      monthlyMaintenanceNeeds,
    });
  }

  /**
   * Factory for child dependant (S.29(a))
   */
  public static createChildDependant(
    estateId: string,
    deceasedId: string,
    dependantId: string,
    dependantName: string,
    dateOfBirth: Date,
    monthlyMaintenanceNeeds: MoneyVO,
    custodialParentId?: string,
  ): LegalDependant {
    const age = Math.floor(
      (new Date().getTime() - dateOfBirth.getTime()) / (1000 * 3600 * 24 * 365.25),
    );
    const isMinor = age < 18;

    return LegalDependant.create({
      estateId,
      deceasedId,
      dependantId,
      dependantName,
      relationship: DependantRelationship.CHILD,
      lawSection: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: isMinor ? DependencyLevel.FULL : DependencyLevel.PARTIAL,
      dateOfBirth,
      age,
      isMinor,
      isIncapacitated: false,
      hasDisability: false,
      monthlyMaintenanceNeeds,
      custodialParentId,
    });
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // S.29(b) dependants must have evidence of maintenance
    if (this.isSection29B() && this.props.monthlyMaintenanceNeeds.isZero()) {
      throw new DependantValidationException(
        'S.29(b) dependants must have documented maintenance needs',
      );
    }

    // High-value claims require evidence
    if (
      this.props.monthlyMaintenanceNeeds.isGreaterThan(MoneyVO.createKES(50000)) &&
      this.getValidEvidence().length === 0
    ) {
      console.warn(
        `Warning: High-value dependant claim (${this.props.dependantName}) lacks evidence`,
      );
    }

    // Minors must have custodial parent or guardian
    if (this.props.isMinor && !this.props.custodialParentId && !this.props.guardianId) {
      console.warn(
        `Warning: Minor dependant ${this.props.dependantName} has no custodian/guardian`,
      );
    }
  }

  /**
   * Get only valid (verified, not expired) evidence
   */
  private getValidEvidence(): DependantEvidence[] {
    return this.props.evidence.filter((evidence) => evidence.isValid());
  }

  /**
   * Calculate risk level based on dependant characteristics
   */
  private static calculateRiskLevel(
    relationship: DependantRelationship,
    dependencyLevel: DependencyLevel,
    isIncapacitated: boolean,
    isMinor: boolean,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // High risk factors
    if (isMinor || isIncapacitated) return 'HIGH';

    // Medium risk factors
    if (dependencyLevel === DependencyLevel.FULL) return 'MEDIUM';
    if (
      relationship === DependantRelationship.STEP_CHILD ||
      relationship === DependantRelationship.OTHER
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * Determine if court determination is required
   */
  private static requiresCourtDetermination(
    relationship: DependantRelationship,
    monthlyNeeds: MoneyVO,
  ): boolean {
    // High-value claims require court
    if (monthlyNeeds.isGreaterThan(MoneyVO.createKES(100000))) return true;

    // Non-standard relationships may require court
    const nonStandardRelationships = [
      DependantRelationship.STEP_CHILD,
      DependantRelationship.OTHER,
      DependantRelationship.NIECE_NEPHEW,
      DependantRelationship.GRANDCHILD,
    ];

    return nonStandardRelationships.includes(relationship);
  }

  // ===========================================================================
  // SECTION 29 CLASSIFICATION
  // ===========================================================================

  /**
   * Check if dependant falls under S.29(a) (automatic)
   */
  public isSection29A(): boolean {
    const section29aRelationships = [
      DependantRelationship.SPOUSE,
      DependantRelationship.CHILD,
      DependantRelationship.ADOPTED_CHILD,
    ];

    return section29aRelationships.includes(this.props.relationship);
  }

  /**
   * Check if dependant falls under S.29(b) (must prove maintenance)
   */
  public isSection29B(): boolean {
    return !this.isSection29A();
  }

  // ===========================================================================
  // EVIDENCE MANAGEMENT
  // ===========================================================================

  /**
   * Add evidence to support dependant claim
   */
  public addEvidence(evidence: DependantEvidence, addedBy: string): void {
    // Validate evidence is for this dependant
    if (evidence.dependantId !== this.id.toString()) {
      throw new DependantValidationException('Evidence must be linked to this dependant');
    }

    this.updateState({
      evidence: [...this.props.evidence, evidence],
      updatedAt: new Date(),
      notes: `Evidence added: ${evidence.type}. Added by: ${addedBy}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new DependantEvidenceAddedEvent(
        this.id.toString(),
        this.props.estateId,
        evidence.type,
        evidence.id.toString(),
        addedBy,
        this.version,
      ),
    );
  }

  /**
   * Verify evidence (mark specific evidence as verified)
   */
  public verifyEvidence(evidenceId: string, verifiedBy: string, notes?: string): void {
    const evidenceIndex = this.props.evidence.findIndex((e) => e.id.toString() === evidenceId);

    if (evidenceIndex === -1) {
      throw new DependantValidationException(`Evidence ${evidenceId} not found`);
    }

    const evidence = this.props.evidence[evidenceIndex];
    evidence.verify(verifiedBy, notes);

    // Update the evidence array
    const updatedEvidence = [...this.props.evidence];
    updatedEvidence[evidenceIndex] = evidence;

    this.updateState({
      evidence: updatedEvidence,
      updatedAt: new Date(),
    });
  }

  // ===========================================================================
  // CLAIM PROCESSING
  // ===========================================================================

  /**
   * Verify the dependant claim
   */
  public verifyClaim(verifiedBy: string, verificationNotes?: string): void {
    if (this.props.status === DependantStatus.VERIFIED) {
      throw new DependantValidationException('Claim is already verified');
    }

    // S.29(b) claims require evidence
    if (this.isSection29B() && this.getValidEvidence().length === 0) {
      throw new MissingEvidenceException(
        this.id.toString(),
        'S.29(b) claimants must provide evidence of maintenance',
      );
    }

    // Spouse claims require marriage evidence
    if (this.props.relationship === DependantRelationship.SPOUSE) {
      const hasMarriageEvidence = this.getValidEvidence().some(
        (e) => e.type === EvidenceType.MARRIAGE_CERTIFICATE || e.type === EvidenceType.AFFIDAVIT,
      );

      if (!hasMarriageEvidence) {
        throw new MissingEvidenceException(
          this.id.toString(),
          'Spouse claims require marriage certificate or affidavit',
        );
      }
    }

    // Child claims require birth certificate
    if (this.props.relationship === DependantRelationship.CHILD) {
      const hasBirthEvidence = this.getValidEvidence().some(
        (e) => e.type === EvidenceType.BIRTH_CERTIFICATE,
      );

      if (!hasBirthEvidence) {
        throw new MissingEvidenceException(
          this.id.toString(),
          'Child claims require birth certificate',
        );
      }
    }

    this.updateState({
      status: DependantStatus.VERIFIED,
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
      updatedAt: new Date(),
      notes: `Claim verified: ${verificationNotes}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new LegalDependantVerifiedEvent(
        this.id.toString(),
        this.props.estateId,
        verifiedBy,
        verificationNotes,
        this.version,
      ),
    );
  }

  /**
   * Reject the dependant claim
   */
  public rejectClaim(reason: string, rejectedBy: string, courtOrderRef?: string): void {
    const oldStatus = this.props.status;

    this.updateState({
      status: DependantStatus.REJECTED,
      rejectionReason: reason,
      courtOrderRef,
      updatedAt: new Date(),
      notes: `Claim rejected: ${reason}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new LegalDependantRejectedEvent(
        this.id.toString(),
        this.props.estateId,
        reason,
        rejectedBy,
        courtOrderRef,
        this.version,
      ),
    );

    // Also emit status change event
    this.addDomainEvent(
      new LegalDependantStatusChangedEvent(
        this.id.toString(),
        this.props.estateId,
        oldStatus,
        DependantStatus.REJECTED,
        reason,
        rejectedBy,
        this.version,
      ),
    );
  }

  /**
   * Appeal a rejected claim
   */
  public appealRejection(
    reason: string,
    appealedBy: string,
    newEvidence?: DependantEvidence,
  ): void {
    if (this.props.status !== DependantStatus.REJECTED) {
      throw new DependantValidationException('Only rejected claims can be appealed');
    }

    const updates: Partial<LegalDependantProps> = {
      status: DependantStatus.APPEALED,
      appealedReason: reason,
      updatedAt: new Date(),
      notes: `Appeal filed: ${reason}. ${this.props.notes || ''}`,
    };

    if (newEvidence) {
      updates.evidence = [...this.props.evidence, newEvidence];
    }

    this.updateState(updates);
  }

  /**
   * Mark claim as disputed
   */
  public markAsDisputed(reason: string, disputedBy: string): void {
    const oldStatus = this.props.status;

    this.updateState({
      status: DependantStatus.DISPUTED,
      updatedAt: new Date(),
      notes: `Claim disputed: ${reason}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new LegalDependantStatusChangedEvent(
        this.id.toString(),
        this.props.estateId,
        oldStatus,
        DependantStatus.DISPUTED,
        reason,
        disputedBy,
        this.version,
      ),
    );
  }

  /**
   * Settle the claim (provide for dependant)
   */
  public settleClaim(allocation: MoneyVO, settledBy: string, settlementMethod?: string): void {
    if (this.props.status !== DependantStatus.VERIFIED) {
      throw new DependantValidationException('Only verified claims can be settled');
    }

    const oldStatus = this.props.status;

    this.updateState({
      status: DependantStatus.SETTLED,
      proposedAllocation: allocation,
      updatedAt: new Date(),
      notes: `Claim settled with allocation: ${allocation.toString()}. Method: ${settlementMethod}. ${this.props.notes || ''}`,
    });

    this.addDomainEvent(
      new LegalDependantStatusChangedEvent(
        this.id.toString(),
        this.props.estateId,
        oldStatus,
        DependantStatus.SETTLED,
        `Settled with ${allocation.toString()}`,
        settledBy,
        this.version,
      ),
    );
  }

  // ===========================================================================
  // CALCULATIONS & QUERIES
  // ===========================================================================

  /**
   * Calculate reasonable provision (S.26)
   */
  public calculateReasonableProvision(
    estateNetValue: MoneyVO,
    numberOfDependants: number,
  ): MoneyVO {
    // Basic formula: (Monthly Needs × 12) × Dependency Factor
    const annualNeeds = this.props.monthlyMaintenanceNeeds.multiply(12);

    // Dependency factor based on level
    const dependencyFactor = DependencyLevelHelper.getWeightingFactor(this.props.dependencyLevel);

    // Adjust for minor/incapacitated status
    let adjustedFactor = dependencyFactor;
    if (this.props.isMinor || this.props.isIncapacitated) {
      adjustedFactor *= 1.5; // Increased provision
    }

    const baseProvision = annualNeeds.multiply(adjustedFactor);

    // Cap at reasonable share of estate (80% of equal share)
    const equalShareAmount = estateNetValue.amount / numberOfDependants;
    const maxShareAmount = equalShareAmount * 0.8;
    const maxShare = new MoneyVO({
      amount: maxShareAmount,
      currency: estateNetValue.currency,
    });

    if (baseProvision.isGreaterThan(maxShare)) {
      return maxShare;
    }

    return baseProvision;
  }

  /**
   * Get total evidence credibility score
   */
  public getEvidenceCredibilityScore(): number {
    if (this.props.evidence.length === 0) return 0;

    const validEvidence = this.getValidEvidence();
    if (validEvidence.length === 0) return 0;

    const totalScore = validEvidence.reduce((sum, evidence) => sum + evidence.validationScore, 0);

    return totalScore / validEvidence.length;
  }

  /**
   * Check if claim is strongly supported by evidence
   */
  public hasStrongEvidence(): boolean {
    return this.getEvidenceCredibilityScore() > 80;
  }

  /**
   * Check if claim blocks estate distribution
   */
  public blocksEstateDistribution(): boolean {
    const blockingStatuses = [DependantStatus.DISPUTED, DependantStatus.APPEALED];

    return (
      blockingStatuses.includes(this.props.status) ||
      (this.props.requiresCourtDetermination && this.props.status !== DependantStatus.SETTLED)
    );
  }

  /**
   * Check if claim requires court intervention
   */
  public requiresCourtIntervention(): boolean {
    return (
      this.props.requiresCourtDetermination ||
      this.props.status === DependantStatus.DISPUTED ||
      this.props.status === DependantStatus.APPEALED
    );
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get estateId(): string {
    return this.props.estateId;
  }

  get dependantId(): string {
    return this.props.dependantId;
  }

  get dependantName(): string {
    return this.props.dependantName;
  }

  get relationship(): DependantRelationship {
    return this.props.relationship;
  }

  get status(): DependantStatus {
    return this.props.status;
  }

  get lawSection(): KenyanLawSection {
    return this.props.lawSection;
  }

  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }

  get isMinor(): boolean {
    return this.props.isMinor;
  }

  get isIncapacitated(): boolean {
    return this.props.isIncapacitated;
  }

  get monthlyMaintenanceNeeds(): MoneyVO {
    return this.props.monthlyMaintenanceNeeds;
  }

  get evidence(): DependantEvidence[] {
    return this.props.evidence;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get riskLevel(): 'LOW' | 'MEDIUM' | 'HIGH' {
    return this.props.riskLevel;
  }

  get requiresCourtDetermination(): boolean {
    return this.props.requiresCourtDetermination;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
