// src/estate-service/src/domain/aggregates/will.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WillBequest } from '../entities/beneficiary-assignment.entity';
import { Codicil } from '../entities/codicil.entity';
import { DisinheritanceRecord } from '../entities/disinheritance-record.entity';
import { WillExecutor } from '../entities/executor-nomination.entity';
import { WillWitness } from '../entities/will-witness.entity';
import { WillStatus, WillType, isValidWillStatusTransition } from '../enums/will-status.enum';
import { WillException } from '../exceptions/will.exception';
import { ExecutionDate } from '../value-objects/execution-date.vo';
import { TestatorCapacityDeclaration } from '../value-objects/testator-capacity-declaration.vo';

/**
 * Will Properties Interface
 */
export interface WillProps {
  // Core Identity
  testatorId: string; // User ID of the testator
  versionNumber: number;

  // Status & Type
  status: WillStatus;
  type: WillType;

  // Revocation Tracking
  isRevoked: boolean;
  revocationMethod?:
    | 'NEW_WILL'
    | 'CODICIL'
    | 'DESTRUCTION'
    | 'COURT_ORDER'
    | 'MARRIAGE'
    | 'DIVORCE'
    | 'OTHER';
  revokedAt?: Date;
  supersedesWillId?: string; // If this will supersedes a previous one
  supersededByWillId?: string; // If this will is superseded by a newer one

  // Testamentary Capacity
  capacityDeclaration?: TestatorCapacityDeclaration;

  // Execution Details
  executionDate?: ExecutionDate;

  // Instructions
  funeralWishes?: string;
  burialLocation?: string;
  residuaryClause?: string;

  // Child Entities (aggregated)
  codicils: Codicil[];
  executors: WillExecutor[];
  bequests: WillBequest[];
  witnesses: WillWitness[];
  disinheritanceRecords: DisinheritanceRecord[];

  // Metadata
  storageLocation?: string;
  probateCaseNumber?: string; // For reference only - court process handled elsewhere

  // Validation State
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Will Aggregate Root
 *
 * The central orchestrator for testamentary intent in Kenyan succession law
 *
 * Core Responsibilities:
 * 1. Enforce S.11 LSA (witnessing requirements)
 * 2. Manage will lifecycle (draft → executed → revoked)
 * 3. Ensure internal consistency (no contradictory provisions)
 * 4. Maintain aggregate invariants
 * 5. Coordinate all child entities
 *
 * Critical Invariants:
 * 1. Only 1 active will per testator at any time
 * 2. Minimum 2 valid witnesses for execution (S.11)
 * 3. Witness cannot be beneficiary (S.11(2))
 * 4. Total bequest allocation ≤ 100% (for percentage/residuary bequests)
 * 5. Disinheritance cannot contradict explicit bequests
 */
export class Will extends AggregateRoot<WillProps> {
  private constructor(props: WillProps, id?: UniqueEntityID) {
    super(id, props);
  }

  /**
   * Factory method to create a new draft Will
   */
  public static createDraft(
    testatorId: string,
    type: WillType = 'STANDARD',
    capacityDeclaration?: TestatorCapacityDeclaration,
  ): Will {
    const props: WillProps = {
      testatorId,
      versionNumber: 1,
      status: 'DRAFT',
      type,
      isRevoked: false,
      codicils: [],
      executors: [],
      bequests: [],
      witnesses: [],
      disinheritanceRecords: [],
      capacityDeclaration,
      isValid: false,
      validationErrors: ['Will is in draft state and not yet validated'],
    };

    const will = new Will(props);
    will.validate();

    // Emit domain event
    will.addDomainEvent({
      eventType: 'WillDrafted',
      aggregateId: will.id.toString(),
      eventData: {
        testatorId,
        willId: will.id.toString(),
        type,
        status: 'DRAFT',
      },
    });

    return will;
  }

  /**
   * Factory method to reconstitute a Will from persistence
   */
  public static reconstitute(props: WillProps, id: UniqueEntityID): Will {
    const will = new Will(props, id);
    will.validate();
    return will;
  }

  /**
   * Validate Will invariants
   *
   * Ensures all aggregate rules and Kenyan legal requirements are met
   */
  public validate(): void {
    const errors: string[] = [];

    // Testator validation
    if (!this.props.testatorId) {
      errors.push('Will must have a testator');
    }

    // Status validation
    if (!this.isValidStatusTransition(this.props.status)) {
      errors.push(`Invalid status transition to: ${this.props.status}`);
    }

    // Type validation
    if (!Object.values(WillType).includes(this.props.type)) {
      errors.push(`Invalid will type: ${this.props.type}`);
    }

    // Check revocation consistency
    if (this.props.isRevoked && !this.props.revocationMethod) {
      errors.push('Revoked will must have revocation method');
    }

    if (this.props.revokedAt && this.props.revokedAt > new Date()) {
      errors.push('Revocation date cannot be in the future');
    }

    // Check execution consistency
    if (this.props.status === 'WITNESSED' || this.props.status === 'ACTIVE') {
      if (!this.props.executionDate) {
        errors.push('Executed will must have execution date');
      } else {
        try {
          this.props.executionDate.validate();
        } catch (error: any) {
          errors.push(`Invalid execution date: ${error.message}`);
        }
      }
    }

    // Check capacity declaration
    if (this.props.capacityDeclaration) {
      try {
        this.props.capacityDeclaration.validate();
      } catch (error: any) {
        errors.push(`Invalid capacity declaration: ${error.message}`);
      }
    }

    // Validate child entities
    errors.push(...this.validateChildEntities());

    // Validate aggregate invariants
    errors.push(...this.validateAggregateInvariants());

    // Update validation state
    const isValid = errors.length === 0 && this.props.status !== 'DRAFT';

    this.updateState({
      isValid,
      validationErrors: errors,
    });
  }

  /**
   * Validate all child entities
   */
  private validateChildEntities(): string[] {
    const errors: string[] = [];

    // Validate codicils
    this.props.codicils.forEach((codicil, index) => {
      try {
        codicil.validate();
        // Ensure codicil references this will
        if (codicil.willId !== this.id.toString()) {
          errors.push(`Codicil ${index + 1} does not reference this will`);
        }
      } catch (error: any) {
        errors.push(`Codicil ${index + 1} validation failed: ${error.message}`);
      }
    });

    // Validate executors
    this.props.executors.forEach((executor, index) => {
      try {
        executor.validate();
        if (executor.willId !== this.id.toString()) {
          errors.push(`Executor ${index + 1} does not reference this will`);
        }
      } catch (error: any) {
        errors.push(`Executor ${index + 1} validation failed: ${error.message}`);
      }
    });

    // Validate bequests
    this.props.bequests.forEach((bequest, index) => {
      try {
        bequest.validate();
        if (bequest.willId !== this.id.toString()) {
          errors.push(`Bequest ${index + 1} does not reference this will`);
        }
      } catch (error: any) {
        errors.push(`Bequest ${index + 1} validation failed: ${error.message}`);
      }
    });

    // Validate witnesses
    this.props.witnesses.forEach((witness, index) => {
      try {
        witness.validate();
        if (witness.willId !== this.id.toString()) {
          errors.push(`Witness ${index + 1} does not reference this will`);
        }
      } catch (error: any) {
        errors.push(`Witness ${index + 1} validation failed: ${error.message}`);
      }
    });

    // Validate disinheritance records
    this.props.disinheritanceRecords.forEach((record, index) => {
      try {
        record.validate();
        if (record.willId !== this.id.toString()) {
          errors.push(`Disinheritance record ${index + 1} does not reference this will`);
        }
      } catch (error: any) {
        errors.push(`Disinheritance record ${index + 1} validation failed: ${error.message}`);
      }
    });

    return errors;
  }

  /**
   * Validate aggregate-level invariants
   */
  private validateAggregateInvariants(): string[] {
    const errors: string[] = [];

    // Invariant 1: Minimum 2 witnesses for executed wills (S.11 LSA)
    if (this.props.status === 'WITNESSED' || this.props.status === 'ACTIVE') {
      const validWitnesses = this.props.witnesses.filter(
        (w) => w.status === 'SIGNED' || w.status === 'VERIFIED',
      );
      if (validWitnesses.length < 2) {
        errors.push('Executed will must have at least 2 valid witnesses (S.11 LSA)');
      }
    }

    // Invariant 2: Witness cannot be beneficiary (S.11(2) LSA)
    const beneficiaryWitnesses = this.findBeneficiaryWitnesses();
    if (beneficiaryWitnesses.length > 0) {
      errors.push(`Witnesses cannot be beneficiaries: ${beneficiaryWitnesses.join(', ')}`);
    }

    // Invariant 3: Total bequest allocation ≤ 100%
    const allocationError = this.validateBequestAllocation();
    if (allocationError) {
      errors.push(allocationError);
    }

    // Invariant 4: Disinheritance cannot contradict explicit bequests
    const contradictionErrors = this.findContradictions();
    errors.push(...contradictionErrors);

    // Invariant 5: Only one residuary clause
    const residuaryBequests = this.props.bequests.filter((b) => b.bequestType === 'RESIDUARY');
    if (residuaryBequests.length > 1) {
      errors.push('Will can have only one residuary clause');
    }

    // Invariant 6: Codicils require executed will
    if (this.props.codicils.length > 0 && this.props.status === 'DRAFT') {
      errors.push('Codicils require an executed will');
    }

    // Invariant 7: Testator capacity for executed wills
    if (
      (this.props.status === 'WITNESSED' || this.props.status === 'ACTIVE') &&
      !this.props.capacityDeclaration
    ) {
      errors.push('Executed will must have capacity declaration');
    }

    return errors;
  }

  /**
   * Execute the will (sign with witnesses)
   */
  public execute(executionDate: ExecutionDate, witnesses: WillWitness[]): void {
    // Check preconditions
    if (this.props.status !== 'DRAFT') {
      throw new WillException(`Cannot execute will in status: ${this.props.status}`, 'status');
    }

    if (!this.props.capacityDeclaration) {
      throw new WillException(
        'Will execution requires capacity declaration',
        'capacityDeclaration',
      );
    }

    // Validate witnesses
    if (witnesses.length < 2) {
      throw new WillException('Will execution requires at least 2 witnesses', 'witnesses');
    }

    // Check witness eligibility
    const invalidWitnesses = witnesses.filter((w) => !w.isValidForWillExecution());
    if (invalidWitnesses.length > 0) {
      throw new WillException(
        `Invalid witnesses: ${invalidWitnesses.length} witnesses do not meet S.11 requirements`,
        'witnesses',
      );
    }

    // Check for beneficiary witnesses
    const beneficiaryWitnesses = this.findBeneficiaryWitnesses();
    if (beneficiaryWitnesses.length > 0) {
      throw new WillException(
        `Witnesses cannot be beneficiaries: ${beneficiaryWitnesses.join(', ')}`,
        'witnesses',
      );
    }

    // Update state
    this.updateState({
      status: 'WITNESSED',
      executionDate,
      witnesses: [...this.props.witnesses, ...witnesses],
    });

    // Revalidate
    this.validate();

    // Emit domain event
    this.addDomainEvent({
      eventType: 'WillExecuted',
      aggregateId: this.id.toString(),
      eventData: {
        testatorId: this.props.testatorId,
        willId: this.id.toString(),
        executionDate: executionDate.toJSON(),
        witnessCount: witnesses.length,
      },
    });
  }

  /**
   * Revoke the will
   */
  public revoke(
    method:
      | 'NEW_WILL'
      | 'CODICIL'
      | 'DESTRUCTION'
      | 'COURT_ORDER'
      | 'MARRIAGE'
      | 'DIVORCE'
      | 'OTHER',
    reason?: string,
  ): void {
    if (this.props.isRevoked) {
      throw new WillException('Will already revoked', 'isRevoked');
    }

    if (this.props.status === 'DRAFT') {
      throw new WillException('Draft wills cannot be revoked', 'status');
    }

    this.updateState({
      isRevoked: true,
      revocationMethod: method,
      revokedAt: new Date(),
      status: 'REVOKED',
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'WillRevoked',
      aggregateId: this.id.toString(),
      eventData: {
        testatorId: this.props.testatorId,
        willId: this.id.toString(),
        revocationMethod: method,
        reason,
      },
    });
  }

  /**
   * Add a bequest to the will
   */
  public addBequest(bequest: WillBequest): void {
    if (this.props.status !== 'DRAFT') {
      throw new WillException('Can only add bequests to draft wills', 'status');
    }

    // Check for contradictions with disinheritance
    const contradictions = this.findBequestContradictions(bequest);
    if (contradictions.length > 0) {
      throw new WillException(
        `Bequest contradicts disinheritance: ${contradictions.join(', ')}`,
        'bequests',
      );
    }

    this.updateState({
      bequests: [...this.props.bequests, bequest],
    });

    // Revalidate allocation
    this.validateBequestAllocation();

    // Emit domain event
    this.addDomainEvent({
      eventType: 'BequestAdded',
      aggregateId: this.id.toString(),
      eventData: {
        bequestId: bequest.id.toString(),
        beneficiary: bequest.beneficiary.toJSON(),
        bequestType: bequest.bequestType,
      },
    });
  }

  /**
   * Add an executor nomination
   */
  public addExecutor(executor: WillExecutor): void {
    if (this.props.status !== 'DRAFT') {
      throw new WillException('Can only add executors to draft wills', 'status');
    }

    // Check for duplicate primary executors
    if (executor.priority.props.priority === 'PRIMARY') {
      const existingPrimary = this.props.executors.find(
        (e) => e.priority.props.priority === 'PRIMARY',
      );
      if (existingPrimary) {
        throw new WillException('Will already has a primary executor', 'executors');
      }
    }

    this.updateState({
      executors: [...this.props.executors, executor],
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'ExecutorAdded',
      aggregateId: this.id.toString(),
      eventData: {
        executorId: executor.id.toString(),
        executorName: executor.getDisplayName(),
        priority: executor.priority.toJSON(),
      },
    });
  }

  /**
   * Add a witness
   */
  public addWitness(witness: WillWitness): void {
    if (this.props.status !== 'DRAFT') {
      throw new WillException('Can only add witnesses to draft wills', 'status');
    }

    // Check witness eligibility
    if (!witness.props.eligibility.props.isEligible) {
      throw new WillException('Ineligible witness cannot be added', 'witnesses');
    }

    this.updateState({
      witnesses: [...this.props.witnesses, witness],
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'WitnessAdded',
      aggregateId: this.id.toString(),
      eventData: {
        witnessId: witness.id.toString(),
        witnessName: witness.getDisplayName(),
        witnessType: witness.witnessIdentity.type,
      },
    });
  }

  /**
   * Add a codicil (amendment)
   */
  public addCodicil(codicil: Codicil): void {
    if (this.props.status !== 'WITNESSED' && this.props.status !== 'ACTIVE') {
      throw new WillException('Codicils can only be added to executed wills', 'status');
    }

    // Ensure codicil references this will
    if (codicil.willId !== this.id.toString()) {
      throw new WillException('Codicil does not reference this will', 'codicils');
    }

    this.updateState({
      codicils: [...this.props.codicils, codicil],
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'CodicilAdded',
      aggregateId: this.id.toString(),
      eventData: {
        codicilId: codicil.id.toString(),
        title: codicil.title,
        amendmentType: codicil.amendmentType,
      },
    });
  }

  /**
   * Add a disinheritance record
   */
  public addDisinheritanceRecord(record: DisinheritanceRecord): void {
    if (this.props.status !== 'DRAFT') {
      throw new WillException('Can only add disinheritance records to draft wills', 'status');
    }

    // Ensure record references this will
    if (record.willId !== this.id.toString()) {
      throw new WillException(
        'Disinheritance record does not reference this will',
        'disinheritanceRecords',
      );
    }

    // Check for contradictions with existing bequests
    const contradictions = this.findDisinheritanceContradictions(record);
    if (contradictions.length > 0) {
      throw new WillException(
        `Disinheritance contradicts bequests: ${contradictions.join(', ')}`,
        'disinheritanceRecords',
      );
    }

    this.updateState({
      disinheritanceRecords: [...this.props.disinheritanceRecords, record],
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'DisinheritanceAdded',
      aggregateId: this.id.toString(),
      eventData: {
        recordId: record.id.toString(),
        disinheritedPerson: record.disinheritedPerson.toJSON(),
        reasonCategory: record.reasonCategory,
      },
    });
  }

  /**
   * Update testator capacity declaration
   */
  public updateCapacityDeclaration(declaration: TestatorCapacityDeclaration): void {
    if (this.props.status !== 'DRAFT') {
      throw new WillException(
        'Can only update capacity declaration for draft wills',
        'capacityDeclaration',
      );
    }

    this.updateState({
      capacityDeclaration: declaration,
    });

    // Emit domain event
    this.addDomainEvent({
      eventType: 'CapacityDeclarationUpdated',
      aggregateId: this.id.toString(),
      eventData: {
        willId: this.id.toString(),
        status: declaration.props.status,
        isCompetent: declaration.isCompetent(),
      },
    });
  }

  /**
   * Get the effective bequests (considering codicils)
   */
  public getEffectiveBequests(): WillBequest[] {
    if (this.props.codicils.length === 0) {
      return [...this.props.bequests];
    }

    // Apply codicil amendments to bequests
    // This is a simplified implementation - real implementation would be more complex
    const effectiveBequests = [...this.props.bequests];

    this.props.codicils.forEach((codicil) => {
      if (codicil.amendmentType === 'REVOCATION' && codicil.affectedClauses) {
        // Remove bequests affected by revocation codicil
        const indicesToRemove: number[] = [];
        codicil.affectedClauses.forEach((clause) => {
          const index = effectiveBequests.findIndex(
            (b) => b.id.toString() === clause || b.description.includes(clause),
          );
          if (index !== -1) {
            indicesToRemove.push(index);
          }
        });

        // Remove in reverse order to maintain indices
        indicesToRemove
          .sort((a, b) => b - a)
          .forEach((index) => {
            effectiveBequests.splice(index, 1);
          });
      }
    });

    return effectiveBequests;
  }

  /**
   * Get legal validity assessment
   */
  public getValidityAssessment(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const errors = [...this.props.validationErrors];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check S.11 compliance
    if (this.props.status === 'WITNESSED' || this.props.status === 'ACTIVE') {
      const validWitnesses = this.props.witnesses.filter(
        (w) => w.status === 'SIGNED' || w.status === 'VERIFIED',
      );
      if (validWitnesses.length < 2) {
        errors.push('Insufficient valid witnesses for S.11 compliance');
      } else if (validWitnesses.length === 2) {
        warnings.push(
          'Only minimum required witnesses - consider additional witnesses for strength',
        );
      }
    }

    // Check capacity declaration
    if (this.props.capacityDeclaration) {
      const capacityRisk = this.props.capacityDeclaration.getRiskLevel();
      if (capacityRisk === 'HIGH') {
        errors.push('High risk capacity declaration - may be challenged');
      } else if (capacityRisk === 'MEDIUM') {
        warnings.push('Medium risk capacity declaration - consider strengthening');
      }

      if (!this.props.capacityDeclaration.isLegallySufficient()) {
        warnings.push('Capacity declaration may be legally insufficient');
      }
    }

    // Check for S.26 dependant risks
    const dependantRisks = this.assessS26Risks();
    warnings.push(...dependantRisks);

    // Check bequest allocation
    const allocationError = this.validateBequestAllocation();
    if (allocationError) {
      errors.push(allocationError);
    }

    // Generate recommendations
    if (this.props.status === 'DRAFT') {
      recommendations.push('Complete witness signatures to execute will');
      recommendations.push('Ensure all bequests are clearly defined');
    }

    if (this.props.executors.length === 0) {
      recommendations.push('Consider appointing an executor');
    }

    if (this.props.disinheritanceRecords.length > 0) {
      recommendations.push('Review disinheritance records for S.26 compliance');
    }

    const isValid = errors.length === 0;

    return { isValid, errors, warnings, recommendations };
  }

  /**
   * Assess S.26 dependant provision risks
   */
  private assessS26Risks(): string[] {
    const warnings: string[] = [];

    // Simplified check for dependants
    // In a real system, this would integrate with Family Service
    const potentialDependantTypes = ['SPOUSE', 'CHILD', 'MINOR', 'DISABLED'];

    this.props.bequests.forEach((bequest) => {
      const beneficiary = bequest.beneficiary.toJSON();
      const identifier = beneficiary.identifier || '';

      potentialDependantTypes.forEach((type) => {
        if (identifier.toUpperCase().includes(type)) {
          warnings.push(`Beneficiary ${beneficiary.displayName} may be a dependant under S.26`);
        }
      });
    });

    // Check disinherited persons who might be dependants
    this.props.disinheritanceRecords.forEach((record) => {
      const person = record.disinheritedPerson.toJSON();
      const identifier = person.identifier || '';

      potentialDependantTypes.forEach((type) => {
        if (identifier.toUpperCase().includes(type)) {
          warnings.push(`Disinherited person ${person.displayName} may be a dependant under S.26`);
        }
      });
    });

    return warnings;
  }

  /**
   * Find witnesses who are also beneficiaries
   */
  private findBeneficiaryWitnesses(): string[] {
    const beneficiaryWitnesses: string[] = [];

    this.props.witnesses.forEach((witness) => {
      const witnessIdentifier =
        witness.witnessIdentity.externalDetails?.fullName || witness.witnessIdentity.userId;

      this.props.bequests.forEach((bequest) => {
        const beneficiaryIdentifier = bequest.beneficiary.getIdentifier();

        // Simplified check - real implementation would compare IDs
        if (witnessIdentifier && beneficiaryIdentifier.includes(witnessIdentifier)) {
          beneficiaryWitnesses.push(witnessIdentifier);
        }
      });
    });

    return [...new Set(beneficiaryWitnesses)]; // Remove duplicates
  }

  /**
   * Validate bequest allocation doesn't exceed 100%
   */
  private validateBequestAllocation(): string | null {
    let totalPercentage = 0;
    let specificAssetCount = 0;

    this.props.bequests.forEach((bequest) => {
      if (bequest.bequestType === 'PERCENTAGE' && bequest.percentage) {
        totalPercentage += bequest.percentage;
      } else if (bequest.bequestType === 'RESIDUARY' && bequest.residuaryShare) {
        // Residuary shares are percentages of remainder
        // We'll track them separately
      } else if (bequest.bequestType === 'SPECIFIC_ASSET') {
        specificAssetCount++;
      }
    });

    if (totalPercentage > 100) {
      return `Total percentage bequests (${totalPercentage}%) exceed 100%`;
    }

    return null;
  }

  /**
   * Find contradictions between bequests and disinheritance
   */
  private findContradictions(): string[] {
    const contradictions: string[] = [];

    this.props.bequests.forEach((bequest) => {
      const beneficiaryId = bequest.beneficiary.getIdentifier();

      this.props.disinheritanceRecords.forEach((record) => {
        const disinheritedId = record.disinheritedPerson.getIdentifier();

        if (beneficiaryId === disinheritedId) {
          contradictions.push(`${beneficiaryId} is both a beneficiary and disinherited`);
        }
      });
    });

    return contradictions;
  }

  private findBequestContradictions(bequest: WillBequest): string[] {
    const contradictions: string[] = [];
    const beneficiaryId = bequest.beneficiary.getIdentifier();

    this.props.disinheritanceRecords.forEach((record) => {
      const disinheritedId = record.disinheritedPerson.getIdentifier();

      if (beneficiaryId === disinheritedId) {
        contradictions.push(beneficiaryId);
      }
    });

    return contradictions;
  }

  private findDisinheritanceContradictions(record: DisinheritanceRecord): string[] {
    const contradictions: string[] = [];
    const disinheritedId = record.disinheritedPerson.getIdentifier();

    this.props.bequests.forEach((bequest) => {
      const beneficiaryId = bequest.beneficiary.getIdentifier();

      if (beneficiaryId === disinheritedId) {
        contradictions.push(beneficiaryId);
      }
    });

    return contradictions;
  }

  private isValidStatusTransition(newStatus: WillStatus): boolean {
    return isValidWillStatusTransition(this.props.status, newStatus);
  }

  protected applyEvent(event: any): void {
    // Apply event to aggregate state
    // This would be used for event sourcing reconstruction
    switch (event.eventType) {
      case 'WillDrafted':
        // No state change needed for creation
        break;
      case 'WillExecuted':
        this.props.status = 'WITNESSED';
        break;
      case 'WillRevoked':
        this.props.isRevoked = true;
        this.props.status = 'REVOKED';
        break;
      // Handle other events...
    }
  }

  // Getters
  get testatorId(): string {
    return this.props.testatorId;
  }

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get status(): WillStatus {
    return this.props.status;
  }

  get type(): WillType {
    return this.props.type;
  }

  get isRevoked(): boolean {
    return this.props.isRevoked;
  }

  get revocationMethod(): string | undefined {
    return this.props.revocationMethod;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  get supersedesWillId(): string | undefined {
    return this.props.supersedesWillId;
  }

  get supersededByWillId(): string | undefined {
    return this.props.supersededByWillId;
  }

  get capacityDeclaration(): TestatorCapacityDeclaration | undefined {
    return this.props.capacityDeclaration;
  }

  get executionDate(): ExecutionDate | undefined {
    return this.props.executionDate;
  }

  get funeralWishes(): string | undefined {
    return this.props.funeralWishes;
  }

  get burialLocation(): string | undefined {
    return this.props.burialLocation;
  }

  get residuaryClause(): string | undefined {
    return this.props.residuaryClause;
  }

  get codicils(): Codicil[] {
    return [...this.props.codicils];
  }

  get executors(): WillExecutor[] {
    return [...this.props.executors];
  }

  get bequests(): WillBequest[] {
    return [...this.props.bequests];
  }

  get witnesses(): WillWitness[] {
    return [...this.props.witnesses];
  }

  get disinheritanceRecords(): DisinheritanceRecord[] {
    return [...this.props.disinheritanceRecords];
  }

  get storageLocation(): string | undefined {
    return this.props.storageLocation;
  }

  get probateCaseNumber(): string | undefined {
    return this.props.probateCaseNumber;
  }

  get isValid(): boolean {
    return this.props.isValid;
  }

  get validationErrors(): string[] {
    return [...this.props.validationErrors];
  }
}
