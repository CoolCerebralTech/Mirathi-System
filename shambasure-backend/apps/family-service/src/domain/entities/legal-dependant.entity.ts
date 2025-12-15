// domain/entities/legal-dependant.entity.ts
import { Entity } from '../base/entity';
import { CourtProvisionOrderedEvent } from '../events/dependency-events/court-provision-ordered.event';
import { DependantDeclaredEvent } from '../events/dependency-events/dependant-declared.event';
import { DependantEvidenceVerifiedEvent } from '../events/dependency-events/dependant-evidence-verified.event';
import { DependencyAssessedEvent } from '../events/dependency-events/dependency-assessed.event';
import { InvalidDependantException } from '../exceptions/dependant.exception';
import { DependencyCalculation } from '../value-objects/financial/dependency-calculation.vo';
import { MonthlySupport } from '../value-objects/financial/monthly-support.vo';
import { DependencyLevel } from '../value-objects/legal/dependency-level.vo';
import { KenyanLawSection } from '../value-objects/legal/kenyan-law-section.vo';

export interface LegalDependantProps {
  id: string;
  deceasedId: string;
  dependantId: string;

  // The Legal Basis (S.29 LSA)
  basisSection: KenyanLawSection; // e.g., S29_A (Spouse/Child) or S29_B (Parent/Other)
  dependencyBasis: string; // "SPOUSE", "CHILD", "PARENT", "COHABITOR"

  // Financial Reality (The Evidence)
  dependencyLevel: DependencyLevel;
  monthlySupport?: MonthlySupport;
  dependencyCalculation?: DependencyCalculation; // The mathematical score/ratio

  // Status (Age/Education specifics for S.29)
  isMinor: boolean;
  isStudent: boolean;
  studentUntil?: Date;
  hasDisability: boolean;

  // Section 26 Claims (Claiming inadequate provision)
  isClaimant: boolean;
  claimAmount?: number;
  currency: string;

  // Court Outcomes
  provisionOrderIssued: boolean;
  courtOrderNumber?: string;
  courtApprovedAmount?: number;
  provisionType?: string; // "LUMP_SUM", "PERIODIC_PAYMENT", "LIFE_INTEREST"

  // Verification
  evidenceDocuments: string[]; // IDs of documents proving dependency
  verifiedByCourtAt?: Date;

  // Audit
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLegalDependantProps {
  deceasedId: string;
  dependantId: string;
  basis: string;
  isMinor: boolean;
  isStudent?: boolean;
  hasDisability?: boolean;
  // Financials (Optional at creation, added via assessment)
  estimatedMonthlySupport?: number;
}

export class LegalDependant extends Entity<LegalDependantProps> {
  private constructor(props: LegalDependantProps) {
    super(props);
    this.validate();
  }

  static create(props: CreateLegalDependantProps): LegalDependant {
    const id = this.generateId();
    const now = new Date();

    // Determine LSA Section automatically based on basis
    // S.29(a): Wife, Wives (S.40), Children (Male/Female/Married/Unmarried)
    // S.29(b): Parents, Step-children, Semi-dependants (requires proof)
    const section = KenyanLawSection.S29_DEPENDANTS; // Default generic
    let level = DependencyLevel.NONE;

    if (['SPOUSE', 'CHILD'].includes(props.basis)) {
      // Spouses and Children are automatic dependants under S.29(a)
      // Usually considered FULL dependency unless proven otherwise
      level = DependencyLevel.FULL;
    } else {
      // Parents, Siblings, etc., are conditional under S.29(b)
      // They start as PARTIAL or NONE until evidence is provided
      level = DependencyLevel.PARTIAL;
    }

    // Initialize Monthly Support if estimate provided
    let monthlySupport: MonthlySupport | undefined;
    if (props.estimatedMonthlySupport) {
      monthlySupport = MonthlySupport.create({
        amount: props.estimatedMonthlySupport,
        currency: 'KES',
        isVerified: false,
      });
    }

    const dependant = new LegalDependant({
      id,
      deceasedId: props.deceasedId,
      dependantId: props.dependantId,
      basisSection: section,
      dependencyBasis: props.basis,
      dependencyLevel: level,
      monthlySupport,
      dependencyCalculation: undefined, // Calculated later via service
      isMinor: props.isMinor,
      isStudent: props.isStudent ?? false,
      hasDisability: props.hasDisability ?? false,
      isClaimant: false,
      currency: 'KES',
      provisionOrderIssued: false,
      evidenceDocuments: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    dependant.addDomainEvent(
      new DependantDeclaredEvent({
        legalDependantId: id,
        deceasedId: props.deceasedId,
        dependantId: props.dependantId,
        basis: props.basis,
        timestamp: now,
      }),
    );

    return dependant;
  }

  static createFromProps(props: LegalDependantProps): LegalDependant {
    return new LegalDependant(props);
  }

  // --- Domain Logic ---

  /**
   * Records financial assessment results.
   * This is usually the result of an algorithm analyzing receipts vs deceased income.
   */
  assessFinancialDependency(calculation: DependencyCalculation, level: DependencyLevel): void {
    this.props.dependencyCalculation = calculation;
    this.props.dependencyLevel = level;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new DependencyAssessedEvent({
        legalDependantId: this.id,
        dependencyRatio: calculation.ratio,
        level,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Adds verified evidence (e.g., School fees receipt, Medical records).
   * Essential for S.29(b) claimants (Parents, Step-children).
   */
  addEvidence(documentId: string): void {
    if (!this.props.evidenceDocuments.includes(documentId)) {
      this.props.evidenceDocuments.push(documentId);
      this.props.updatedAt = new Date();
      this.props.version++;

      // Note: Actual verification happens via a separate service/workflow,
      // but adding the doc is the first step.
    }
  }

  verifyEvidence(verifierId: string): void {
    // Mark specific logic for evidence verification
    // In a full implementation, this might toggle flags on specific docs
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new DependantEvidenceVerifiedEvent({
        legalDependantId: this.id,
        verifiedBy: verifierId,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Files a claim under Section 26 of the LSA.
   * This happens when the dependant feels the Will (or intestacy rules)
   * did not provide adequately for them.
   */
  fileSection26Claim(amount: number, currency: string = 'KES'): void {
    if (amount <= 0) {
      throw new InvalidDependantException('Claim amount must be positive.');
    }

    this.props.isClaimant = true;
    this.props.claimAmount = amount;
    this.props.currency = currency;
    this.props.updatedAt = new Date();
    this.props.version++;

    // This event triggers the Legal Dispute workflow in Succession Service
  }

  /**
   * Records a Court Order determining provision (S.27 / S.28 LSA).
   * This overrides any calculation or will.
   */
  recordCourtProvision(orderNumber: string, approvedAmount: number, type: string): void {
    this.props.provisionOrderIssued = true;
    this.props.courtOrderNumber = orderNumber;
    this.props.courtApprovedAmount = approvedAmount;
    this.props.provisionType = type;
    this.props.verifiedByCourtAt = new Date();

    // Update dependency level to FULL if court mandates it
    if (approvedAmount > 0) {
      this.props.dependencyLevel = DependencyLevel.FULL;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CourtProvisionOrderedEvent({
        legalDependantId: this.id,
        courtOrderNumber: orderNumber,
        amount: approvedAmount,
        type,
        timestamp: new Date(),
      }),
    );
  }

  private validate(): void {
    if (this.props.deceasedId === this.props.dependantId) {
      throw new InvalidDependantException('A person cannot be a dependant of themselves.');
    }

    // Validation: Students must have an end date or age check
    if (this.props.isStudent && !this.props.studentUntil && !this.props.isMinor) {
      // Warning: Students over 18 typically need proof of enrollment duration
    }
  }

  private static generateId(): string {
    return `dep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
  get isMinor(): boolean {
    return this.props.isMinor;
  }
  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }
  get isClaimant(): boolean {
    return this.props.isClaimant;
  }
  get hasCourtOrder(): boolean {
    return this.props.provisionOrderIssued;
  }

  /**
   * Checks if the dependant is "Priority" under S.29(a).
   * Spouses and Children have priority over Parents/Others.
   */
  get isPriorityDependant(): boolean {
    return ['SPOUSE', 'CHILD'].includes(this.props.dependencyBasis);
  }

  toJSON() {
    return {
      id: this.id,
      deceasedId: this.props.deceasedId,
      dependantId: this.props.dependantId,
      basisSection: this.props.basisSection.toString(),
      dependencyBasis: this.props.dependencyBasis,
      dependencyLevel: this.props.dependencyLevel.toString(),
      monthlySupport: this.props.monthlySupport?.toJSON(),
      dependencyCalculation: this.props.dependencyCalculation?.toJSON(),
      isMinor: this.props.isMinor,
      isStudent: this.props.isStudent,
      hasDisability: this.props.hasDisability,
      isClaimant: this.props.isClaimant,
      claimAmount: this.props.claimAmount,
      provisionOrderIssued: this.props.provisionOrderIssued,
      courtOrderNumber: this.props.courtOrderNumber,
      courtApprovedAmount: this.props.courtApprovedAmount,
      evidenceDocuments: this.props.evidenceDocuments,
      version: this.props.version,
      createdAt: this.props.createdAt,
    };
  }
}
