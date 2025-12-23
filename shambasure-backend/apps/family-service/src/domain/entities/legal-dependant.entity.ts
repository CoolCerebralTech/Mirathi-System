// domain/entities/legal-dependant.entity.ts
import { DependencyLevel, KenyanLawSection } from '@prisma/client';

import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { CourtProvisionOrderedEvent } from '../events/dependency-events/court-provision-ordered.event';
// Events
import { DependantDeclaredEvent } from '../events/dependency-events/dependant-declared.event';
import { DependantEvidenceVerifiedEvent } from '../events/dependency-events/dependant-evidence-verified.event';
import { DependencyAssessedEvent } from '../events/dependency-events/dependency-assessed.event';
import { S26ClaimFiledEvent } from '../events/dependency-events/s26-claim-filed.event';
// Exceptions
import { InvalidDependantException } from '../exceptions/dependant.exception';
import { DependencyAssessment } from '../value-objects/dependency/dependency-assessment.vo';
import { DisabilityStatus } from '../value-objects/dependency/disability-status.vo';
import { SupportEvidence } from '../value-objects/dependency/support-evidence.vo';
// Value Objects
import { KenyanMoney } from '../value-objects/financial/kenyan-money.vo';
import { CourtOrder } from '../value-objects/legal/court-order.vo';

/**
 * Dependency Relationship Type (S.29 LSA Categories)
 */
export enum DependencyRelationship {
  SPOUSE = 'SPOUSE', // S.29(a) - Automatic dependant
  CHILD = 'CHILD', // S.29(a) - Automatic dependant
  ADOPTED_CHILD = 'ADOPTED_CHILD', // S.29(a) - Same as biological
  STEPCHILD = 'STEPCHILD', // S.29(b) - Conditional
  PARENT = 'PARENT', // S.29(b) - Conditional
  SIBLING = 'SIBLING', // S.29(b) - Conditional
  GRANDCHILD = 'GRANDCHILD', // S.29(b) - Conditional
  COHABITOR = 'COHABITOR', // S.29(5) - "Woman living as wife"
  EX_SPOUSE = 'EX_SPOUSE', // S.26 - Court provision only
  OTHER = 'OTHER', // S.29(b) - Must prove dependency
}

/**
 * S.26 Claim Status
 */
export enum S26ClaimStatus {
  NO_CLAIM = 'NO_CLAIM', // Not a claimant
  PENDING = 'PENDING', // Claim filed, awaiting court
  APPROVED = 'APPROVED', // Court approved provision
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED', // Court approved less than claimed
  DENIED = 'DENIED', // Court denied claim
  WITHDRAWN = 'WITHDRAWN', // Claimant withdrew
}

/**
 * Legal Dependant Entity Props
 */
export interface LegalDependantProps {
  // Core Identity
  deceasedId: UniqueEntityID; // The person who died
  dependantId: UniqueEntityID; // The dependant person

  // Legal Relationship
  relationship: DependencyRelationship;
  basisSection: KenyanLawSection; // Which LSA section applies

  // Dependency Assessment
  assessment: DependencyAssessment;

  // Support Evidence
  supportEvidence?: SupportEvidence;

  // Disability Status (S.29(2))
  disabilityStatus?: DisabilityStatus;

  // Minor/Student Status
  isMinor: boolean;
  currentAge?: number;
  isStudent: boolean;
  studentUntil?: Date;
  ageLimit?: number; // When dependency terminates (18, 21, 25)

  // Custodial Parent (for minors)
  custodialParentId?: UniqueEntityID;

  // S.26 Court Provision
  isS26Claimant: boolean;
  s26ClaimAmount?: KenyanMoney;
  s26ClaimStatus: S26ClaimStatus;
  s26CourtOrder?: CourtOrder;
  s26ProvisionAmount?: KenyanMoney;

  // Evidence Documents
  evidenceDocuments: string[]; // Document IDs
  verifiedAt?: Date;
  verifiedBy?: UniqueEntityID;
}

/**
 * Props for Creating Legal Dependant
 */
export interface CreateLegalDependantProps {
  deceasedId: string;
  dependantId: string;
  relationship: DependencyRelationship;

  // Demographics
  isMinor: boolean;
  currentAge?: number;
  isStudent?: boolean;
  studentUntil?: Date;

  // Disability
  hasPhysicalDisability?: boolean;
  hasMentalDisability?: boolean;
  requiresOngoingCare?: boolean;
  disabilityDetails?: string;

  // Financial Support (optional at creation)
  monthlySupport?: number;
  supportStartDate?: Date;
  supportEndDate?: Date;

  // Assessment
  assessmentMethod?: string;
  dependencyPercentage?: number;

  // Custodial parent
  custodialParentId?: string;
}

/**
 * LEGAL DEPENDANT ENTITY
 *
 * Represents a person who was financially or otherwise dependent on the deceased
 *
 * KENYAN LAW (S.29 Law of Succession Act):
 *
 * S.29(a) - AUTOMATIC DEPENDANTS (Priority):
 * - Surviving spouse
 * - Children (biological, adopted)
 * - No proof of dependency required
 *
 * S.29(b) - CONDITIONAL DEPENDANTS:
 * - Parents, siblings, stepchildren, etc.
 * - MUST prove actual dependency on deceased
 *
 * S.29(2) - DISABLED DEPENDANTS:
 * - Physical/mental disability
 * - Requires ongoing care
 * - Extended dependency rights
 *
 * S.29(5) - COHABITORS:
 * - "Woman living as wife" for 5+ years
 * - Must prove dependency
 * - Kenyan customary law considerations
 *
 * S.26 - COURT PROVISION:
 * - Ex-spouses, other claimants
 * - Court discretion on provision amount
 * - Not automatic - must apply
 *
 * AGGREGATE BOUNDARIES:
 * - LegalDependant is an ENTITY (not aggregate root)
 * - Belongs to DependencyAssessment Aggregate
 * - Cannot exist independently
 *
 * INVARIANTS:
 * - Dependant cannot be same person as deceased
 * - Priority dependants (spouse/child) get automatic FULL dependency
 * - Conditional dependants must have evidence
 * - S.26 claimants must file formal claim
 * - Minors must have custodial parent identified
 * - Dependency percentage must be 0-100
 */
export class LegalDependant extends Entity<LegalDependantProps> {
  private constructor(id: UniqueEntityID, props: LegalDependantProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Create new Legal Dependant
   */
  public static create(props: CreateLegalDependantProps): LegalDependant {
    const id = new UniqueEntityID();
    const deceasedId = new UniqueEntityID(props.deceasedId);
    const dependantId = new UniqueEntityID(props.dependantId);

    // INVARIANT: Cannot be dependant of self
    if (deceasedId.equals(dependantId)) {
      throw new InvalidDependantException('A person cannot be a dependant of themselves');
    }

    // Determine LSA section and dependency level
    const { basisSection, dependencyLevel } = LegalDependant.determineLegalBasis(
      props.relationship,
      props.isMinor,
    );

    // Build dependency assessment
    const assessment = DependencyAssessment.create({
      dependencyLevel,
      dependencyPercentage:
        props.dependencyPercentage ?? LegalDependant.calculateDefaultPercentage(dependencyLevel),
      assessmentMethod: props.assessmentMethod ?? 'STATUTORY_DEFAULT',
      assessmentDate: new Date(),
    });

    // Build support evidence if provided
    let supportEvidence: SupportEvidence | undefined;
    if (props.monthlySupport) {
      supportEvidence = SupportEvidence.create({
        monthlySupport: KenyanMoney.create(props.monthlySupport),
        supportStartDate: props.supportStartDate ?? new Date(),
        supportEndDate: props.supportEndDate,
      });
    }

    // Build disability status if applicable
    let disabilityStatus: DisabilityStatus | undefined;
    if (props.hasPhysicalDisability || props.hasMentalDisability || props.requiresOngoingCare) {
      disabilityStatus = DisabilityStatus.create({
        hasPhysicalDisability: props.hasPhysicalDisability ?? false,
        hasMentalDisability: props.hasMentalDisability ?? false,
        requiresOngoingCare: props.requiresOngoingCare ?? false,
        disabilityDetails: props.disabilityDetails,
      });
    }

    // Build custodial parent ID
    let custodialParentId: UniqueEntityID | undefined;
    if (props.custodialParentId) {
      custodialParentId = new UniqueEntityID(props.custodialParentId);
    }

    const dependant = new LegalDependant(id, {
      deceasedId,
      dependantId,
      relationship: props.relationship,
      basisSection,
      assessment,
      supportEvidence,
      disabilityStatus,
      isMinor: props.isMinor,
      currentAge: props.currentAge,
      isStudent: props.isStudent ?? false,
      studentUntil: props.studentUntil,
      ageLimit: LegalDependant.determineAgeLimit(props.isMinor, props.isStudent ?? false),
      custodialParentId,
      isS26Claimant: false,
      s26ClaimStatus: S26ClaimStatus.NO_CLAIM,
      evidenceDocuments: [],
    });

    // Emit domain event
    dependant.addDomainEvent(
      new DependantDeclaredEvent(id.toString(), 'LegalDependant', 1, {
        legalDependantId: id.toString(),
        deceasedId: props.deceasedId,
        dependantId: props.dependantId,
        relationship: props.relationship,
        dependencyLevel,
        isMinor: props.isMinor,
        basisSection,
      }),
    );

    return dependant;
  }

  /**
   * Reconstitute from persistence
   */
  public static fromPersistence(
    id: string,
    props: LegalDependantProps,
    createdAt: Date,
  ): LegalDependant {
    return new LegalDependant(new UniqueEntityID(id), props, createdAt);
  }

  // ============================================================================
  // DOMAIN LOGIC - DEPENDENCY ASSESSMENT
  // ============================================================================

  /**
   * Assess Financial Dependency
   *
   * KENYAN CONTEXT:
   * - Calculates dependency percentage from evidence
   * - Updates dependency level (NONE, PARTIAL, FULL)
   * - Required for S.29(b) conditional dependants
   *
   * @throws InvalidDependantException if evidence insufficient
   */
  public assessFinancialDependency(params: {
    monthlySupport: number;
    deceasedMonthlyIncome: number;
    assessmentMethod: string;
    evidenceDocuments?: string[];
  }): void {
    this.ensureNotDeleted();

    // Build support evidence
    const supportEvidence = SupportEvidence.create({
      monthlySupport: KenyanMoney.create(params.monthlySupport),
      supportStartDate: this.props.supportEvidence?.supportStartDate ?? new Date(),
      supportEndDate: this.props.supportEvidence?.supportEndDate,
    });

    // Calculate dependency ratio
    const dependencyRatio = params.monthlySupport / params.deceasedMonthlyIncome;
    const dependencyPercentage = Math.min(dependencyRatio * 100, 100);

    // Update assessment
    const newAssessment = this.props.assessment.updateAssessment({
      dependencyPercentage,
      assessmentMethod: params.assessmentMethod,
      monthlySupport: params.monthlySupport,
      dependencyRatio,
    });

    // Add evidence documents
    const evidenceDocs = params.evidenceDocuments ?? [];

    const newProps = {
      ...this.cloneProps(),
      assessment: newAssessment,
      supportEvidence,
      evidenceDocuments: [...this.props.evidenceDocuments, ...evidenceDocs],
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new DependencyAssessedEvent(this._id.toString(), 'LegalDependant', this._version, {
        legalDependantId: this._id.toString(),
        dependencyPercentage,
        dependencyLevel: newAssessment.dependencyLevel,
        monthlySupport: params.monthlySupport,
        dependencyRatio,
        assessmentMethod: params.assessmentMethod,
      }),
    );
  }

  /**
   * Add Evidence Document
   *
   * EVIDENCE TYPES:
   * - Birth certificates (for children)
   * - School records (for students)
   * - Medical records (for disabled)
   * - Bank statements (for financial support)
   * - Witness affidavits (for cohabitation)
   */
  public addEvidenceDocument(documentId: string): void {
    this.ensureNotDeleted();

    if (this.props.evidenceDocuments.includes(documentId)) {
      return; // Already added
    }

    const newProps = {
      ...this.cloneProps(),
      evidenceDocuments: [...this.props.evidenceDocuments, documentId],
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Verify Evidence (Court/Administrator)
   *
   * KENYAN PRACTICE:
   * - Court officer or estate administrator reviews evidence
   * - Confirms dependency claim is valid
   * - Required before distribution
   */
  public verifyEvidence(params: {
    verifiedBy: string;
    verificationMethod: string;
    verificationDate: Date;
  }): void {
    this.ensureNotDeleted();

    if (this.props.evidenceDocuments.length === 0) {
      throw new InvalidDependantException('Cannot verify evidence - no documents provided');
    }

    const newProps = {
      ...this.cloneProps(),
      verifiedAt: params.verificationDate,
      verifiedBy: new UniqueEntityID(params.verifiedBy),
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new DependantEvidenceVerifiedEvent(this._id.toString(), 'LegalDependant', this._version, {
        legalDependantId: this._id.toString(),
        verifiedBy: params.verifiedBy,
        verificationMethod: params.verificationMethod,
        documentCount: this.props.evidenceDocuments.length,
      }),
    );
  }

  // ============================================================================
  // DOMAIN LOGIC - S.26 COURT PROVISION
  // ============================================================================

  /**
   * File S.26 Claim for Court Provision
   *
   * KENYAN LAW (S.26 LSA):
   * "The court may order reasonable provision to be made
   * out of the deceased's estate for the maintenance of
   * any of the following persons who are not otherwise
   * dependants..."
   *
   * WHO CAN CLAIM:
   * - Ex-spouses
   * - Long-term cohabitors (not married)
   * - Other persons who were dependent
   *
   * @throws InvalidDependantException if already automatic dependant
   */
  public fileS26Claim(params: {
    claimAmount: number;
    claimBasis: string;
    supportingEvidence: string[];
  }): void {
    this.ensureNotDeleted();

    // INVARIANT: Cannot file S.26 claim if automatic dependant
    if (this.isPriorityDependant()) {
      throw new InvalidDependantException(
        'Priority dependants (spouse/child) cannot file S.26 claims - they are automatic dependants under S.29(a)',
      );
    }

    if (params.claimAmount <= 0) {
      throw new InvalidDependantException('S.26 claim amount must be positive');
    }

    const claimAmount = KenyanMoney.create(params.claimAmount);

    const newProps = {
      ...this.cloneProps(),
      isS26Claimant: true,
      s26ClaimAmount: claimAmount,
      s26ClaimStatus: S26ClaimStatus.PENDING,
      basisSection: KenyanLawSection.S26_DEPENDANT_PROVISION,
      evidenceDocuments: [...this.props.evidenceDocuments, ...params.supportingEvidence],
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new S26ClaimFiledEvent(this._id.toString(), 'LegalDependant', this._version, {
        legalDependantId: this._id.toString(),
        claimAmount: params.claimAmount,
        claimBasis: params.claimBasis,
        evidenceCount: params.supportingEvidence.length,
      }),
    );
  }

  /**
   * Record Court Provision Order (S.26 Outcome)
   *
   * COURT DISCRETION:
   * - May grant full amount claimed
   * - May grant partial amount
   * - May deny claim entirely
   */
  public recordCourtProvision(params: {
    courtOrderNumber: string;
    courtStation: string;
    orderDate: Date;
    approvedAmount: number;
    provisionType: string;
  }): void {
    this.ensureNotDeleted();

    if (!this.props.isS26Claimant) {
      throw new InvalidDependantException('Cannot record court provision - no S.26 claim filed');
    }

    const courtOrder = CourtOrder.create({
      orderNumber: params.courtOrderNumber,
      courtStation: params.courtStation,
      orderDate: params.orderDate,
      orderType: 'S26_PROVISION',
    });

    const provisionAmount = KenyanMoney.create(params.approvedAmount);

    // Determine claim status
    let claimStatus: S26ClaimStatus;
    if (params.approvedAmount === 0) {
      claimStatus = S26ClaimStatus.DENIED;
    } else if (this.props.s26ClaimAmount && provisionAmount.isLessThan(this.props.s26ClaimAmount)) {
      claimStatus = S26ClaimStatus.PARTIALLY_APPROVED;
    } else {
      claimStatus = S26ClaimStatus.APPROVED;
    }

    // Update assessment if approved
    let newAssessment = this.props.assessment;
    if (params.approvedAmount > 0) {
      newAssessment = this.props.assessment.updateAssessment({
        dependencyPercentage: 100, // Court mandated
        assessmentMethod: 'COURT_ORDERED',
      });
    }

    const newProps = {
      ...this.cloneProps(),
      s26CourtOrder: courtOrder,
      s26ProvisionAmount: provisionAmount,
      s26ClaimStatus: claimStatus,
      assessment: newAssessment,
      verifiedAt: params.orderDate,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();

    this.addDomainEvent(
      new CourtProvisionOrderedEvent(this._id.toString(), 'LegalDependant', this._version, {
        legalDependantId: this._id.toString(),
        courtOrderNumber: params.courtOrderNumber,
        claimedAmount: this.props.s26ClaimAmount?.getAmount() ?? 0,
        approvedAmount: params.approvedAmount,
        provisionType: params.provisionType,
        orderDate: params.orderDate,
      }),
    );
  }

  // ============================================================================
  // DOMAIN LOGIC - STATUS UPDATES
  // ============================================================================

  /**
   * Update Student Status
   *
   * KENYAN PRACTICE:
   * - Students can claim dependency until 25 (if in school)
   * - Must provide proof of enrollment
   * - Dependency ends upon graduation or age 25
   */
  public updateStudentStatus(params: {
    isStudent: boolean;
    studentUntil?: Date;
    institutionName?: string;
  }): void {
    this.ensureNotDeleted();

    const newAgeLimit = params.isStudent ? 25 : 18;

    const newProps = {
      ...this.cloneProps(),
      isStudent: params.isStudent,
      studentUntil: params.studentUntil,
      ageLimit: newAgeLimit,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Update Disability Status
   *
   * S.29(2) LSA:
   * Extended dependency rights for disabled dependants
   */
  public updateDisabilityStatus(params: {
    hasPhysicalDisability: boolean;
    hasMentalDisability: boolean;
    requiresOngoingCare: boolean;
    disabilityDetails?: string;
    medicalCertificate?: string;
  }): void {
    this.ensureNotDeleted();

    const disabilityStatus = DisabilityStatus.create({
      hasPhysicalDisability: params.hasPhysicalDisability,
      hasMentalDisability: params.hasMentalDisability,
      requiresOngoingCare: params.requiresOngoingCare,
      disabilityDetails: params.disabilityDetails,
      medicalCertificateId: params.medicalCertificate,
    });

    const newProps = {
      ...this.cloneProps(),
      disabilityStatus,
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  /**
   * Update Custodial Parent (for minors)
   */
  public updateCustodialParent(custodialParentId: string): void {
    this.ensureNotDeleted();

    if (!this.props.isMinor) {
      throw new InvalidDependantException('Custodial parent only applicable for minors');
    }

    const newProps = {
      ...this.cloneProps(),
      custodialParentId: new UniqueEntityID(custodialParentId),
    };

    (this as any)._props = Object.freeze(newProps);
    this.incrementVersion();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Determine legal basis (LSA section) and dependency level
   */
  private static determineLegalBasis(
    relationship: DependencyRelationship,
    isMinor: boolean,
  ): { basisSection: KenyanLawSection; dependencyLevel: DependencyLevel } {
    // S.29(a) - Automatic dependants
    if (
      [
        DependencyRelationship.SPOUSE,
        DependencyRelationship.CHILD,
        DependencyRelationship.ADOPTED_CHILD,
      ].includes(relationship)
    ) {
      return {
        basisSection: KenyanLawSection.S29_DEPENDANTS,
        dependencyLevel: DependencyLevel.FULL,
      };
    }

    // S.26 - Court provision only
    if (
      [DependencyRelationship.EX_SPOUSE, DependencyRelationship.COHABITOR].includes(relationship)
    ) {
      return {
        basisSection: KenyanLawSection.S26_DEPENDANT_PROVISION,
        dependencyLevel: DependencyLevel.NONE, // Must prove
      };
    }

    // S.29(b) - Conditional dependants
    return {
      basisSection: KenyanLawSection.S29_DEPENDANTS,
      dependencyLevel: isMinor ? DependencyLevel.FULL : DependencyLevel.PARTIAL,
    };
  }

  /**
   * Calculate default dependency percentage
   */
  private static calculateDefaultPercentage(level: DependencyLevel): number {
    switch (level) {
      case DependencyLevel.FULL:
        return 100;
      case DependencyLevel.PARTIAL:
        return 50;
      case DependencyLevel.NONE:
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Determine age limit for dependency
   */
  private static determineAgeLimit(isMinor: boolean, isStudent: boolean): number {
    if (isStudent) return 25; // Students until 25
    if (isMinor) return 18; // Minors until 18
    return 0; // Adults - no age limit
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validate(): void {
    // INVARIANT: Cannot be own dependant
    if (this.props.deceasedId.equals(this.props.dependantId)) {
      throw new InvalidDependantException('A person cannot be a dependant of themselves');
    }

    // INVARIANT: Minors must have custodial parent
    if (this.props.isMinor && !this.props.custodialParentId) {
      console.warn(
        `Minor dependant ${this._id.toString()} should have custodial parent identified`,
      );
    }

    // INVARIANT: S.26 claimants must have claim amount
    if (this.props.isS26Claimant && !this.props.s26ClaimAmount) {
      throw new InvalidDependantException('S.26 claimants must have claim amount');
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  get deceasedId(): UniqueEntityID {
    return this.props.deceasedId;
  }

  get dependantId(): UniqueEntityID {
    return this.props.dependantId;
  }

  get relationship(): DependencyRelationship {
    return this.props.relationship;
  }

  get basisSection(): KenyanLawSection {
    return this.props.basisSection;
  }

  /**
   * Check if priority dependant (automatic under S.29(a))
   */
  public isPriorityDependant(): boolean {
    return [
      DependencyRelationship.SPOUSE,
      DependencyRelationship.CHILD,
      DependencyRelationship.ADOPTED_CHILD,
    ].includes(this.props.relationship);
  }

  /**
   * Check if qualifies under S.29
   */
  public qualifiesForS29(): boolean {
    // Priority dependants always qualify
    if (this.isPriorityDependant()) return true;

    // Proven dependency
    if (this.props.assessment.dependencyPercentage > 0) return true;

    // Disability requiring care
    if (this.props.disabilityStatus?.requiresOngoingCare) return true;

    // Minors or students
    if (this.props.isMinor || this.props.isStudent) return true;

    return false;
  }

  /**
   * Get dependency assessment
   */
  public getAssessment(): DependencyAssessment {
    return this.props.assessment;
  }

  /**
   * Get support evidence
   */
  public getSupportEvidence(): SupportEvidence | undefined {
    return this.props.supportEvidence;
  }

  /**
   * Get disability status
   */
  public getDisabilityStatus(): DisabilityStatus | undefined {
    return this.props.disabilityStatus;
  }

  /**
   * Check if evidence verified
   */
  public isEvidenceVerified(): boolean {
    return !!this.props.verifiedAt;
  }

  /**
   * Get S.26 claim status
   */
  public getS26ClaimStatus(): S26ClaimStatus {
    return this.props.s26ClaimStatus;
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): Record<string, any> {
    return {
      id: this._id.toString(),
      deceasedId: this.props.deceasedId.toString(),
      dependantId: this.props.dependantId.toString(),
      relationship: this.props.relationship,
      basisSection: this.props.basisSection,
      assessment: this.props.assessment.toJSON(),
      supportEvidence: this.props.supportEvidence?.toJSON(),
      disabilityStatus: this.props.disabilityStatus?.toJSON(),
      isMinor: this.props.isMinor,
      currentAge: this.props.currentAge,
      isStudent: this.props.isStudent,
      studentUntil: this.props.studentUntil?.toISOString(),
      ageLimit: this.props.ageLimit,
      custodialParentId: this.props.custodialParentId?.toString(),
      isS26Claimant: this.props.isS26Claimant,
      s26ClaimAmount: this.props.s26ClaimAmount?.toJSON(),
      s26ClaimStatus: this.props.s26ClaimStatus,
      s26CourtOrder: this.props.s26CourtOrder?.toJSON(),
      s26ProvisionAmount: this.props.s26ProvisionAmount?.toJSON(),
      evidenceDocuments: this.props.evidenceDocuments,
      verifiedAt: this.props.verifiedAt?.toISOString(),
      verifiedBy: this.props.verifiedBy?.toString(),

      // Computed properties
      isPriorityDependant: this.isPriorityDependant(),
      qualifiesForS29: this.qualifiesForS29(),
      isEvidenceVerified: this.isEvidenceVerified(),

      // Metadata
      version: this._version,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      deletedAt: this._deletedAt?.toISOString(),
    };
  }
}
