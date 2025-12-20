import { Result, combine } from '../../../core/result';
import { CourtReference } from '../../../shared/court-reference.vo';
import { DocumentReference } from '../../../shared/document-reference.vo';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';
import { AggregateRoot } from '../../base/aggregate-root.base';
import { UniqueEntityID } from '../../base/entity';
import {
  BeneficiaryType,
  Bequest,
  BequestType,
  DistributionStatus,
} from '../entities/bequest.entity';
import { Codicil, CodicilStatus, CodicilType } from '../entities/codicil.entity';
import {
  ExecutorEligibilityStatus,
  ExecutorStatus,
  TestamentaryExecutor,
} from '../entities/testamentary-executor.entity';
import { WillWitness } from '../entities/will-witness.entity';
import { BequestAddedEvent } from '../events/bequest-added.event';
import { CodicilAddedEvent } from '../events/codicil-added.event';
import { ExecutorAppointedEvent } from '../events/executor-appointed.event';
// Domain Events
import { WillCreatedEvent } from '../events/will-created.event';
import { WillExecutedEvent } from '../events/will-executed.event';
import { WillRevokedEvent } from '../events/will-revoked.event';
import { WitnessAddedEvent } from '../events/witness-added.event';
import {
  CapacityAssessmentMethod,
  LegalCapacity,
  LegalCapacityStatus,
} from '../value-objects/legal-capacity.vo';
import {
  RevocationDetails,
  RevocationMethod,
  RevocationStatus,
} from '../value-objects/revocation-details.vo';
import { WitnessSignature, WitnessVerificationMethod } from '../value-objects/witness-signature.vo';

export enum WillStatus {
  DRAFT = 'DRAFT',
  PENDING_WITNESS = 'PENDING_WITNESS',
  WITNESSED = 'WITNESSED',
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  SUPERSEDED = 'SUPERSEDED',
  EXECUTED = 'EXECUTED', // Estate distributed
  CONTESTED = 'CONTESTED',
  PROBATE = 'PROBATE',
}

export enum WillType {
  STANDARD = 'STANDARD',
  JOINT_WILL = 'JOINT_WILL',
  MUTUAL_WILL = 'MUTUAL_WILL',
  HOLOGRAPHIC = 'HOLOGRAPHIC',
  INTERNATIONAL = 'INTERNATIONAL',
  TESTAMENTARY_TRUST_WILL = 'TESTAMENTARY_TRUST_WILL',
}

export enum WillStorageLocation {
  SAFE_DEPOSIT_BOX = 'SAFE_DEPOSIT_BOX',
  LAWYER_OFFICE = 'LAWYER_OFFICE',
  HOME_SAFE = 'HOME_SAFE',
  DIGITAL_VAULT = 'DIGITAL_VAULT',
  COURT_REGISTRY = 'COURT_REGISTRY',
  WITH_EXECUTOR = 'WITH_EXECUTOR',
  OTHER = 'OTHER',
}

interface WillProps {
  // Core Identity
  testatorId: string;
  title: string;
  type: WillType;
  status: WillStatus;
  versionNumber: number;

  // Dates
  willDate: Date; // Date will was made
  executionDate?: Date; // When testator signed
  activationDate?: Date; // When will becomes active (usually death)

  // Legal Capacity (Section 7 LSA)
  legalCapacity: LegalCapacity;
  capacityAssessedAt?: Date;
  capacityAssessedBy?: string;

  // Content
  residuaryClause?: string;
  funeralWishes?: string;
  burialLocation?: string;
  cremationInstructions?: string;
  organDonation: boolean;
  organDonationDetails?: string;
  digitalAssetInstructions?: Record<string, any>;
  specialInstructions?: string;

  // Kenyan-Specific Provisions
  hasDependantProvision: boolean;
  dependantProvisionDetails?: string;
  isHolographic: boolean;
  isWrittenInTestatorsHand: boolean;

  // Execution Formalities (Section 11 LSA)
  hasTestatorSignature: boolean;
  signatureWitnessed: boolean;
  meetsKenyanFormalities: boolean;
  executionMethod?: 'IN_PERSON' | 'VIDEO_CONFERENCE' | 'REMOTE_SIGNING';
  executionLocation?: string;

  // Witness Management
  requiresWitnesses: boolean;
  witnessCount: number;
  hasAllWitnesses: boolean;
  minimumWitnessesRequired: number;
  allWitnessedAt?: Date;

  // Revocation (Section 16-19 LSA)
  isRevoked: boolean;
  revokedAt?: Date;
  revocationMethod?: RevocationMethod;
  revocationDetails?: RevocationDetails;
  revocationReason?: string;

  // Supersession Chain
  supersedesWillId?: string;
  supersededByWillId?: string;

  // Storage & Security
  storageLocation?: WillStorageLocation;
  storageDetails?: string;
  physicalWillLocation?: string;
  digitalCopyStoragePath?: string;
  isEncrypted: boolean;
  encryptionKeyId?: string;

  // Probate & Court
  probateCaseNumber?: string;
  grantOfProbateIssued: boolean;
  grantOfProbateDate?: Date;
  courtRegistry?: string;
  isInProbate: boolean;
  probateFiledAt?: Date;

  // Activation
  isActive: boolean;
  activatedAt?: Date;
  activatedBy?: string;
  activationMethod?: 'DEATH' | 'COURT_ORDER' | 'TESTATOR_ACTION';

  // Entities (Aggregate Children)
  codicils: Codicil[];
  executors: TestamentaryExecutor[];
  witnesses: WillWitness[];
  bequests: Bequest[];

  // Life Interest Tracking (S. 35(1)(b) LSA)
  lifeInterests: Array<{
    assetId: string;
    holderId: string;
    endsAt: Date;
    condition?: string;
  }>;

  // Disinheritance Records
  disinheritedMemberIds: string[];
  disinheritanceReasons: Record<string, string>; // memberId -> reason

  // Documents
  documentReferences: DocumentReference[];
  supportingDocumentIds: string[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Will extends AggregateRoot<WillProps> {
  get id(): UniqueEntityID {
    return this._id;
  }
  get testatorId(): string {
    return this.props.testatorId;
  }
  get status(): WillStatus {
    return this.props.status;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get isRevoked(): boolean {
    return this.props.isRevoked;
  }
  get legalCapacity(): LegalCapacity {
    return this.props.legalCapacity;
  }
  get witnesses(): WillWitness[] {
    return this.props.witnesses;
  }
  get executors(): TestamentaryExecutor[] {
    return this.props.executors;
  }
  get bequests(): Bequest[] {
    return this.props.bequests;
  }
  get codicils(): Codicil[] {
    return this.props.codicils;
  }
  get versionNumber(): number {
    return this.props.versionNumber;
  }

  private constructor(props: WillProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /**
   * Factory method to create a new Will
   */
  public static create(props: Partial<WillProps>, id?: UniqueEntityID): Result<Will> {
    const defaultProps: WillProps = {
      testatorId: '',
      title: 'Last Will and Testament',
      type: WillType.STANDARD,
      status: WillStatus.DRAFT,
      versionNumber: 1,
      willDate: new Date(),
      organDonation: false,
      hasDependantProvision: false,
      isHolographic: false,
      isWrittenInTestatorsHand: false,
      hasTestatorSignature: false,
      signatureWitnessed: false,
      meetsKenyanFormalities: false,
      requiresWitnesses: true,
      witnessCount: 0,
      hasAllWitnesses: false,
      minimumWitnessesRequired: 2,
      isRevoked: false,
      isEncrypted: false,
      grantOfProbateIssued: false,
      isInProbate: false,
      isActive: false,
      codicils: [],
      executors: [],
      witnesses: [],
      bequests: [],
      lifeInterests: [],
      disinheritedMemberIds: [],
      disinheritanceReasons: {},
      documentReferences: [],
      supportingDocumentIds: [],
      legalCapacity: LegalCapacity.create({}).getValue(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mergedProps = { ...defaultProps, ...props };

    // Validate will properties
    const validationResult = this.validate(mergedProps);
    if (validationResult.isFailure) {
      return Result.fail<Will>(validationResult.getErrorValue());
    }

    const will = new Will(mergedProps, id);

    // Add domain event for will creation
    will.addDomainEvent(new WillCreatedEvent(will));

    return Result.ok<Will>(will);
  }

  /**
   * Validate will properties against Kenyan law
   */
  private static validate(props: WillProps): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (!props.testatorId) {
      errors.push('Testator ID is required');
    }

    if (!props.title || props.title.trim().length < 5) {
      errors.push('Will title must be at least 5 characters');
    }

    // Testator must be at least 18 (Section 7(2) LSA)
    if (props.legalCapacity.props.isMinor) {
      errors.push('Testator must be at least 18 years old to make a will');
    }

    // Holographic will validation
    if (props.isHolographic && !props.isWrittenInTestatorsHand) {
      errors.push("Holographic wills must be written in testator's own hand");
    }

    // Joint will validation
    if (props.type === WillType.JOINT_WILL) {
      // Joint wills require special handling
      errors.push('Joint wills require additional configuration');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Execute the will (testator signs)
   */
  public executeWill(
    executionLocation: string,
    executionMethod: 'IN_PERSON' | 'VIDEO_CONFERENCE' | 'REMOTE_SIGNING',
  ): Result<void> {
    if (this.props.status !== WillStatus.DRAFT) {
      return Result.fail(`Cannot execute will with status: ${this.props.status}`);
    }

    if (!this.props.legalCapacity.hasLegalCapacity()) {
      return Result.fail('Testator lacks legal capacity to execute will');
    }

    // Check minimum requirements
    if (this.props.bequests.length === 0) {
      return Result.fail('Will must have at least one bequest before execution');
    }

    // Check executors if required
    if (this.props.executors.length === 0) {
      return Result.fail('Will must have at least one executor before execution');
    }

    this.props.executionDate = new Date();
    this.props.executionLocation = executionLocation;
    this.props.executionMethod = executionMethod;
    this.props.hasTestatorSignature = true;
    this.props.status = WillStatus.PENDING_WITNESS;
    this.props.updatedAt = new Date();

    // Add domain event
    this.addDomainEvent(new WillExecutedEvent(this));

    return Result.ok();
  }

  /**
   * Add witness to will
   */
  public addWitness(witness: WillWitness): Result<void> {
    if (this.props.status !== WillStatus.PENDING_WITNESS) {
      return Result.fail(`Cannot add witness to will with status: ${this.props.status}`);
    }

    // Check witness eligibility
    if (witness.isBeneficiary) {
      return Result.fail('A beneficiary cannot witness a will (Section 11(4)(a) LSA)');
    }

    if (witness.isExecutor) {
      return Result.fail('An executor cannot witness a will (Section 11(4)(b) LSA)');
    }

    // Check if witness already exists
    const existingWitness = this.props.witnesses.find(
      (w) =>
        w.id.toString() === witness.id.toString() || w.props.fullName === witness.props.fullName,
    );

    if (existingWitness) {
      return Result.fail('Witness already added to this will');
    }

    // Add witness
    this.props.witnesses.push(witness);
    this.props.witnessCount = this.props.witnesses.length;
    this.props.updatedAt = new Date();

    // Check if we have all required witnesses
    this.checkWitnessCompletion();

    // Add domain event
    this.addDomainEvent(new WitnessAddedEvent(this, witness));

    return Result.ok();
  }

  /**
   * Check if witness requirements are met
   */
  private checkWitnessCompletion(): void {
    if (this.props.witnesses.length >= this.props.minimumWitnessesRequired) {
      const allWitnessesValid = this.props.witnesses.every(
        (w) => w.props.status === 'VERIFIED' || w.props.status === 'SIGNED',
      );

      if (allWitnessesValid) {
        this.props.hasAllWitnesses = true;
        this.props.allWitnessedAt = new Date();
        this.props.signatureWitnessed = true;
        this.props.status = WillStatus.WITNESSED;
        this.props.updatedAt = new Date();
      }
    }
  }

  /**
   * Activate the will (usually upon death)
   */
  public activateWill(
    activatedBy: string,
    method: 'DEATH' | 'COURT_ORDER' | 'TESTATOR_ACTION',
  ): Result<void> {
    if (this.props.status !== WillStatus.WITNESSED && this.props.status !== WillStatus.ACTIVE) {
      return Result.fail(`Cannot activate will with status: ${this.props.status}`);
    }

    if (this.props.isRevoked) {
      return Result.fail('Cannot activate a revoked will');
    }

    if (!this.props.hasTestatorSignature || !this.props.signatureWitnessed) {
      return Result.fail('Will must be properly executed and witnessed before activation');
    }

    // Verify Kenyan formalities
    const formalitiesResult = this.verifyKenyanFormalities();
    if (formalitiesResult.isFailure) {
      return Result.fail(formalitiesResult.getErrorValue());
    }

    this.props.isActive = true;
    this.props.activatedAt = new Date();
    this.props.activatedBy = activatedBy;
    this.props.activationMethod = method;
    this.props.status = WillStatus.ACTIVE;
    this.props.updatedAt = new Date();

    // Activate executors
    this.props.executors.forEach((executor) => {
      if (executor.status === ExecutorStatus.NOMINATED) {
        executor.acceptAppointment();
      }
    });

    return Result.ok();
  }

  /**
   * Verify Kenyan legal formalities (Section 11 LSA)
   */
  private verifyKenyanFormalities(): Result<void> {
    const errors: string[] = [];

    // 1. Testator must have signed
    if (!this.props.hasTestatorSignature) {
      errors.push('Testator must have signed the will');
    }

    // 2. Must be witnessed by at least 2 witnesses
    if (this.props.witnesses.length < 2) {
      errors.push('Will must be witnessed by at least 2 witnesses');
    }

    // 3. Witnesses must be eligible (not beneficiaries/executors)
    const ineligibleWitnesses = this.props.witnesses.filter((w) => w.isBeneficiary || w.isExecutor);
    if (ineligibleWitnesses.length > 0) {
      errors.push('Witnesses cannot be beneficiaries or executors');
    }

    // 4. All witnesses must be at least 18
    const underageWitnesses = this.props.witnesses.filter((w) => w.age < 18);
    if (underageWitnesses.length > 0) {
      errors.push('All witnesses must be at least 18 years old');
    }

    // 5. Testator must have legal capacity at execution
    if (!this.props.legalCapacity.hasLegalCapacity()) {
      errors.push('Testator lacked legal capacity at execution');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    this.props.meetsKenyanFormalities = true;
    return Result.ok();
  }

  /**
   * Revoke the will (Section 16-19 LSA)
   */
  public revokeWill(
    method: RevocationMethod,
    reason?: string,
    revokedBy?: string,
    details?: Partial<RevocationDetails>,
  ): Result<void> {
    if (this.props.isRevoked) {
      return Result.fail('Will is already revoked');
    }

    if (this.props.status === WillStatus.ACTIVE && this.props.isActive) {
      return Result.fail('Cannot revoke an active will without court order');
    }

    // Create revocation details
    const revocationResult = RevocationDetails.create({
      method,
      reason,
      revokedBy: revokedBy || 'TESTATOR',
      revokedAt: new Date(),
      ...details,
    });

    if (revocationResult.isFailure) {
      return Result.fail(revocationResult.getErrorValue());
    }

    this.props.isRevoked = true;
    this.props.revokedAt = new Date();
    this.props.revocationMethod = method;
    this.props.revocationDetails = revocationResult.getValue();
    this.props.revocationReason = reason;
    this.props.status = WillStatus.REVOKED;
    this.props.isActive = false;
    this.props.updatedAt = new Date();

    // Add domain event
    this.addDomainEvent(new WillRevokedEvent(this));

    return Result.ok();
  }

  /**
   * Add executor to will
   */
  public addExecutor(executor: TestamentaryExecutor): Result<void> {
    // Check if executor already exists
    const existingExecutor = this.props.executors.find(
      (e) => e.id.toString() === executor.id.toString(),
    );

    if (existingExecutor) {
      return Result.fail('Executor already appointed in this will');
    }

    // Check eligibility
    if (executor.eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE) {
      return Result.fail('Executor must be eligible before appointment');
    }

    // Add executor
    this.props.executors.push(executor);
    this.props.updatedAt = new Date();

    // Sort executors by priority
    this.props.executors.sort((a, b) => a.props.orderOfPriority - b.props.orderOfPriority);

    // Add domain event
    this.addDomainEvent(new ExecutorAppointedEvent(this, executor));

    return Result.ok();
  }

  /**
   * Remove executor
   */
  public removeExecutor(executorId: string, reason: string): Result<void> {
    const index = this.props.executors.findIndex((e) => e.id.toString() === executorId);
    if (index === -1) {
      return Result.fail('Executor not found in this will');
    }

    // Cannot remove if will is active
    if (this.props.isActive) {
      return Result.fail('Cannot remove executor from active will');
    }

    const executor = this.props.executors[index];

    // Mark executor as removed
    executor.removeExecutor(reason, 'TESTATOR');

    this.props.executors.splice(index, 1);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add bequest to will
   */
  public addBequest(bequest: Bequest): Result<void> {
    // Check if bequest for same asset already exists
    const existingBequest = this.props.bequests.find(
      (b) => b.assetId === bequest.assetId && b.priority === bequest.priority,
    );

    if (existingBequest) {
      return Result.fail('Bequest for this asset with same priority already exists');
    }

    // Validate bequest doesn't exceed 100% for percentage type
    if (bequest.type === BequestType.PERCENTAGE) {
      const totalPercentage = this.calculateTotalPercentage();
      if (bequest.sharePercentage && totalPercentage + bequest.sharePercentage.value > 100) {
        return Result.fail('Total bequest percentage cannot exceed 100%');
      }
    }

    // Add bequest
    this.props.bequests.push(bequest);
    this.props.updatedAt = new Date();

    // Add domain event
    this.addDomainEvent(new BequestAddedEvent(this, bequest));

    return Result.ok();
  }

  /**
   * Calculate total percentage of all percentage bequests
   */
  private calculateTotalPercentage(): number {
    return this.props.bequests
      .filter((b) => b.type === BequestType.PERCENTAGE && b.sharePercentage)
      .reduce((total, b) => total + (b.sharePercentage?.value || 0), 0);
  }

  /**
   * Add codicil to will
   */
  public addCodicil(codicil: Codicil): Result<void> {
    if (codicil.willId !== this.id.toString()) {
      return Result.fail('Codicil does not belong to this will');
    }

    // Check if codicil number already exists
    const existingCodicil = this.props.codicils.find(
      (c) => c.props.codicilNumber === codicil.props.codicilNumber,
    );

    if (existingCodicil) {
      return Result.fail('Codicil with this number already exists');
    }

    // Validate codicil doesn't conflict with existing codicils
    for (const existing of this.props.codicils) {
      if (existing.supersedes(codicil.id.toString())) {
        return Result.fail('This codicil is superseded by an existing codicil');
      }
    }

    // Add codicil
    this.props.codicils.push(codicil);
    this.props.versionNumber += 1;
    this.props.updatedAt = new Date();

    // Apply codicil amendments to will
    this.applyCodicilAmendments(codicil);

    // Add domain event
    this.addDomainEvent(new CodicilAddedEvent(this, codicil));

    return Result.ok();
  }

  /**
   * Apply codicil amendments to will
   */
  private applyCodicilAmendments(codicil: Codicil): void {
    // This method would update will properties based on codicil amendments
    // For now, we just update the version number
    console.log(`Applying amendments from codicil ${codicil.props.codicilNumber}`);
  }

  /**
   * Mark will as superseded by new will
   */
  public supersedeBy(newWillId: string): Result<void> {
    if (this.props.status === WillStatus.ACTIVE) {
      return Result.fail('Cannot supersede an active will');
    }

    this.props.supersededByWillId = newWillId;
    this.props.status = WillStatus.SUPERSEDED;
    this.props.isActive = false;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * File will for probate
   */
  public fileForProbate(caseNumber: string, courtRegistry: string, filedBy: string): Result<void> {
    if (!this.props.isActive) {
      return Result.fail('Only active wills can be filed for probate');
    }

    if (this.props.isInProbate) {
      return Result.fail('Will is already in probate');
    }

    this.props.probateCaseNumber = caseNumber;
    this.props.courtRegistry = courtRegistry;
    this.props.isInProbate = true;
    this.props.probateFiledAt = new Date();
    this.props.status = WillStatus.PROBATE;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Grant probate
   */
  public grantProbate(grantDate: Date): Result<void> {
    if (!this.props.isInProbate) {
      return Result.fail('Will must be in probate before granting');
    }

    this.props.grantOfProbateIssued = true;
    this.props.grantOfProbateDate = grantDate;
    this.props.status = WillStatus.EXECUTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Contest the will
   */
  public contestWill(reason: string): Result<void> {
    if (this.props.status === WillStatus.REVOKED) {
      return Result.fail('Cannot contest a revoked will');
    }

    this.props.status = WillStatus.CONTESTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Resolve contestation
   */
  public resolveContestation(upheld: boolean): Result<void> {
    if (this.props.status !== WillStatus.CONTESTED) {
      return Result.fail('Will is not contested');
    }

    if (upheld) {
      this.props.status = WillStatus.ACTIVE;
    } else {
      this.props.status = WillStatus.REVOKED;
      this.props.isRevoked = true;
      this.props.revokedAt = new Date();
    }

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add life interest (S. 35(1)(b) LSA)
   */
  public addLifeInterest(
    assetId: string,
    holderId: string,
    endsAt: Date,
    condition?: string,
  ): Result<void> {
    const existingInterest = this.props.lifeInterests.find(
      (li) => li.assetId === assetId && li.holderId === holderId,
    );

    if (existingInterest) {
      return Result.fail('Life interest for this asset and holder already exists');
    }

    this.props.lifeInterests.push({
      assetId,
      holderId,
      endsAt,
      condition,
    });

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Disinherit a family member
   */
  public disinheritMember(memberId: string, reason: string): Result<void> {
    if (this.props.disinheritedMemberIds.includes(memberId)) {
      return Result.fail('Member is already disinherited');
    }

    this.props.disinheritedMemberIds.push(memberId);
    this.props.disinheritanceReasons[memberId] = reason;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Check if will is legally valid for Kenyan probate
   */
  public isValidForProbate(): boolean {
    return (
      this.props.status === WillStatus.ACTIVE &&
      this.props.isActive &&
      !this.props.isRevoked &&
      this.props.meetsKenyanFormalities &&
      this.props.legalCapacity.hasLegalCapacity() &&
      this.props.hasTestatorSignature &&
      this.props.signatureWitnessed &&
      this.props.witnesses.length >= 2 &&
      this.props.witnesses.every((w) => w.isValidForProbate()) &&
      this.props.executors.some((e) => e.isActiveAndEligible())
    );
  }

  /**
   * Get primary executor
   */
  public getPrimaryExecutor(): TestamentaryExecutor | null {
    return this.props.executors.find((e) => e.props.isPrimary) || this.props.executors[0] || null;
  }

  /**
   * Get total bequest value
   */
  public getTotalBequestValue(): Money {
    const totalAmount = this.props.bequests
      .filter((b) => b.props.computedShareValue)
      .reduce((total, b) => total + (b.props.computedShareValue?.amount || 0), 0);

    return Money.create({ amount: totalAmount, currency: 'KES' }).getValue();
  }

  /**
   * Get will summary for court filing
   */
  public getWillSummary(): {
    testatorId: string;
    title: string;
    status: string;
    executionDate?: Date;
    witnessCount: number;
    executorCount: number;
    bequestCount: number;
    isValid: boolean;
  } {
    return {
      testatorId: this.props.testatorId,
      title: this.props.title,
      status: this.props.status,
      executionDate: this.props.executionDate,
      witnessCount: this.props.witnessCount,
      executorCount: this.props.executors.length,
      bequestCount: this.props.bequests.length,
      isValid: this.isValidForProbate(),
    };
  }

  /**
   * Update storage location
   */
  public updateStorageLocation(location: WillStorageLocation, details?: string): Result<void> {
    if (this.props.status === WillStatus.ACTIVE || this.props.status === WillStatus.PROBATE) {
      return Result.fail('Cannot change storage location of active or probate will');
    }

    this.props.storageLocation = location;
    this.props.storageDetails = details;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add supporting document
   */
  public addSupportingDocument(documentId: string): void {
    if (!this.props.supportingDocumentIds.includes(documentId)) {
      this.props.supportingDocumentIds.push(documentId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Add document reference
   */
  public addDocumentReference(reference: DocumentReference): void {
    this.props.documentReferences.push(reference);
    this.props.updatedAt = new Date();
  }

  /**
   * Check if will has dependant provision (S. 26 LSA)
   */
  public hasDependantProvision(): boolean {
    return (
      this.props.hasDependantProvision || this.props.bequests.some((b) => b.isDependantProvision())
    );
  }

  /**
   * Get all active life interests
   */
  public getActiveLifeInterests(): typeof this.props.lifeInterests {
    const now = new Date();
    return this.props.lifeInterests.filter((li) => li.endsAt > now);
  }

  /**
   * Create a new version of the will
   */
  public createNewVersion(): Will {
    const newVersionProps: WillProps = {
      ...this.props,
      versionNumber: this.props.versionNumber + 1,
      status: WillStatus.DRAFT,
      isActive: false,
      isRevoked: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Remove execution details for new draft
    newVersionProps.executionDate = undefined;
    newVersionProps.hasTestatorSignature = false;
    newVersionProps.signatureWitnessed = false;
    newVersionProps.witnesses = [];
    newVersionProps.witnessCount = 0;
    newVersionProps.hasAllWitnesses = false;
    newVersionProps.allWitnessedAt = undefined;

    const newWill = new Will(newVersionProps);

    // Mark old will as superseded
    this.supersedeBy(newWill.id.toString());

    return newWill;
  }

  /**
   * Validate all executors are eligible
   */
  public validateExecutors(): Result<void> {
    const ineligibleExecutors = this.props.executors.filter(
      (e) => e.eligibilityStatus !== ExecutorEligibilityStatus.ELIGIBLE,
    );

    if (ineligibleExecutors.length > 0) {
      return Result.fail(`Found ${ineligibleExecutors.length} ineligible executors`);
    }

    return Result.ok();
  }

  /**
   * Get will age in days
   */
  public getWillAgeInDays(): number {
    const now = new Date();
    const created = this.props.createdAt;
    const diffTime = now.getTime() - created.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
