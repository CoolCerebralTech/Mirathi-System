import { DependencyLevel } from '@prisma/client';
import { KenyanLawSection } from '@prisma/client';

import { Entity } from '../base/entity';
import { CourtProvisionOrderedEvent } from '../events/dependency-events/court-provision-ordered.event';
import { DependantDeclaredEvent } from '../events/dependency-events/dependant-declared.event';
import { DependantEvidenceVerifiedEvent } from '../events/dependency-events/dependant-evidence-verified.event';
import { DependencyAssessedEvent } from '../events/dependency-events/dependency-assessed.event';
import { InvalidDependantException } from '../exceptions/dependant.exception';

export interface LegalDependantProps {
  id: string;
  deceasedId: string;
  dependantId: string;

  // Legal basis
  basisSection?: KenyanLawSection;

  // Dependency basis and level
  dependencyBasis: string;
  dependencyLevel: DependencyLevel;
  isMinor: boolean;

  // S.26 Court provision tracking
  isClaimant: boolean;
  claimAmount?: number;
  provisionAmount?: number;
  currency: string;
  courtOrderReference?: string;
  courtOrderDate?: Date;

  // Financial dependency evidence
  monthlySupport?: number;
  supportStartDate?: Date;
  supportEndDate?: Date;

  // Dependency calculation
  assessmentDate: Date;
  assessmentMethod?: string;
  dependencyPercentage: number;

  // Age & circumstances
  ageLimit?: number;
  isStudent: boolean;
  studentUntil?: Date;

  // Custodial parent (for minors)
  custodialParentId?: string;

  // Court proceedings
  provisionOrderIssued: boolean;
  provisionOrderNumber?: string;
  courtApprovedAmount?: number;

  // Computed fields
  monthlySupportEvidence?: number;
  dependencyRatio?: number;

  // Special circumstances (S. 29(2) LSA)
  hasPhysicalDisability: boolean;
  hasMentalDisability: boolean;
  requiresOngoingCare: boolean;
  disabilityDetails?: string;

  // Verification
  dependencyProofDocuments?: any[]; // Explicit array type
  verifiedByCourtAt?: Date;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLegalDependantProps {
  deceasedId: string;
  dependantId: string;
  dependencyBasis: string;
  isMinor: boolean;

  // Dependency details
  dependencyLevel?: DependencyLevel;
  isStudent?: boolean;
  hasPhysicalDisability?: boolean;
  hasMentalDisability?: boolean;
  requiresOngoingCare?: boolean;
  disabilityDetails?: string;

  // Financial details (optional at creation)
  monthlySupport?: number;
  supportStartDate?: Date;
  supportEndDate?: Date;

  // Assessment details
  assessmentMethod?: string;
  dependencyPercentage?: number;

  // Custodial parent (for minors)
  custodialParentId?: string;
}

export class LegalDependant extends Entity<LegalDependantProps> {
  private constructor(props: LegalDependantProps) {
    super(props.id, props);
    this.validate();
  }

  static create(props: CreateLegalDependantProps): LegalDependant {
    const id = this.generateId();
    const now = new Date();

    // Determine appropriate law section based on dependency basis
    let basisSection: KenyanLawSection = KenyanLawSection.S29_DEPENDANTS;

    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(props.dependencyBasis)) {
      basisSection = KenyanLawSection.S29_DEPENDANTS; // Section 29 for dependants
    } else if (props.dependencyBasis === 'EX_SPOUSE' || props.dependencyBasis === 'COHABITOR') {
      basisSection = KenyanLawSection.S26_DEPENDANT_PROVISION; // Section 26 for court provision
    }

    // Determine dependency level if not provided
    let dependencyLevel = props.dependencyLevel || DependencyLevel.NONE;
    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(props.dependencyBasis)) {
      // Spouses and Children are automatic dependants under S.29(a)
      dependencyLevel = DependencyLevel.FULL;
    } else if (props.dependencyBasis === 'PARENT' || props.dependencyBasis === 'SIBLING') {
      // Parents, Siblings, etc., are conditional under S.29(b)
      dependencyLevel = DependencyLevel.PARTIAL;
    }

    // Calculate dependency percentage if not provided
    let dependencyPercentage = props.dependencyPercentage || 100;
    if (dependencyLevel === DependencyLevel.PARTIAL) {
      dependencyPercentage = 50; // Default for partial dependants
    } else if (dependencyLevel === DependencyLevel.FULL) {
      dependencyPercentage = 100;
    }

    const dependant = new LegalDependant({
      id,
      deceasedId: props.deceasedId,
      dependantId: props.dependantId,
      basisSection,
      dependencyBasis: props.dependencyBasis,
      dependencyLevel,
      isMinor: props.isMinor,
      isClaimant: false,
      currency: 'KES',
      provisionOrderIssued: false,
      monthlySupport: props.monthlySupport,
      supportStartDate: props.supportStartDate,
      supportEndDate: props.supportEndDate,
      assessmentDate: now,
      assessmentMethod: props.assessmentMethod,
      dependencyPercentage,
      isStudent: props.isStudent || false,
      custodialParentId: props.custodialParentId,
      hasPhysicalDisability: props.hasPhysicalDisability || false,
      hasMentalDisability: props.hasMentalDisability || false,
      requiresOngoingCare: props.requiresOngoingCare || false,
      disabilityDetails: props.disabilityDetails,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    dependant.addDomainEvent(
      new DependantDeclaredEvent({
        legalDependantId: id,
        deceasedId: props.deceasedId,
        dependantId: props.dependantId,
        dependencyBasis: props.dependencyBasis,
        dependencyLevel,
        isMinor: props.isMinor,
      }),
    );

    // Emit dependency assessed event if there's financial information
    if (props.monthlySupport) {
      dependant.emitDependencyAssessedEvent();
    }

    return dependant;
  }

  static createFromProps(props: LegalDependantProps): LegalDependant {
    return new LegalDependant(props);
  }

  // --- Domain Logic ---

  assessFinancialDependency(params: {
    monthlySupportEvidence: number;
    dependencyRatio: number;
    dependencyPercentage: number;
    assessmentMethod: string;
  }): void {
    this.props.monthlySupportEvidence = params.monthlySupportEvidence;
    this.props.dependencyRatio = params.dependencyRatio;
    this.props.dependencyPercentage = params.dependencyPercentage;
    this.props.assessmentMethod = params.assessmentMethod;
    this.props.assessmentDate = new Date();

    // Update dependency level based on percentage
    if (params.dependencyPercentage >= 75) {
      this.props.dependencyLevel = DependencyLevel.FULL;
    } else if (params.dependencyPercentage >= 25) {
      this.props.dependencyLevel = DependencyLevel.PARTIAL;
    } else {
      this.props.dependencyLevel = DependencyLevel.NONE;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.emitDependencyAssessedEvent();
  }

  private emitDependencyAssessedEvent(): void {
    this.addDomainEvent(
      new DependencyAssessedEvent({
        legalDependantId: this.id,
        dependencyPercentage: this.props.dependencyPercentage,
        dependencyLevel: this.props.dependencyLevel,
        monthlySupportEvidence: this.props.monthlySupportEvidence,
        dependencyRatio: this.props.dependencyRatio,
      }),
    );
  }

  updateSupportDetails(params: {
    monthlySupport?: number;
    supportStartDate?: Date;
    supportEndDate?: Date;
  }): void {
    if (params.monthlySupport !== undefined) {
      this.props.monthlySupport = params.monthlySupport;
    }
    if (params.supportStartDate !== undefined) {
      this.props.supportStartDate = params.supportStartDate;
    }
    if (params.supportEndDate !== undefined) {
      this.props.supportEndDate = params.supportEndDate;
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  addEvidence(documentId: string, evidenceType: string): void {
    if (!this.props.dependencyProofDocuments) {
      this.props.dependencyProofDocuments = [];
    }

    // Add document to proof documents
    const evidence = {
      documentId,
      evidenceType,
      addedAt: new Date(),
    };

    this.props.dependencyProofDocuments.push(evidence);
    this.props.updatedAt = new Date();
    this.props.version++;

    // Note: Actual verification happens via a separate service/workflow
  }

  verifyEvidence(verifierId: string, verificationMethod: string): void {
    this.props.verifiedByCourtAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new DependantEvidenceVerifiedEvent({
        legalDependantId: this.id,
        verifiedBy: verifierId,
        verificationMethod,
      }),
    );
  }

  fileSection26Claim(amount: number, currency: string = 'KES'): void {
    if (amount <= 0) {
      throw new InvalidDependantException('Claim amount must be positive.');
    }

    this.props.isClaimant = true;
    this.props.claimAmount = amount;
    this.props.currency = currency;
    this.props.basisSection = KenyanLawSection.S26_DEPENDANT_PROVISION;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  recordCourtProvision(params: {
    orderNumber: string;
    approvedAmount: number;
    provisionType: string;
    orderDate: Date;
  }): void {
    this.props.provisionOrderIssued = true;
    this.props.provisionOrderNumber = params.orderNumber;
    this.props.courtOrderReference = params.orderNumber;
    this.props.courtOrderDate = params.orderDate;
    this.props.courtApprovedAmount = params.approvedAmount;
    this.props.provisionAmount = params.approvedAmount;
    this.props.verifiedByCourtAt = new Date();

    // Update dependency level to FULL if court mandates provision
    if (params.approvedAmount > 0) {
      this.props.dependencyLevel = DependencyLevel.FULL;
      this.props.dependencyPercentage = 100;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CourtProvisionOrderedEvent({
        legalDependantId: this.id,
        courtOrderNumber: params.orderNumber,
        amount: params.approvedAmount,
        provisionType: params.provisionType,
        orderDate: params.orderDate,
      }),
    );
  }

  updateStudentStatus(isStudent: boolean, studentUntil?: Date): void {
    this.props.isStudent = isStudent;
    if (studentUntil) {
      this.props.studentUntil = studentUntil;
      // Set age limit based on student status (typically 25 for students)
      this.props.ageLimit = 25;
    }
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateDisabilityStatus(params: {
    hasPhysicalDisability: boolean;
    hasMentalDisability: boolean;
    requiresOngoingCare: boolean;
    disabilityDetails?: string;
  }): void {
    this.props.hasPhysicalDisability = params.hasPhysicalDisability;
    this.props.hasMentalDisability = params.hasMentalDisability;
    this.props.requiresOngoingCare = params.requiresOngoingCare;
    if (params.disabilityDetails) {
      this.props.disabilityDetails = params.disabilityDetails;
    }
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  updateCustodialParent(custodialParentId: string): void {
    this.props.custodialParentId = custodialParentId;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  private validate(): void {
    if (this.props.deceasedId === this.props.dependantId) {
      throw new InvalidDependantException('A person cannot be a dependant of themselves.');
    }

    // Validation for age limit and student status
    if (this.props.isStudent && !this.props.studentUntil && !this.props.isMinor) {
      console.warn('Warning: Students over 18 typically need proof of enrollment duration');
    }

    // Validation for dependency percentage
    if (this.props.dependencyPercentage < 0 || this.props.dependencyPercentage > 100) {
      throw new InvalidDependantException('Dependency percentage must be between 0 and 100.');
    }

    // Validation for support dates
    if (this.props.supportStartDate && this.props.supportEndDate) {
      if (this.props.supportStartDate > this.props.supportEndDate) {
        throw new InvalidDependantException('Support start date cannot be after end date.');
      }
    }

    // Validation for S.26 claim
    if (this.props.isClaimant && (!this.props.claimAmount || this.props.claimAmount <= 0)) {
      throw new InvalidDependantException('Claim amount must be positive for S.26 claimants.');
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get deceasedId(): string {
    return this.props.deceasedId;
  }

  get dependantId(): string {
    return this.props.dependantId;
  }

  get dependencyBasis(): string {
    return this.props.dependencyBasis;
  }

  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }

  get dependencyPercentage(): number {
    return this.props.dependencyPercentage;
  }

  get isMinor(): boolean {
    return this.props.isMinor;
  }

  get isStudent(): boolean {
    return this.props.isStudent;
  }

  get isClaimant(): boolean {
    return this.props.isClaimant;
  }

  get hasCourtOrder(): boolean {
    return this.props.provisionOrderIssued;
  }

  get hasDisability(): boolean {
    return this.props.hasPhysicalDisability || this.props.hasMentalDisability;
  }

  get requiresOngoingCare(): boolean {
    return this.props.requiresOngoingCare;
  }

  get monthlySupport(): number | undefined {
    return this.props.monthlySupport;
  }

  get courtApprovedAmount(): number | undefined {
    return this.props.courtApprovedAmount;
  }

  get provisionAmount(): number | undefined {
    return this.props.provisionAmount;
  }

  get assessmentDate(): Date {
    return this.props.assessmentDate;
  }

  get custodialParentId(): string | undefined {
    return this.props.custodialParentId;
  }

  get verifiedByCourtAt(): Date | undefined {
    return this.props.verifiedByCourtAt;
  }

  // Fixed the type to remove 'any'
  get dependencyProofDocuments(): any[] | undefined {
    return this.props.dependencyProofDocuments;
  }

  get isPriorityDependant(): boolean {
    return ['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(this.props.dependencyBasis);
  }

  get qualifiesForS29(): boolean {
    // Qualifies under S.29 if:
    // 1. Is a priority dependant (spouse/child), OR
    // 2. Has proven dependency (percentage > 0), OR
    // 3. Has disability requiring ongoing care, OR
    // 4. Is a minor or student

    if (this.isPriorityDependant) return true;
    if (this.props.dependencyPercentage > 0) return true;
    if (this.hasDisability && this.props.requiresOngoingCare) return true;
    if (this.props.isMinor || this.props.isStudent) return true;

    return false;
  }

  get s26ClaimStatus(): 'NO_CLAIM' | 'PENDING' | 'APPROVED' | 'DENIED' {
    if (!this.props.isClaimant) return 'NO_CLAIM';
    if (this.props.provisionOrderIssued && this.props.courtApprovedAmount) return 'APPROVED';
    if (this.props.provisionOrderIssued && !this.props.courtApprovedAmount) return 'DENIED';
    return 'PENDING';
  }

  toJSON() {
    return {
      id: this.id,
      deceasedId: this.props.deceasedId,
      dependantId: this.props.dependantId,
      basisSection: this.props.basisSection,
      dependencyBasis: this.props.dependencyBasis,
      dependencyLevel: this.props.dependencyLevel,
      dependencyPercentage: this.props.dependencyPercentage,
      isMinor: this.props.isMinor,
      isStudent: this.props.isStudent,
      studentUntil: this.props.studentUntil,
      hasPhysicalDisability: this.props.hasPhysicalDisability,
      hasMentalDisability: this.props.hasMentalDisability,
      requiresOngoingCare: this.props.requiresOngoingCare,
      disabilityDetails: this.props.disabilityDetails,
      isClaimant: this.props.isClaimant,
      claimAmount: this.props.claimAmount,
      provisionAmount: this.props.provisionAmount,
      currency: this.props.currency,
      courtOrderReference: this.props.courtOrderReference,
      courtOrderDate: this.props.courtOrderDate,
      monthlySupport: this.props.monthlySupport,
      supportStartDate: this.props.supportStartDate,
      supportEndDate: this.props.supportEndDate,
      assessmentDate: this.props.assessmentDate,
      assessmentMethod: this.props.assessmentMethod,
      ageLimit: this.props.ageLimit,
      custodialParentId: this.props.custodialParentId,
      provisionOrderIssued: this.props.provisionOrderIssued,
      provisionOrderNumber: this.props.provisionOrderNumber,
      courtApprovedAmount: this.props.courtApprovedAmount,
      monthlySupportEvidence: this.props.monthlySupportEvidence,
      dependencyRatio: this.props.dependencyRatio,
      dependencyProofDocuments: this.props.dependencyProofDocuments,
      verifiedByCourtAt: this.props.verifiedByCourtAt,
      isPriorityDependant: this.isPriorityDependant,
      qualifiesForS29: this.qualifiesForS29,
      s26ClaimStatus: this.s26ClaimStatus,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
