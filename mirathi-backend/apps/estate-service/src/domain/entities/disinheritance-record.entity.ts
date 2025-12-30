// src/estate-service/src/domain/entities/disinheritance-record.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  DisinheritanceAcknowledgedEvent,
  DisinheritanceDeactivatedEvent,
  DisinheritanceDeclaredEvent,
  DisinheritanceEvidenceAddedEvent,
  DisinheritanceReactivatedEvent,
  DisinheritanceReasonUpdatedEvent,
} from '../events/disinheritance-record.events';
import { DisinheritanceRecordException } from '../exceptions/disinheritance-record.exception';
import { BeneficiaryIdentity } from '../value-objects/beneficiary-identity.vo';

/**
 * Disinheritance Reason Category
 */
export type DisinheritanceReasonCategory =
  | 'ESTRANGEMENT' // No relationship/contact
  | 'PROVIDED_FOR_DURING_LIFE' // Already given assets inter vivos
  | 'MORAL_UNWORTHINESS' // Bad behavior, criminal activity
  | 'CONFLICT_OF_INTEREST' // Would create conflicts
  | 'FINANCIAL_INDEPENDENCE' // Already financially independent
  | 'OTHER_DISPOSITION' // Provided for in other ways
  | 'TESTATOR_DISCRETION'; // Simple exercise of testamentary freedom

/**
 * Disinheritance Evidence Type
 */
export type DisinheritanceEvidenceType =
  | 'AFFIDAVIT'
  | 'WILL_CLARIFICATION'
  | 'PRIOR_GIFT_DOCUMENTATION'
  | 'FAMILY_AGREEMENT'
  | 'COURT_ORDER'
  | 'MEDICAL_REPORT'
  | 'OTHER';

/**
 * DisinheritanceRecord Properties Interface
 */
export interface DisinheritanceRecordProps {
  willId: string; // Reference to parent Will aggregate

  // Disinherited Person
  disinheritedPerson: BeneficiaryIdentity;

  // Reason Details
  reasonCategory: DisinheritanceReasonCategory;
  reasonDescription: string;

  // Legal Basis (for S.26 LSA challenges)
  legalBasis?: string; // e.g., "S.26 not triggered - already provided for"

  // Evidence and Documentation
  evidence: {
    type: DisinheritanceEvidenceType;
    documentId?: string;
    description: string;
  }[];

  // Applicable Clauses
  appliesToBequests?: string[]; // References to specific bequests
  isCompleteDisinheritance: boolean; // Whether person gets absolutely nothing

  // Conditions for Reinstatement (if any)
  reinstatementConditions?: string[];

  // Verification
  isAcknowledgedByDisinherited: boolean;
  acknowledgmentDate?: Date;
  acknowledgmentMethod?: 'WRITTEN' | 'VERBAL' | 'IMPLIED';

  // Legal Risk Assessment
  legalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskMitigationSteps: string[];

  // Status
  isActive: boolean;
  deactivatedReason?: string;
  deactivatedAt?: Date;
}

/**
 * DisinheritanceRecord Entity
 *
 * Represents a formal declaration to exclude a person from inheritance
 *
 * Legal Context (S.26 LSA - Dependant's Provision):
 * - Testamentary freedom allows disinheritance
 * - BUT courts may override for dependants (spouse, children, parents)
 * - Must have clear reasons to withstand S.26 challenges
 * - Cannot be used to evade legal obligations
 *
 * IMPORTANT: This is a statement of testamentary intent only.
 * Actual effect depends on probate and court decisions.
 */
export class DisinheritanceRecord extends Entity<DisinheritanceRecordProps> {
  private constructor(props: DisinheritanceRecordProps, id?: UniqueEntityID) {
    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory method to create a new DisinheritanceRecord
   */
  public static create(
    props: DisinheritanceRecordProps,
    id?: UniqueEntityID,
  ): DisinheritanceRecord {
    const record = new DisinheritanceRecord(props, id);
    record.validate();

    // Apply domain event for disinheritance declaration
    record.addDomainEvent(
      new DisinheritanceDeclaredEvent(
        props.willId,
        record.id.toString(),
        props.disinheritedPerson.toJSON(),
        props.reasonCategory,
        props.isCompleteDisinheritance,
      ),
    );

    return record;
  }

  /**
   * Validate DisinheritanceRecord invariants
   *
   * Ensures:
   * - Valid disinherited person identity
   * - Substantive reason provided
   * - Evidence meets minimum standards
   * - Legal risk properly assessed
   * - No contradictions with bequests (handled by Will aggregate)
   */
  public validate(): void {
    // Reason validation
    this.validateReason();

    // Evidence validation
    this.validateEvidence();

    // Legal risk validation
    this.validateLegalRisk();

    // Acknowledgment validation
    this.validateAcknowledgment();

    // Status validation
    this.validateStatus();

    // Check for S.26 dependant risks
    this.checkS26Risks();
  }

  /**
   * Validate reason for disinheritance
   */
  private validateReason(): void {
    if (!this.props.reasonDescription || this.props.reasonDescription.trim().length === 0) {
      throw new DisinheritanceRecordException(
        'Disinheritance must have a reason description',
        'reasonDescription',
      );
    }

    if (this.props.reasonDescription.length > 1000) {
      throw new DisinheritanceRecordException(
        'Reason description cannot exceed 1000 characters',
        'reasonDescription',
      );
    }

    // Check for valid reason category
    const validCategories: DisinheritanceReasonCategory[] = [
      'ESTRANGEMENT',
      'PROVIDED_FOR_DURING_LIFE',
      'MORAL_UNWORTHINESS',
      'CONFLICT_OF_INTEREST',
      'FINANCIAL_INDEPENDENCE',
      'OTHER_DISPOSITION',
      'TESTATOR_DISCRETION',
    ];

    if (!validCategories.includes(this.props.reasonCategory)) {
      throw new DisinheritanceRecordException(
        `Invalid reason category: ${this.props.reasonCategory}`,
        'reasonCategory',
      );
    }

    // Check reason specificity
    if (
      this.props.reasonCategory === 'TESTATOR_DISCRETION' &&
      this.props.reasonDescription.length < 50
    ) {
      throw new DisinheritanceRecordException(
        'Testator discretion reason must be substantively explained',
        'reasonDescription',
      );
    }
  }

  /**
   * Validate evidence for disinheritance
   */
  private validateEvidence(): void {
    if (this.props.evidence.length === 0) {
      throw new DisinheritanceRecordException(
        'Disinheritance must have supporting evidence',
        'evidence',
      );
    }

    // Validate each evidence item
    this.props.evidence.forEach((evidenceItem, index) => {
      if (!evidenceItem.description || evidenceItem.description.trim().length === 0) {
        throw new DisinheritanceRecordException(
          `Evidence item ${index + 1} must have a description`,
          'evidence',
        );
      }

      const validEvidenceTypes: DisinheritanceEvidenceType[] = [
        'AFFIDAVIT',
        'WILL_CLARIFICATION',
        'PRIOR_GIFT_DOCUMENTATION',
        'FAMILY_AGREEMENT',
        'COURT_ORDER',
        'MEDICAL_REPORT',
        'OTHER',
      ];

      if (!validEvidenceTypes.includes(evidenceItem.type)) {
        throw new DisinheritanceRecordException(
          `Invalid evidence type for item ${index + 1}: ${evidenceItem.type}`,
          'evidence',
        );
      }

      // Certain evidence types require document IDs
      if (evidenceItem.type === 'AFFIDAVIT' && !evidenceItem.documentId) {
        throw new DisinheritanceRecordException(
          'Affidavit evidence must have document ID',
          'evidence',
        );
      }
    });

    // Check for minimum evidence standards based on reason category
    this.validateEvidenceStandards();
  }

  private validateEvidenceStandards(): void {
    const { reasonCategory, evidence } = this.props;

    switch (reasonCategory) {
      case 'PROVIDED_FOR_DURING_LIFE': {
        // Should have gift documentation
        const hasGiftEvidence = evidence.some(
          (e) =>
            e.type === 'PRIOR_GIFT_DOCUMENTATION' || e.description.toLowerCase().includes('gift'),
        );
        if (!hasGiftEvidence) {
          throw new DisinheritanceRecordException(
            'Provided for during life reason should include gift documentation',
            'evidence',
          );
        }
        break;
      }

      case 'MORAL_UNWORTHINESS': {
        // Should have substantial evidence
        const hasSubstantialEvidence =
          evidence.length >= 2 ||
          evidence.some((e) => e.type === 'COURT_ORDER' || e.type === 'AFFIDAVIT');
        if (!hasSubstantialEvidence) {
          throw new DisinheritanceRecordException(
            'Moral unworthiness reason requires substantial evidence',
            'evidence',
          );
        }
        break;
      }

      case 'ESTRANGEMENT': {
        // Should have evidence of estrangement
        const hasEstrangementEvidence = evidence.some(
          (e) =>
            e.description.toLowerCase().includes('estranged') ||
            e.description.toLowerCase().includes('no contact') ||
            e.type === 'AFFIDAVIT',
        );
        if (!hasEstrangementEvidence) {
          throw new DisinheritanceRecordException(
            'Estrangement reason should include evidence of estrangement',
            'evidence',
          );
        }
        break;
      }
    }
  }

  /**
   * Validate legal risk assessment
   */
  private validateLegalRisk(): void {
    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];

    if (!validRiskLevels.includes(this.props.legalRiskLevel)) {
      throw new DisinheritanceRecordException(
        `Invalid legal risk level: ${this.props.legalRiskLevel}`,
        'legalRiskLevel',
      );
    }

    // Risk level should match risk mitigation steps
    if (this.props.legalRiskLevel === 'HIGH' && this.props.riskMitigationSteps.length < 3) {
      throw new DisinheritanceRecordException(
        'High risk disinheritance must have at least 3 mitigation steps',
        'riskMitigationSteps',
      );
    }

    if (this.props.legalRiskLevel === 'MEDIUM' && this.props.riskMitigationSteps.length < 2) {
      throw new DisinheritanceRecordException(
        'Medium risk disinheritance must have at least 2 mitigation steps',
        'riskMitigationSteps',
      );
    }

    // Check for empty risk mitigation steps
    this.props.riskMitigationSteps.forEach((step, index) => {
      if (!step || step.trim().length === 0) {
        throw new DisinheritanceRecordException(
          `Risk mitigation step ${index + 1} cannot be empty`,
          'riskMitigationSteps',
        );
      }
    });
  }

  /**
   * Validate acknowledgment
   */
  private validateAcknowledgment(): void {
    if (this.props.isAcknowledgedByDisinherited) {
      if (!this.props.acknowledgmentDate) {
        throw new DisinheritanceRecordException(
          'Acknowledgment must have date if acknowledged',
          'acknowledgmentDate',
        );
      }

      if (this.props.acknowledgmentDate > new Date()) {
        throw new DisinheritanceRecordException(
          'Acknowledgment date cannot be in the future',
          'acknowledgmentDate',
        );
      }

      if (!this.props.acknowledgmentMethod) {
        throw new DisinheritanceRecordException(
          'Acknowledgment must have method if acknowledged',
          'acknowledgmentMethod',
        );
      }

      const validMethods = ['WRITTEN', 'VERBAL', 'IMPLIED'];
      if (!validMethods.includes(this.props.acknowledgmentMethod)) {
        throw new DisinheritanceRecordException(
          `Invalid acknowledgment method: ${this.props.acknowledgmentMethod}`,
          'acknowledgmentMethod',
        );
      }
    }
  }

  /**
   * Validate status
   */
  private validateStatus(): void {
    if (!this.props.isActive && !this.props.deactivatedReason) {
      throw new DisinheritanceRecordException(
        'Deactivated disinheritance must have a reason',
        'deactivatedReason',
      );
    }

    if (!this.props.isActive && !this.props.deactivatedAt) {
      throw new DisinheritanceRecordException(
        'Deactivated disinheritance must have deactivation date',
        'deactivatedAt',
      );
    }

    if (this.props.deactivatedAt && this.props.deactivatedAt > new Date()) {
      throw new DisinheritanceRecordException(
        'Deactivation date cannot be in the future',
        'deactivatedAt',
      );
    }
  }

  /**
   * Check S.26 dependant risks
   */
  private checkS26Risks(): void {
    // This method identifies if the disinherited person might be a dependant
    // under S.26 LSA, which would increase legal risk

    const personIdentifier = this.props.disinheritedPerson.toJSON().identifier;

    // Check if person is likely a dependant (simplified check)
    const dependantIndicators = [
      'SPOUSE',
      'WIFE',
      'HUSBAND',
      'CHILD',
      'SON',
      'DAUGHTER',
      'MINOR',
      'DISABLED',
      'DEPENDANT',
      'PARENT',
    ];

    const isPotentialDependant = dependantIndicators.some((indicator) =>
      personIdentifier.toUpperCase().includes(indicator),
    );

    if (isPotentialDependant && this.props.legalRiskLevel !== 'HIGH') {
      // This is a warning, not an error
      console.warn(
        `Warning: Disinheriting ${personIdentifier} may trigger S.26 LSA dependant provisions`,
      );
    }
  }

  /**
   * Update reason for disinheritance
   */
  public updateReason(
    category: DisinheritanceReasonCategory,
    description: string,
    legalBasis?: string,
  ): void {
    if (!description || description.trim().length === 0) {
      throw new DisinheritanceRecordException(
        'Reason description cannot be empty',
        'reasonDescription',
      );
    }

    if (description.length > 1000) {
      throw new DisinheritanceRecordException(
        'Reason description cannot exceed 1000 characters',
        'reasonDescription',
      );
    }
    const previousCategory = this.props.reasonCategory;
    this.updateState({
      reasonCategory: category,
      reasonDescription: description,
      legalBasis,
    });

    // Recalculate legal risk
    this.recalculateLegalRisk();

    // Add domain event for reason update
    this.addDomainEvent(
      new DisinheritanceReasonUpdatedEvent(
        this.props.willId,
        this.id.toString(),
        this.props.disinheritedPerson.toJSON(),
        previousCategory,
        category,
      ),
    );
  }

  /**
   * Add evidence to disinheritance record
   */
  public addEvidence(
    type: DisinheritanceEvidenceType,
    description: string,
    documentId?: string,
  ): void {
    if (!description || description.trim().length === 0) {
      throw new DisinheritanceRecordException('Evidence must have description', 'evidence');
    }

    const newEvidence = {
      type,
      description,
      documentId,
    };

    // Check for duplicates
    const duplicate = this.props.evidence.find(
      (e) => JSON.stringify(e) === JSON.stringify(newEvidence),
    );

    if (duplicate) {
      throw new DisinheritanceRecordException('Evidence already exists in record', 'evidence');
    }

    this.updateState({
      evidence: [...this.props.evidence, newEvidence],
    });

    // Recalculate legal risk
    this.recalculateLegalRisk();

    // Add domain event for evidence addition
    this.addDomainEvent(
      new DisinheritanceEvidenceAddedEvent(
        this.props.willId,
        this.id.toString(),
        this.props.disinheritedPerson.toJSON(),
        type,
        description,
      ),
    );
  }

  /**
   * Record acknowledgment by disinherited person
   */
  public recordAcknowledgment(
    method: 'WRITTEN' | 'VERBAL' | 'IMPLIED',
    date: Date = new Date(),
    _notes?: string,
  ): void {
    if (date > new Date()) {
      throw new DisinheritanceRecordException(
        'Acknowledgment date cannot be in the future',
        'acknowledgmentDate',
      );
    }

    this.updateState({
      isAcknowledgedByDisinherited: true,
      acknowledgmentDate: date,
      acknowledgmentMethod: method,
    });

    // Update risk level (acknowledgment reduces risk)
    this.recalculateLegalRisk();

    // Add domain event for acknowledgment
    this.addDomainEvent(
      new DisinheritanceAcknowledgedEvent(
        this.props.willId,
        this.id.toString(),
        this.props.disinheritedPerson.toJSON(),
        method,
        date.toISOString(),
      ),
    );
  }

  /**
   * Deactivate disinheritance record
   */
  public deactivate(reason: string): void {
    if (!this.props.isActive) {
      throw new DisinheritanceRecordException(
        'Disinheritance record already deactivated',
        'isActive',
      );
    }

    this.updateState({
      isActive: false,
      deactivatedReason: reason,
      deactivatedAt: new Date(),
    });

    // Add domain event for deactivation
    this.addDomainEvent(
      new DisinheritanceDeactivatedEvent(
        this.props.willId,
        this.id.toString(),
        this.props.disinheritedPerson.toJSON(),
        reason,
      ),
    );
  }

  /**
   * Reactivate disinheritance record
   */
  public reactivate(): void {
    if (this.props.isActive) {
      throw new DisinheritanceRecordException('Disinheritance record already active', 'isActive');
    }

    this.updateState({
      isActive: true,
      deactivatedReason: undefined,
      deactivatedAt: undefined,
    });

    // Add domain event for reactivation
    this.addDomainEvent(
      new DisinheritanceReactivatedEvent(
        this.props.willId,
        this.id.toString(),
        this.props.disinheritedPerson.toJSON(),
      ),
    );
  }

  /**
   * Recalculate legal risk based on current state
   */
  private recalculateLegalRisk(): void {
    let riskScore = 0;

    // Base risk by reason category
    const categoryRisk: Record<DisinheritanceReasonCategory, number> = {
      ESTRANGEMENT: 3,
      PROVIDED_FOR_DURING_LIFE: 2,
      MORAL_UNWORTHINESS: 4,
      CONFLICT_OF_INTEREST: 3,
      FINANCIAL_INDEPENDENCE: 2,
      OTHER_DISPOSITION: 3,
      TESTATOR_DISCRETION: 5,
    };

    riskScore += categoryRisk[this.props.reasonCategory] || 3;

    // Adjust for evidence quality
    const evidenceScore = this.calculateEvidenceScore();
    riskScore -= evidenceScore; // Good evidence reduces risk

    // Adjust for acknowledgment
    if (this.props.isAcknowledgedByDisinherited) {
      riskScore -= 3; // Acknowledgment significantly reduces risk
    }

    // Adjust for complete vs partial disinheritance
    if (this.props.isCompleteDisinheritance) {
      riskScore += 2; // Complete disinheritance is riskier
    }

    // Ensure risk score is within bounds
    riskScore = Math.max(1, Math.min(10, riskScore));

    // Convert to risk level
    let legalRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore <= 3) {
      legalRiskLevel = 'LOW';
    } else if (riskScore <= 6) {
      legalRiskLevel = 'MEDIUM';
    } else {
      legalRiskLevel = 'HIGH';
    }

    // Generate mitigation steps based on risk
    const riskMitigationSteps = this.generateMitigationSteps(legalRiskLevel);

    this.updateState({
      legalRiskLevel,
      riskMitigationSteps,
    });
  }

  private calculateEvidenceScore(): number {
    let score = 0;

    this.props.evidence.forEach((evidence) => {
      switch (evidence.type) {
        case 'COURT_ORDER':
          score += 3;
          break;
        case 'AFFIDAVIT':
          score += 2;
          break;
        case 'PRIOR_GIFT_DOCUMENTATION':
          score += 2;
          break;
        case 'FAMILY_AGREEMENT':
          score += 2;
          break;
        case 'MEDICAL_REPORT':
          score += 1;
          break;
        case 'WILL_CLARIFICATION':
          score += 1;
          break;
        default:
          score += 0.5;
      }

      // Bonus for document ID
      if (evidence.documentId) {
        score += 1;
      }
    });

    return Math.min(5, score); // Cap at 5
  }

  private generateMitigationSteps(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const baseSteps = [
      'Include clear explanation in will',
      'Consider alternative provision (e.g., token bequest)',
      'Obtain legal advice on S.26 implications',
      'Document reasons contemporaneously',
      'Consider mediation with disinherited person',
    ];

    const highRiskSteps = [
      'Obtain written acknowledgment from disinherited person',
      'Include no-contest clause',
      'Consider creating testamentary trust instead',
      'Document extensive evidence of reasons',
      'Consider court declaration of non-dependency',
    ];

    switch (riskLevel) {
      case 'LOW':
        return baseSteps.slice(0, 2);
      case 'MEDIUM':
        return baseSteps.slice(0, 3);
      case 'HIGH':
        return [...baseSteps, ...highRiskSteps];
      default:
        return baseSteps;
    }
  }

  /**
   * Get legal assessment for court challenges
   */
  public getLegalAssessment(): {
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [...this.props.riskMitigationSteps];

    // Assess strength based on various factors
    let strengthScore = 0;

    // Reason category strength
    const reasonStrength: Record<DisinheritanceReasonCategory, number> = {
      PROVIDED_FOR_DURING_LIFE: 3,
      FINANCIAL_INDEPENDENCE: 3,
      ESTRANGEMENT: 2,
      CONFLICT_OF_INTEREST: 2,
      OTHER_DISPOSITION: 1,
      MORAL_UNWORTHINESS: 1,
      TESTATOR_DISCRETION: 0,
    };

    strengthScore += reasonStrength[this.props.reasonCategory] || 0;

    // Evidence strength
    strengthScore += this.calculateEvidenceScore();

    // Acknowledgment strength
    if (this.props.isAcknowledgedByDisinherited) {
      strengthScore += 3;
    }

    // Convert to strength rating
    let strength: 'STRONG' | 'MODERATE' | 'WEAK';
    if (strengthScore >= 7) {
      strength = 'STRONG';
    } else if (strengthScore >= 4) {
      strength = 'MODERATE';
    } else {
      strength = 'WEAK';
    }

    // Generate reasons based on assessment
    if (strengthScore < 4) {
      reasons.push('Weak evidentiary basis for disinheritance');
    }

    if (this.props.reasonCategory === 'TESTATOR_DISCRETION') {
      reasons.push('Reason based solely on testator discretion');
    }

    if (!this.props.isAcknowledgedByDisinherited) {
      reasons.push('Disinherited person has not acknowledged');
    }

    if (this.props.legalRiskLevel === 'HIGH') {
      reasons.push('High legal risk identified');
    }

    return { strength, reasons, recommendations };
  }

  /**
   * Check if this affects specific bequest
   */
  public affectsBequest(bequestId: string): boolean {
    if (!this.props.appliesToBequests) {
      return false;
    }

    return this.props.appliesToBequests.includes(bequestId);
  }

  /**
   * Get summary of disinheritance
   */
  public getSummary(): {
    person: string;
    reason: string;
    completeness: string;
    risk: string;
  } {
    return {
      person: this.props.disinheritedPerson.getDisplayName(),
      reason: this.props.reasonCategory,
      completeness: this.props.isCompleteDisinheritance ? 'Complete' : 'Partial',
      risk: this.props.legalRiskLevel,
    };
  }

  // Getters
  get willId(): string {
    return this.props.willId;
  }

  get disinheritedPerson(): BeneficiaryIdentity {
    return this.props.disinheritedPerson;
  }

  get reasonCategory(): DisinheritanceReasonCategory {
    return this.props.reasonCategory;
  }

  get reasonDescription(): string {
    return this.props.reasonDescription;
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get evidence(): DisinheritanceRecordProps['evidence'] {
    return [...this.props.evidence];
  }

  get appliesToBequests(): string[] | undefined {
    return this.props.appliesToBequests ? [...this.props.appliesToBequests] : undefined;
  }

  get isCompleteDisinheritance(): boolean {
    return this.props.isCompleteDisinheritance;
  }

  get reinstatementConditions(): string[] | undefined {
    return this.props.reinstatementConditions ? [...this.props.reinstatementConditions] : undefined;
  }

  get isAcknowledgedByDisinherited(): boolean {
    return this.props.isAcknowledgedByDisinherited;
  }

  get acknowledgmentDate(): Date | undefined {
    return this.props.acknowledgmentDate;
  }

  get acknowledgmentMethod(): string | undefined {
    return this.props.acknowledgmentMethod;
  }

  get legalRiskLevel(): string {
    return this.props.legalRiskLevel;
  }

  get riskMitigationSteps(): string[] {
    return [...this.props.riskMitigationSteps];
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get deactivatedReason(): string | undefined {
    return this.props.deactivatedReason;
  }

  get deactivatedAt(): Date | undefined {
    return this.props.deactivatedAt;
  }
}
