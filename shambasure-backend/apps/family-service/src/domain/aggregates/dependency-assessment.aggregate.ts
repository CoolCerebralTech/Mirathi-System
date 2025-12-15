// domain/aggregates/dependency-assessment.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import {
  CreateLegalDependantProps,
  LegalDependant,
  LegalDependantProps,
} from '../entities/legal-dependant.entity';
import { CourtProvisionOrderedEvent } from '../events/dependency-events/court-provision-ordered.event';
import { DependantDeclaredEvent } from '../events/dependency-events/dependant-declared.event';
import { DependantEvidenceVerifiedEvent } from '../events/dependency-events/dependant-evidence-verified.event';
import { DependencyAssessedEvent } from '../events/dependency-events/dependency-assessed.event';
import { InvalidDependantException } from '../exceptions/dependant.exception';
import { DependencyCalculation } from '../value-objects/financial/dependency-calculation.vo';
import { MonthlySupport } from '../value-objects/financial/monthly-support.vo';
import { DependencyLevel } from '../value-objects/legal/dependency-level.vo';

/**
 * DependencyAssessmentAggregate
 *
 * Manages the lifecycle of a Section 29 / Section 26 Claim.
 *
 * Invariants:
 * 1. S.29(b) dependants (Parents/Siblings) must provide financial evidence to be "FULL" or "PARTIAL".
 * 2. Court Orders (S.27/28) override any manual calculation.
 * 3. Claims must be supported by evidence documents before finalization.
 */
export class DependencyAssessmentAggregate extends AggregateRoot<LegalDependantProps> {
  private constructor(props: LegalDependantProps) {
    super(props, props.id);
  }

  // --- Factory Methods ---

  static startAssessment(props: CreateLegalDependantProps): DependencyAssessmentAggregate {
    // 1. Create the entity using its logic (auto-determining S.29 category)
    const entity = LegalDependant.create(props);

    // 2. Lift to Aggregate
    const aggregate = new DependencyAssessmentAggregate(entity.getProps());

    // 3. Re-emit creation event from the Aggregate boundary
    aggregate.addDomainEvent(
      new DependantDeclaredEvent({
        legalDependantId: aggregate.id,
        deceasedId: props.deceasedId,
        dependantId: props.dependantId,
        basis: props.basis,
        timestamp: new Date(),
      }),
    );

    return aggregate;
  }

  static createFromProps(props: LegalDependantProps): DependencyAssessmentAggregate {
    return new DependencyAssessmentAggregate(props);
  }

  // --- Domain Logic / Actions ---

  /**
   * Performs the mathematical calculation of dependency.
   * Based on Deceased's contributions vs Dependant's total needs.
   */
  calculateFinancialDegree(
    monthlyNeeds: number,
    monthlyContributionFromDeceased: number,
    totalDeceasedIncome: number,
  ): void {
    if (this.props.provisionOrderIssued) {
      // Court order exists - manual calculation is irrelevant/illegal to apply now
      return;
    }

    // Use the Value Object for the math
    const calculation = DependencyCalculation.create({
      monthlyNeeds,
      monthlyContribution: monthlyContributionFromDeceased,
      totalDeceasedIncome,
    });

    // Determine Level based on Ratio (Domain Rule)
    // > 80% support = FULL
    // > 20% support = PARTIAL
    // < 20% support = NONE (unless S.29(a) Spouse/Child)
    let level = DependencyLevel.NONE;

    if (this.isPriorityDependant) {
      // Spouses/Children default to at least PARTIAL even with low financial evidence
      level = calculation.ratio > 0.8 ? DependencyLevel.FULL : DependencyLevel.PARTIAL;
    } else {
      // Others (Parents, etc.) strictly math-based
      if (calculation.ratio > 0.8) level = DependencyLevel.FULL;
      else if (calculation.ratio > 0.2) level = DependencyLevel.PARTIAL;
    }

    this.props.dependencyCalculation = calculation;
    this.props.dependencyLevel = level;

    // Update the Monthly Support VO to reflect verified calc
    this.props.monthlySupport = MonthlySupport.create({
      amount: monthlyContributionFromDeceased,
      currency: this.props.currency,
      isVerified: true,
    });

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
   * Verifies a piece of evidence (e.g., School Fees Receipt).
   * Used to validate the financial inputs.
   */
  verifyEvidenceDocument(documentId: string, verifierId: string): void {
    if (!this.props.evidenceDocuments.includes(documentId)) {
      this.props.evidenceDocuments.push(documentId);
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new DependantEvidenceVerifiedEvent({
        legalDependantId: this.id,
        verifiedBy: verifierId,
        documentId, // Add this field to event
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Applies a Court Order (S.27/S.28 LSA) for specific provision.
   * This is the "God Mode" update that overrides calculated logic.
   */
  applyCourtProvisionOrder(
    orderNumber: string,
    amount: number,
    type: string, // "LUMP_SUM" | "MONTHLY" | "LIFE_INTEREST"
  ): void {
    this.props.provisionOrderIssued = true;
    this.props.courtOrderNumber = orderNumber;
    this.props.courtApprovedAmount = amount;
    this.props.provisionType = type;
    this.props.verifiedByCourtAt = new Date();

    // If court orders provision, they are de-facto a dependant
    if (amount > 0) {
      this.props.dependencyLevel = DependencyLevel.FULL;
    } else {
      // Court ruled NO provision
      this.props.dependencyLevel = DependencyLevel.NONE;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new CourtProvisionOrderedEvent({
        legalDependantId: this.id,
        courtOrderNumber: orderNumber,
        amount,
        type,
        timestamp: new Date(),
      }),
    );
  }

  /**
   * Updates student status (S.29 specifics for children > 18).
   */
  updateStudentStatus(isStudent: boolean, untilDate?: Date): void {
    if (isStudent && !untilDate) {
      throw new InvalidDependantException(
        'Student status requires an expected graduation/end date.',
      );
    }

    this.props.isStudent = isStudent;
    this.props.studentUntil = untilDate;

    // If they are a student and > 18, they remain a dependant
    // Logic usually handled in Policy service, but we store state here.

    this.props.updatedAt = new Date();
    this.props.version++;
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
  get dependencyLevel(): DependencyLevel {
    return this.props.dependencyLevel;
  }
  get hasCourtOrder(): boolean {
    return this.props.provisionOrderIssued;
  }

  // Helper to check S.29(a) vs (b)
  get isPriorityDependant(): boolean {
    return ['SPOUSE', 'CHILD'].includes(this.props.dependencyBasis);
  }

  /**
   * Expose props for persistence
   */
  getProps(): LegalDependantProps {
    return { ...this.props };
  }
}
