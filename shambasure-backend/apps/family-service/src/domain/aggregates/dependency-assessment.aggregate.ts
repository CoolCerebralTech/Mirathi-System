import { DependencyLevel, KenyanLawSection } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { CourtProvisionOrderedEvent } from '../events/dependency-events/court-provision-ordered.event';
import { DependantDeclaredEvent } from '../events/dependency-events/dependant-declared.event';
import { DependantEvidenceVerifiedEvent } from '../events/dependency-events/dependant-evidence-verified.event';
import { DependencyAssessedEvent } from '../events/dependency-events/dependency-assessed.event';
import { S26ClaimFiledEvent } from '../events/dependency-events/s26-claim-filed.event';
import {
  DependencyDomainException,
  InvalidDependantException,
} from '../exceptions/dependant.exception';

export interface DependencyAssessmentProps {
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
  dependencyProofDocuments?: any[];
  verifiedByCourtAt?: Date;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDependencyAssessmentProps {
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

/**
 * DependencyAssessmentAggregate
 *
 * Manages the lifecycle of a Section 29 / Section 26 Claim.
 * Invariants:
 * 1. S.29(b) dependants (Parents/Siblings) must provide financial evidence to be "FULL" or "PARTIAL".
 * 2. Court Orders (S.27/28) override any manual calculation.
 * 3. Claims must be supported by evidence documents before finalization.
 */
export class DependencyAssessmentAggregate extends AggregateRoot<DependencyAssessmentProps> {
  private constructor(props: DependencyAssessmentProps) {
    super(props.id, props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(props: CreateDependencyAssessmentProps): DependencyAssessmentAggregate {
    const id = this.generateId();
    const now = new Date();

    // Determine appropriate law section based on dependency basis
    let basisSection: KenyanLawSection = KenyanLawSection.S29_DEPENDANTS;

    if (['SPOUSE', 'CHILD', 'ADOPTED_CHILD'].includes(props.dependencyBasis)) {
      basisSection = KenyanLawSection.S29_DEPENDANTS;
    } else if (props.dependencyBasis === 'EX_SPOUSE' || props.dependencyBasis === 'COHABITOR') {
      basisSection = KenyanLawSection.S26_DEPENDANT_PROVISION;
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

    const assessmentProps: DependencyAssessmentProps = {
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
    };

    const aggregate = new DependencyAssessmentAggregate(assessmentProps);

    aggregate.addDomainEvent(
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
      aggregate.emitDependencyAssessedEvent();
    }

    return aggregate;
  }

  static createFromProps(props: DependencyAssessmentProps): DependencyAssessmentAggregate {
    return new DependencyAssessmentAggregate(props);
  }

  // --- Domain Logic ---

  assessFinancialDependency(params: {
    monthlySupportEvidence: number;
    dependencyRatio: number;
    dependencyPercentage: number;
    assessmentMethod: string;
  }): void {
    if (this.props.provisionOrderIssued) {
      throw new InvalidDependantException(
        'Cannot reassess financial dependency after court provision order is issued.',
      );
    }

    if (params.monthlySupportEvidence < 0) {
      throw new InvalidDependantException('Monthly support evidence cannot be negative.');
    }

    if (params.dependencyRatio < 0 || params.dependencyRatio > 1) {
      throw new InvalidDependantException('Dependency ratio must be between 0 and 1.');
    }

    if (params.dependencyPercentage < 0 || params.dependencyPercentage > 100) {
      throw new InvalidDependantException('Dependency percentage must be between 0 and 100.');
    }

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
      if (params.monthlySupport < 0) {
        throw new InvalidDependantException('Monthly support cannot be negative.');
      }
      this.props.monthlySupport = params.monthlySupport;
    }

    if (params.supportStartDate !== undefined) {
      this.props.supportStartDate = params.supportStartDate;
    }

    if (params.supportEndDate !== undefined) {
      this.props.supportEndDate = params.supportEndDate;
    }

    // Validate support dates
    if (this.props.supportStartDate && this.props.supportEndDate) {
      if (this.props.supportStartDate > this.props.supportEndDate) {
        throw new InvalidDependantException('Support start date cannot be after end date.');
      }
    }

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  addEvidence(documentId: string, evidenceType: string): void {
    if (!this.props.dependencyProofDocuments) {
      this.props.dependencyProofDocuments = [];
    }

    // Check if evidence already exists
    const existingEvidence = this.props.dependencyProofDocuments.find(
      (evidence) => evidence.documentId === documentId,
    );
    if (existingEvidence) {
      return; // Idempotency
    }

    // Add document to proof documents
    const evidence = {
      documentId,
      evidenceType,
      addedAt: new Date(),
      verified: false,
    };

    this.props.dependencyProofDocuments.push(evidence);
    this.props.updatedAt = new Date();
    this.props.version++;

    // Note: Actual verification happens via a separate service/workflow
  }

  verifyEvidence(verifierId: string, verificationMethod: string): void {
    if (!this.props.dependencyProofDocuments || this.props.dependencyProofDocuments.length === 0) {
      throw new InvalidDependantException('No evidence documents to verify.');
    }

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

    if (this.props.isClaimant) {
      throw new InvalidDependantException('S.26 claim has already been filed.');
    }

    this.props.isClaimant = true;
    this.props.claimAmount = amount;
    this.props.currency = currency;
    this.props.basisSection = KenyanLawSection.S26_DEPENDANT_PROVISION;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new S26ClaimFiledEvent({
        legalDependantId: this.id,
        amount,
        currency,
        timestamp: new Date(),
      }),
    );
  }

  recordCourtProvision(params: {
    orderNumber: string;
    approvedAmount: number;
    provisionType: string;
    orderDate: Date;
  }): void {
    if (params.approvedAmount < 0) {
      throw new InvalidDependantException('Court approved amount cannot be negative.');
    }

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
    } else {
      this.props.dependencyLevel = DependencyLevel.NONE;
      this.props.dependencyPercentage = 0;
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
    if (isStudent && !studentUntil && !this.props.isMinor) {
      throw new InvalidDependantException(
        'Students over 18 must provide expected graduation/end date.',
      );
    }

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
    if (!this.props.isMinor) {
      throw new InvalidDependantException('Custodial parent can only be set for minors.');
    }

    this.props.custodialParentId = custodialParentId;
    this.props.updatedAt = new Date();
    this.props.version++;
  }

  calculateFinancialDegree(
    monthlyNeeds: number,
    monthlyContributionFromDeceased: number,
    totalDeceasedIncome: number,
  ): void {
    if (this.props.provisionOrderIssued) {
      // Court order exists - manual calculation is irrelevant/illegal to apply now
      throw new InvalidDependantException(
        'Cannot calculate financial dependency after court provision order is issued.',
      );
    }

    if (monthlyNeeds <= 0 || monthlyContributionFromDeceased < 0 || totalDeceasedIncome <= 0) {
      throw new InvalidDependantException(
        'Monthly needs, monthly contribution, and total deceased income must be positive.',
      );
    }

    // Calculate dependency ratio
    const dependencyRatio = monthlyContributionFromDeceased / monthlyNeeds;
    const dependencyPercentage = Math.min(dependencyRatio * 100, 100);

    // Determine Level based on Ratio (Domain Rule)
    // > 80% support = FULL
    // > 20% support = PARTIAL
    // < 20% support = NONE (unless S.29(a) Spouse/Child)
    let level: DependencyLevel = DependencyLevel.NONE;

    if (this.isPriorityDependant) {
      // Spouses/Children default to at least PARTIAL even with low financial evidence
      level = dependencyRatio > 0.8 ? DependencyLevel.FULL : DependencyLevel.PARTIAL;
    } else {
      // Others (Parents, etc.) strictly math-based
      if (dependencyRatio > 0.8) level = DependencyLevel.FULL;
      else if (dependencyRatio > 0.2) level = DependencyLevel.PARTIAL;
    }

    this.props.dependencyRatio = dependencyRatio;
    this.props.dependencyPercentage = dependencyPercentage;
    this.props.dependencyLevel = level;
    this.props.monthlySupportEvidence = monthlyContributionFromDeceased;
    this.props.assessmentMethod = 'FINANCIAL_RATIO_ANALYSIS';
    this.props.assessmentDate = new Date();

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new DependencyAssessedEvent({
        legalDependantId: this.id,
        dependencyRatio,
        dependencyPercentage,
        dependencyLevel: level,
        monthlySupportEvidence: monthlyContributionFromDeceased,
      }),
    );
  }

  // --- Validation & Invariants ---

  private validate(): void {
    if (!this.props.id) {
      throw new DependencyDomainException('Dependency assessment ID is required');
    }

    if (!this.props.deceasedId) {
      throw new DependencyDomainException('Deceased ID is required');
    }

    if (!this.props.dependantId) {
      throw new DependencyDomainException('Dependant ID is required');
    }

    if (this.props.deceasedId === this.props.dependantId) {
      throw new DependencyDomainException('A person cannot be a dependant of themselves.');
    }

    // Validation for dependency percentage
    if (this.props.dependencyPercentage < 0 || this.props.dependencyPercentage > 100) {
      throw new DependencyDomainException('Dependency percentage must be between 0 and 100.');
    }

    // Validation for support dates
    if (this.props.supportStartDate && this.props.supportEndDate) {
      if (this.props.supportStartDate > this.props.supportEndDate) {
        throw new DependencyDomainException('Support start date cannot be after end date.');
      }
    }

    // Validation for S.26 claim
    if (this.props.isClaimant && (!this.props.claimAmount || this.props.claimAmount <= 0)) {
      throw new DependencyDomainException('Claim amount must be positive for S.26 claimants.');
    }

    // Court order validation
    if (this.props.provisionOrderIssued && !this.props.provisionOrderNumber) {
      throw new DependencyDomainException(
        'Provision order number is required when order is issued.',
      );
    }

    // Student validation
    if (this.props.isStudent && !this.props.isMinor && !this.props.studentUntil) {
      console.warn('Warning: Students over 18 typically need proof of enrollment duration');
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

  get isS29Compliant(): boolean {
    // S.29 compliance requires:
    // 1. Proper evidence for non-priority dependants
    // 2. Court order for S.26 claims
    // 3. No contradictions in dependency status

    if (this.props.provisionOrderIssued) {
      return true; // Court order overrides all
    }

    if (this.isPriorityDependant) {
      return true; // Priority dependants are automatically compliant
    }

    // Non-priority dependants need evidence
    if (this.props.dependencyProofDocuments && this.props.dependencyProofDocuments.length > 0) {
      return true;
    }

    if (this.props.dependencyPercentage > 0) {
      return true; // Has proven dependency
    }

    return false;
  }

  get financialDependencyRatio(): number | undefined {
    return this.props.dependencyRatio;
  }

  get monthlySupportEvidence(): number | undefined {
    return this.props.monthlySupportEvidence;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
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
      isS29Compliant: this.isS29Compliant,
      financialDependencyRatio: this.financialDependencyRatio,
      version: this.props.version,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
