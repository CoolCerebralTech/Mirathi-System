// domain/entities/legal-dependant.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { KenyanLawSection, Money, SuccessionLawSection } from '../value-objects';

/**
 * Legal Dependant Entity
 *
 * Represents a person claiming dependant provision from the Estate
 *
 * CRITICAL LEGAL REFERENCE:
 * - Section 26 LSA: Court can order provision for dependants (overrides will)
 * - Section 29 LSA: Defines who qualifies as dependant
 *
 * S.29 Dependants include:
 * (a) Wife or wives, former wife/wives
 * (b) Children (including stepchildren under 18, or incapacitated)
 * (c) Parents (if they were being maintained by deceased)
 * (d) Other relatives who were dependent on deceased
 *
 * Business Rules:
 * - Dependant claims must be verified with evidence
 * - Monthly needs calculated based on previous support
 * - Custodial parent identified for minor children
 * - Multiple dependants may claim from same estate
 * - Claims can be challenged by beneficiaries
 *
 * Design: Entity (not aggregate) - owned by Estate aggregate
 */

export enum DependencyLevel {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL', // Deceased provided some support
  FULL = 'FULL', // Deceased was primary/sole supporter
}

export interface LegalDependantProps {
  estateId: UniqueEntityID;
  dependantId: UniqueEntityID; // FamilyMember ID
  deceasedId: UniqueEntityID; // FamilyMember ID

  // Legal Basis
  basisSection: SuccessionLawSection; // S.29(a) Spouse, S.29(b) Child, etc.
  dependencyLevel: DependencyLevel;
  relationshipToDeceased: string;

  // Financial Claim
  monthlyNeeds?: Money;
  previousMonthlySupport?: Money;
  dependencyPercentage: number; // 0-100%

  // Verification
  isVerified: boolean;
  verificationNotes?: string;

  // Minor-Specific
  custodialParentId?: UniqueEntityID;
  dateOfBirth?: Date;

  // Metadata
  metadata?: Record<string, any>;
}

export class LegalDependant extends Entity<LegalDependantProps> {
  private _evidences: DependantEvidence[] = [];

  private constructor(id: UniqueEntityID, props: LegalDependantProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  /**
   * Factory: Create new dependant claim
   */
  public static create(
    props: Omit<LegalDependantProps, 'isVerified'>,
    id?: UniqueEntityID,
  ): LegalDependant {
    const dependant = new LegalDependant(id ?? new UniqueEntityID(), {
      ...props,
      isVerified: false,
    });

    return dependant;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: UniqueEntityID,
    props: LegalDependantProps,
    createdAt: Date,
  ): LegalDependant {
    return new LegalDependant(id, props, createdAt);
  }

  // =========================================================================
  // GETTERS
  // =========================================================================

  get estateId(): UniqueEntityID {
    return this.props.estateId;
  }

  get dependantId(): UniqueEntityID {
    return this.props.dependantId;
  }

  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }

  get basisSection(): SuccessionLawSection {
    return this.props.basisSection;
  }

  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }

  get relationshipToDeceased(): string {
    return this.props.relationshipToDeceased;
  }

  get monthlyNeeds(): Money | undefined {
    return this.props.monthlyNeeds;
  }

  get previousMonthlySupport(): Money | undefined {
    return this.props.previousMonthlySupport;
  }

  get dependencyPercentage(): number {
    return this.props.dependencyPercentage;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get custodialParentId(): UniqueEntityID | undefined {
    return this.props.custodialParentId;
  }

  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }

  get evidences(): ReadonlyArray<DependantEvidence> {
    return Object.freeze([...this._evidences]);
  }

  // =========================================================================
  // BUSINESS LOGIC - DEPENDANT QUALIFICATION (S.29 LSA)
  // =========================================================================

  /**
   * Check if qualifies as S.29(a) dependant (spouse/former spouse)
   */
  public isSpouseDependant(): boolean {
    return (
      this.basisSection.value === KenyanLawSection.S29_DEPENDANTS &&
      this.relationshipToDeceased.toLowerCase().includes('spouse')
    );
  }

  /**
   * Check if qualifies as S.29(b) dependant (child)
   */
  public isChildDependant(): boolean {
    return (
      this.basisSection.value === KenyanLawSection.S29_DEPENDANTS &&
      this.relationshipToDeceased.toLowerCase().includes('child')
    );
  }

  /**
   * Check if minor (under 18) - automatic dependant status
   */
  public isMinor(asOfDate: Date = new Date()): boolean {
    if (!this.dateOfBirth) {
      return false;
    }

    const age = this.calculateAge(asOfDate);
    return age < 18;
  }

  /**
   * Calculate age
   */
  public calculateAge(asOfDate: Date = new Date()): number {
    if (!this.dateOfBirth) {
      throw new Error('Date of birth is required to calculate age');
    }

    const ageInMilliseconds = asOfDate.getTime() - this.dateOfBirth.getTime();
    const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(ageInYears);
  }

  /**
   * Check if requires custodial parent (minor child)
   */
  public requiresCustodialParent(): boolean {
    return this.isChildDependant() && this.isMinor();
  }

  /**
   * Check if fully dependent (100% of support from deceased)
   */
  public isFullyDependent(): boolean {
    return this.dependencyLevel === DependencyLevel.FULL || this.dependencyPercentage === 100;
  }

  // =========================================================================
  // BUSINESS LOGIC - FINANCIAL CLAIM
  // =========================================================================

  /**
   * Calculate monthly provision needed
   * Based on previous support and dependency level
   */
  public calculateMonthlyProvision(): Money {
    // If monthly needs specified, use that
    if (this.monthlyNeeds) {
      return this.monthlyNeeds;
    }

    // If previous support known, calculate based on dependency percentage
    if (this.previousMonthlySupport) {
      return this.previousMonthlySupport.multiply(this.dependencyPercentage / 100);
    }

    // No data available
    return Money.zero();
  }

  /**
   * Calculate annual provision needed
   */
  public calculateAnnualProvision(): Money {
    const monthly = this.calculateMonthlyProvision();
    return monthly.multiply(12);
  }

  /**
   * Estimate lump sum provision (for minors until 18, or fixed period)
   */
  public estimateLumpSumProvision(yearsOfSupport?: number): Money {
    const annual = this.calculateAnnualProvision();

    // If minor, calculate until age 18
    if (this.isMinor() && this.dateOfBirth) {
      const yearsUntil18 = 18 - this.calculateAge();
      return annual.multiply(yearsUntil18);
    }

    // If years specified, use that
    if (yearsOfSupport) {
      return annual.multiply(yearsOfSupport);
    }

    // Default: 5 years support
    return annual.multiply(5);
  }

  /**
   * Update monthly needs
   */
  public updateMonthlyNeeds(newNeeds: Money, reason?: string): void {
    this.ensureNotDeleted();

    if (newNeeds.isNegative()) {
      throw new Error('Monthly needs cannot be negative');
    }

    (this.props as any).monthlyNeeds = newNeeds;

    if (reason) {
      (this.props as any).metadata = {
        ...this.props.metadata,
        lastNeedsUpdateReason: reason,
        lastNeedsUpdateAt: new Date(),
      };
    }

    this.incrementVersion();
  }

  /**
   * Update dependency percentage
   */
  public updateDependencyPercentage(newPercentage: number): void {
    this.ensureNotDeleted();

    if (newPercentage < 0 || newPercentage > 100) {
      throw new Error('Dependency percentage must be between 0 and 100');
    }

    (this.props as any).dependencyPercentage = newPercentage;

    // Update dependency level based on percentage
    if (newPercentage === 100) {
      (this.props as any).dependencyLevel = DependencyLevel.FULL;
    } else if (newPercentage > 0) {
      (this.props as any).dependencyLevel = DependencyLevel.PARTIAL;
    } else {
      (this.props as any).dependencyLevel = DependencyLevel.NONE;
    }

    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - VERIFICATION
  // =========================================================================

  /**
   * Add evidence to support claim
   */
  public addEvidence(evidence: Omit<DependantEvidence, 'id' | 'recordedAt'>): void {
    this.ensureNotDeleted();

    if (!evidence.evidenceType || evidence.evidenceType.trim().length === 0) {
      throw new Error('Evidence type is required');
    }

    this._evidences.push({
      ...evidence,
      id: new UniqueEntityID(),
      recordedAt: new Date(),
    });

    this.incrementVersion();
  }

  /**
   * Remove evidence
   */
  public removeEvidence(evidenceId: UniqueEntityID): void {
    this.ensureNotDeleted();

    const index = this._evidences.findIndex((e) => e.id.equals(evidenceId));
    if (index === -1) {
      throw new Error('Evidence not found');
    }

    this._evidences.splice(index, 1);
    this.incrementVersion();
  }

  /**
   * Verify dependant claim (by executor/court)
   */
  public verify(notes?: string): void {
    this.ensureNotDeleted();

    if (this.isVerified) {
      throw new Error('Dependant claim is already verified');
    }

    if (this._evidences.length === 0) {
      throw new Error('Cannot verify claim without evidence');
    }

    (this.props as any).isVerified = true;
    (this.props as any).verificationNotes = notes;
    (this.props as any).metadata = {
      ...this.props.metadata,
      verifiedAt: new Date(),
    };

    this.incrementVersion();
  }

  /**
   * Reject verification
   */
  public rejectVerification(reason: string): void {
    this.ensureNotDeleted();

    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required');
    }

    (this.props as any).isVerified = false;
    (this.props as any).verificationNotes = reason;
    (this.props as any).metadata = {
      ...this.props.metadata,
      verificationRejectedAt: new Date(),
      rejectionReason: reason,
    };

    this.incrementVersion();
  }

  /**
   * Check if has sufficient evidence
   */
  public hasSufficientEvidence(): boolean {
    // Minimum evidence requirements
    const requiredEvidenceCount = this.isMinor() ? 1 : 2;
    return this._evidences.length >= requiredEvidenceCount;
  }

  /**
   * Get missing evidence types
   */
  public getMissingEvidence(): string[] {
    const missing: string[] = [];

    if (this.isChildDependant()) {
      const hasBirthCertificate = this._evidences.some(
        (e) =>
          e.evidenceType.toLowerCase().includes('birth') ||
          e.evidenceType.toLowerCase().includes('certificate'),
      );
      if (!hasBirthCertificate) {
        missing.push('Birth Certificate');
      }
    }

    if (this.monthlyNeeds && this.monthlyNeeds.greaterThan(Money.zero())) {
      const hasFinancialEvidence = this._evidences.some(
        (e) =>
          e.evidenceType.toLowerCase().includes('school') ||
          e.evidenceType.toLowerCase().includes('medical') ||
          e.evidenceType.toLowerCase().includes('receipt'),
      );
      if (!hasFinancialEvidence) {
        missing.push('Financial Evidence (school fees, medical bills, etc.)');
      }
    }

    return missing;
  }

  // =========================================================================
  // BUSINESS LOGIC - CUSTODIAL PARENT
  // =========================================================================

  /**
   * Assign custodial parent (for minors)
   */
  public assignCustodialParent(custodialParentId: UniqueEntityID): void {
    this.ensureNotDeleted();

    if (!this.requiresCustodialParent()) {
      throw new Error('Custodial parent only required for minor children');
    }

    (this.props as any).custodialParentId = custodialParentId;
    this.incrementVersion();
  }

  /**
   * Remove custodial parent
   */
  public removeCustodialParent(): void {
    this.ensureNotDeleted();

    (this.props as any).custodialParentId = undefined;
    this.incrementVersion();
  }

  // =========================================================================
  // BUSINESS LOGIC - CLAIM PRIORITY
  // =========================================================================

  /**
   * Get claim priority (for distribution calculations)
   * Higher priority dependants get preference
   */
  public getClaimPriority(): number {
    // Minor children: Highest priority (1)
    if (this.isMinor()) {
      return 1;
    }

    // Spouse: High priority (2)
    if (this.isSpouseDependant()) {
      return 2;
    }

    // Full dependants: Medium priority (3)
    if (this.isFullyDependent()) {
      return 3;
    }

    // Partial dependants: Lower priority (4)
    return 4;
  }

  /**
   * Compare priority with another dependant
   */
  public hasHigherPriorityThan(other: LegalDependant): boolean {
    return this.getClaimPriority() < other.getClaimPriority();
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  private validate(): void {
    if (!this.props.estateId) {
      throw new Error('Estate ID is required');
    }

    if (!this.props.dependantId) {
      throw new Error('Dependant ID is required');
    }

    if (!this.props.deceasedId) {
      throw new Error('Deceased ID is required');
    }

    if (!this.props.basisSection) {
      throw new Error('Legal basis section is required');
    }

    if (!this.props.dependencyLevel) {
      throw new Error('Dependency level is required');
    }

    if (
      !this.props.relationshipToDeceased ||
      this.props.relationshipToDeceased.trim().length === 0
    ) {
      throw new Error('Relationship to deceased is required');
    }

    if (this.props.dependencyPercentage < 0 || this.props.dependencyPercentage > 100) {
      throw new Error('Dependency percentage must be between 0 and 100');
    }

    if (this.props.monthlyNeeds && this.props.monthlyNeeds.isNegative()) {
      throw new Error('Monthly needs cannot be negative');
    }

    if (this.props.previousMonthlySupport && this.props.previousMonthlySupport.isNegative()) {
      throw new Error('Previous monthly support cannot be negative');
    }

    // Minor children must have date of birth
    if (this.requiresCustodialParent() && !this.dateOfBirth) {
      throw new Error('Date of birth is required for minor children');
    }
  }

  /**
   * Clone dependant (for scenarios)
   */
  public clone(): LegalDependant {
    const clonedProps = { ...this.props };
    const cloned = new LegalDependant(new UniqueEntityID(), clonedProps);
    cloned._evidences = [...this._evidences];
    return cloned;
  }
}

/**
 * Dependant Evidence (Supporting Documentation)
 */
export interface DependantEvidence {
  id: UniqueEntityID;
  evidenceType: string; // "SCHOOL_RECEIPT", "MEDICAL_REPORT", "BIRTH_CERTIFICATE"
  documentId?: UniqueEntityID; // Link to Documents Service
  description?: string;
  recordedAt: Date;
}
