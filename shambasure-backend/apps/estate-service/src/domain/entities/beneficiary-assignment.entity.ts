// domain/entities/beneficiary-assignment.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Beneficiary Assignment Entity
 *
 * Kenyan Legal Context (Law of Succession Act, Cap 160):
 * - S.5 LSA: Freedom of testation (subject to dependant provisions)
 * - S.26 LSA: Provision for dependants despite will
 * - S.35 LSA: Intestate succession rules (when will doesn't cover)
 * - S.40 LSA: Polygamous succession rules
 *
 * Represents a SINGLE bequest (gift) from the testator to a beneficiary.
 * Can be: Specific asset, percentage of estate, residue, or conditional gift.
 *
 * Entity Scope:
 * 1. Links a beneficiary to what they receive from the estate
 * 2. Manages conditions and restrictions on the bequest
 * 3. Handles alternate beneficiaries
 * 4. Tracks satisfaction of conditions
 * 5. Validates bequest against Kenyan legal limits
 */

// =========================================================================
// VALUE OBJECTS
// =========================================================================

/**
 * Bequest Value Value Object
 * Represents the value of a bequest (specific amount, percentage, or full asset)
 */
export class BequestValue {
  constructor(
    readonly type: 'SPECIFIC_ASSET' | 'PERCENTAGE' | 'FIXED_AMOUNT' | 'RESIDUARY_SHARE',
    readonly value?: number, // For percentage or fixed amount
    readonly assetId?: string, // For specific asset
    readonly currency: string = 'KES', // Default to Kenyan Shillings
  ) {
    // Validation based on type
    switch (type) {
      case 'PERCENTAGE':
        if (value === undefined || value <= 0 || value > 100) {
          throw new Error('Percentage must be between 0.01 and 100');
        }
        break;
      case 'FIXED_AMOUNT':
        if (value === undefined || value <= 0) {
          throw new Error('Fixed amount must be positive');
        }
        break;
      case 'SPECIFIC_ASSET':
        if (!assetId) {
          throw new Error('Asset ID is required for specific asset bequest');
        }
        break;
      case 'RESIDUARY_SHARE':
        // No specific validation needed
        break;
    }

    // Currency validation
    if (currency.length !== 3) {
      throw new Error('Currency must be 3-letter ISO code');
    }
  }

  equals(other: BequestValue): boolean {
    return (
      this.type === other.type &&
      this.value === other.value &&
      this.assetId === other.assetId &&
      this.currency === other.currency
    );
  }

  isSpecificAsset(): boolean {
    return this.type === 'SPECIFIC_ASSET';
  }

  isPercentage(): boolean {
    return this.type === 'PERCENTAGE';
  }

  isFixedAmount(): boolean {
    return this.type === 'FIXED_AMOUNT';
  }

  isResiduary(): boolean {
    return this.type === 'RESIDUARY_SHARE';
  }

  toString(): string {
    switch (this.type) {
      case 'PERCENTAGE':
        return `${this.value}% of estate`;
      case 'FIXED_AMOUNT':
        return `${this.currency} ${this.value?.toLocaleString()}`;
      case 'SPECIFIC_ASSET':
        return `Specific asset (ID: ${this.assetId})`;
      case 'RESIDUARY_SHARE':
        return 'Residuary share';
    }
  }

  static createPercentage(percentage: number): BequestValue {
    return new BequestValue('PERCENTAGE', percentage);
  }

  static createFixedAmount(amount: number, currency = 'KES'): BequestValue {
    return new BequestValue('FIXED_AMOUNT', amount, undefined, currency);
  }

  static createSpecificAsset(assetId: string): BequestValue {
    return new BequestValue('SPECIFIC_ASSET', undefined, assetId);
  }

  static createResiduary(): BequestValue {
    return new BequestValue('RESIDUARY_SHARE');
  }
}

/**
 * Bequest Condition Value Object
 * Represents conditions that must be met for the bequest to take effect
 */
export class BequestCondition {
  constructor(
    readonly type: 'AGE' | 'MARRIAGE' | 'EDUCATION' | 'SURVIVAL' | 'OTHER',
    readonly description: string,
    readonly parameters: Record<string, any> = {},
    readonly mustBeSatisfiedBy?: Date,
  ) {
    if (!description || description.trim().length < 10) {
      throw new Error('Condition must have meaningful description');
    }

    // Type-specific validation
    switch (type) {
      case 'AGE':
        if (!parameters.age || parameters.age < 0) {
          throw new Error('Age condition must specify valid age');
        }
        break;
      case 'SURVIVAL':
        if (!parameters.days || parameters.days < 0) {
          throw new Error('Survival condition must specify number of days');
        }
        break;
    }
  }

  equals(other: BequestCondition): boolean {
    return (
      this.type === other.type &&
      this.description === other.description &&
      JSON.stringify(this.parameters) === JSON.stringify(other.parameters)
    );
  }

  isAgeCondition(): boolean {
    return this.type === 'AGE';
  }

  isMarriageCondition(): boolean {
    return this.type === 'MARRIAGE';
  }

  isEducationCondition(): boolean {
    return this.type === 'EDUCATION';
  }

  isSurvivalCondition(): boolean {
    return this.type === 'SURVIVAL';
  }

  getAgeRequirement(): number | undefined {
    return this.parameters.age;
  }

  getSurvivalDays(): number | undefined {
    return this.parameters.days;
  }

  toString(): string {
    return this.description;
  }

  static createAgeCondition(age: number, description?: string): BequestCondition {
    return new BequestCondition('AGE', description || `Beneficiary must reach age ${age}`, { age });
  }

  static createSurvivalCondition(days: number, description?: string): BequestCondition {
    return new BequestCondition(
      'SURVIVAL',
      description || `Beneficiary must survive testator by ${days} days`,
      { days },
    );
  }

  static createMarriageCondition(description: string): BequestCondition {
    return new BequestCondition('MARRIAGE', description);
  }

  static createEducationCondition(description: string): BequestCondition {
    return new BequestCondition('EDUCATION', description);
  }
}

/**
 * Beneficiary Identity Value Object
 * Can represent system user, family member, or external person
 */
export class BeneficiaryIdentity {
  constructor(
    readonly type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' | 'CHARITY' | 'ORGANIZATION',
    readonly id?: string, // User ID or Family Member ID
    readonly externalDetails?: {
      name: string;
      nationalId?: string;
      relationship?: string;
      contactInfo?: {
        phone?: string;
        email?: string;
        address?: string;
      };
    },
  ) {
    // Validation based on type
    switch (type) {
      case 'USER':
      case 'FAMILY_MEMBER':
        if (!id) {
          throw new Error('ID is required for system beneficiary');
        }
        break;
      case 'EXTERNAL':
      case 'CHARITY':
      case 'ORGANIZATION':
        if (!externalDetails?.name) {
          throw new Error('Name is required for external beneficiary');
        }
        break;
    }
  }

  equals(other: BeneficiaryIdentity): boolean {
    if (this.type !== other.type) return false;

    if (this.type === 'USER' || this.type === 'FAMILY_MEMBER') {
      return this.id === other.id;
    }

    return (
      this.externalDetails?.name === other.externalDetails?.name &&
      this.externalDetails?.nationalId === other.externalDetails?.nationalId
    );
  }

  isSystemUser(): boolean {
    return this.type === 'USER';
  }

  isFamilyMember(): boolean {
    return this.type === 'FAMILY_MEMBER';
  }

  isExternal(): boolean {
    return this.type === 'EXTERNAL';
  }

  isCharity(): boolean {
    return this.type === 'CHARITY';
  }

  isOrganization(): boolean {
    return this.type === 'ORGANIZATION';
  }

  getName(): string {
    if (this.externalDetails) {
      return this.externalDetails.name;
    }
    // In real implementation, would fetch from user/family member service
    return `Beneficiary ${this.id}`;
  }

  toString(): string {
    return `${this.type}: ${this.getName()}`;
  }

  static createUserBeneficiary(userId: string): BeneficiaryIdentity {
    return new BeneficiaryIdentity('USER', userId);
  }

  static createFamilyMemberBeneficiary(familyMemberId: string): BeneficiaryIdentity {
    return new BeneficiaryIdentity('FAMILY_MEMBER', familyMemberId);
  }

  static createExternalBeneficiary(
    name: string,
    nationalId?: string,
    relationship?: string,
    contactInfo?: BeneficiaryIdentity['externalDetails']['contactInfo'],
  ): BeneficiaryIdentity {
    return new BeneficiaryIdentity('EXTERNAL', undefined, {
      name,
      nationalId,
      relationship,
      contactInfo,
    });
  }

  static createCharity(name: string, registrationNumber?: string): BeneficiaryIdentity {
    return new BeneficiaryIdentity('CHARITY', undefined, {
      name,
      nationalId: registrationNumber,
    });
  }
}

// =========================================================================
// ENUMS
// =========================================================================

/**
 * Bequest Priority
 * Determines order of entitlement if primary beneficiary cannot inherit
 */
export enum BequestPriority {
  PRIMARY = 'PRIMARY', // First in line
  ALTERNATE = 'ALTERNATE', // Takes over if primary fails
  CONTINGENT = 'CONTINGENT', // Takes over if primary and alternate fail
  SUBSTITUTE = 'SUBSTITUTE', // Alternative to primary (either/or)
}

/**
 * Bequest Status
 * Tracks the lifecycle of the bequest
 */
export enum BequestStatus {
  PENDING = 'PENDING', // Will not yet executed
  VESTED = 'VESTED', // Bequest is now due
  CONDITION_PENDING = 'CONDITION_PENDING', // Waiting for condition
  CONDITION_SATISFIED = 'CONDITION_SATISFIED', // Condition met
  CONDITION_FAILED = 'CONDITION_FAILED', // Condition not met
  DISTRIBUTED = 'DISTRIBUTED', // Asset has been transferred
  LAPSED = 'LAPSED', // Bequest failed (beneficiary predeceased)
  ADEEMED = 'ADEEMED', // Asset no longer exists in estate
  REVOKED = 'REVOKED', // Revoked by codicil
  CONTESTED = 'CONTESTED', // Under legal challenge
}

/**
 * Bequest Type
 * Different types of gifts under Kenyan law
 */
export enum BequestType {
  SPECIFIC_LEGACY = 'SPECIFIC_LEGACY', // Specific item (e.g., "my car")
  GENERAL_LEGACY = 'GENERAL_LEGACY', // General gift (e.g., "KES 1,000,000")
  DEMONSTRATIVE_LEGACY = 'DEMONSTRATIVE_LEGACY', // From specific source
  RESIDUARY_LEGACY = 'RESIDUARY_LEGACY', // What's left after other gifts
  PECUNIARY_LEGACY = 'PECUNIARY_LEGACY', // Fixed sum of money
  LIFE_INTEREST = 'LIFE_INTEREST', // Use for life, then to others
  TRUST_BEQUEST = 'TRUST_BEQUEST', // Held in trust
  ANNUITY = 'ANNUITY', // Regular payments
}

// =========================================================================
// BENEFICIARY ASSIGNMENT ENTITY
// =========================================================================

interface BeneficiaryAssignmentProps {
  willId: string; // Reference to parent Will aggregate

  // What is being given
  bequestValue: BequestValue;
  bequestType: BequestType;
  description: string; // Natural language description

  // To whom
  beneficiary: BeneficiaryIdentity;
  priority: BequestPriority;

  // Conditions and Status
  conditions: BequestCondition[];
  status: BequestStatus;

  // Alternates and Substitutions
  alternateAssignmentId?: string; // If this is an alternate for another
  substituteAssignmentId?: string; // If this is a substitute (either/or)

  // Legal Compliance
  compliesWithS26: boolean; // S.26 LSA: Provision for dependants
  isSubjectToHotchpot: boolean; // S.35(3) LSA: Gifts inter vivos adjustment
  isDiscretionaryTrust: boolean; // Whether executor has discretion

  // Timeline
  effectiveDate?: Date; // When bequest takes effect
  conditionSatisfiedDate?: Date; // When condition was met
  lapsedDate?: Date; // When bequest lapsed

  // Tax and Charges
  bearsOwnTax: boolean; // Whether beneficiary pays tax
  bearsOwnDebts: boolean; // Whether bequest reduces for debts

  // Metadata
  clauseReference?: string; // Reference to will clause
  notes?: string;
}

export class BeneficiaryAssignment extends Entity<BeneficiaryAssignmentProps> {
  // =========================================================================
  // CONSTRUCTOR & FACTORY
  // =========================================================================

  private constructor(props: BeneficiaryAssignmentProps, id?: UniqueEntityID) {
    // Domain Rule: Cannot have both alternate and substitute
    if (props.alternateAssignmentId && props.substituteAssignmentId) {
      throw new Error('Assignment cannot be both alternate and substitute');
    }

    // Domain Rule: Residuary bequests must be residuary type
    if (props.bequestValue.isResiduary() && props.bequestType !== BequestType.RESIDUARY_LEGACY) {
      throw new Error('Residuary value must be of residuary legacy type');
    }

    super(id ?? new UniqueEntityID(), props);
  }

  /**
   * Factory: Create primary bequest
   */
  public static create(
    willId: string,
    bequestValue: BequestValue,
    bequestType: BequestType,
    beneficiary: BeneficiaryIdentity,
    description: string,
    conditions: BequestCondition[] = [],
  ): BeneficiaryAssignment {
    const props: BeneficiaryAssignmentProps = {
      willId,
      bequestValue,
      bequestType,
      beneficiary,
      description,
      priority: BequestPriority.PRIMARY,
      conditions,
      status: BequestStatus.PENDING,
      compliesWithS26: false, // To be determined by Will aggregate
      isSubjectToHotchpot: bequestType !== BequestType.RESIDUARY_LEGACY,
      isDiscretionaryTrust: false,
      bearsOwnTax: true, // Default: beneficiary bears own tax
      bearsOwnDebts: false, // Default: estate pays debts first
    };

    return new BeneficiaryAssignment(props);
  }

  /**
   * Factory: Create alternate bequest (takes over if primary fails)
   */
  public static createAlternate(
    willId: string,
    bequestValue: BequestValue,
    bequestType: BequestType,
    beneficiary: BeneficiaryIdentity,
    description: string,
    primaryAssignmentId: string,
  ): BeneficiaryAssignment {
    const assignment = BeneficiaryAssignment.create(
      willId,
      bequestValue,
      bequestType,
      beneficiary,
      description,
    );

    (assignment as any).updateState({
      priority: BequestPriority.ALTERNATE,
      alternateAssignmentId: primaryAssignmentId,
    });

    return assignment;
  }

  /**
   * Factory: Create contingent bequest (takes over if others fail)
   */
  public static createContingent(
    willId: string,
    bequestValue: BequestValue,
    bequestType: BequestType,
    beneficiary: BeneficiaryIdentity,
    description: string,
  ): BeneficiaryAssignment {
    const assignment = BeneficiaryAssignment.create(
      willId,
      bequestValue,
      bequestType,
      beneficiary,
      description,
    );

    (assignment as any).updateState({
      priority: BequestPriority.CONTINGENT,
    });

    return assignment;
  }

  /**
   * Factory: Create life interest bequest (use for life only)
   */
  public static createLifeInterest(
    willId: string,
    assetId: string,
    beneficiary: BeneficiaryIdentity,
    description: string,
  ): BeneficiaryAssignment {
    return new BeneficiaryAssignment({
      willId,
      bequestValue: BequestValue.createSpecificAsset(assetId),
      bequestType: BequestType.LIFE_INTEREST,
      beneficiary,
      description,
      priority: BequestPriority.PRIMARY,
      conditions: [],
      status: BequestStatus.PENDING,
      compliesWithS26: false,
      isSubjectToHotchpot: false,
      isDiscretionaryTrust: false,
      bearsOwnTax: true,
      bearsOwnDebts: false,
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: BeneficiaryAssignmentProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): BeneficiaryAssignment {
    const assignment = new BeneficiaryAssignment(props, new UniqueEntityID(id));
    (assignment as any)._createdAt = createdAt;
    (assignment as any)._updatedAt = updatedAt;
    (assignment as any)._version = version;
    return assignment;
  }

  // =========================================================================
  // BUSINESS LOGIC (MUTATIONS)
  // =========================================================================

  /**
   * Vest the bequest (make it due for distribution)
   */
  public vest(effectiveDate: Date = new Date()): void {
    if (this.status !== BequestStatus.PENDING) {
      throw new Error('Can only vest PENDING bequests');
    }

    // Check conditions if any
    if (this.conditions.length > 0) {
      throw new Error('Cannot vest bequest with pending conditions');
    }

    this.updateState({
      status: BequestStatus.VESTED,
      effectiveDate,
    });
  }

  /**
   * Mark condition as satisfied
   */
  public satisfyCondition(
    conditionIndex: number,
    satisfiedDate: Date = new Date(),
    evidence?: string,
  ): void {
    if (this.status !== BequestStatus.CONDITION_PENDING) {
      throw new Error('Bequest must be in CONDITION_PENDING status');
    }

    if (conditionIndex < 0 || conditionIndex >= this.conditions.length) {
      throw new Error('Invalid condition index');
    }

    // Update status based on remaining conditions
    const allConditionsSatisfied = true; // Simplified - would check all conditions

    this.updateState({
      status: allConditionsSatisfied
        ? BequestStatus.CONDITION_SATISFIED
        : BequestStatus.CONDITION_PENDING,
      conditionSatisfiedDate: satisfiedDate,
      notes: evidence ? `${this.notes}\nCondition satisfied: ${evidence}` : this.notes,
    });
  }

  /**
   * Mark condition as failed
   */
  public failCondition(conditionIndex: number, reason: string): void {
    if (this.status !== BequestStatus.CONDITION_PENDING) {
      throw new Error('Bequest must be in CONDITION_PENDING status');
    }

    if (conditionIndex < 0 || conditionIndex >= this.conditions.length) {
      throw new Error('Invalid condition index');
    }

    this.updateState({
      status: BequestStatus.CONDITION_FAILED,
      notes: `${this.notes}\nCondition failed: ${reason}`,
    });
  }

  /**
   * Mark as distributed (asset transferred to beneficiary)
   */
  public markDistributed(_distributionDate: Date = new Date()): void {
    if (this.status !== BequestStatus.VESTED && this.status !== BequestStatus.CONDITION_SATISFIED) {
      throw new Error('Can only distribute VESTED or CONDITION_SATISFIED bequests');
    }

    this.updateState({
      status: BequestStatus.DISTRIBUTED,
    });
  }

  /**
   * Mark as lapsed (beneficiary predeceased testator)
   */
  public lapse(reason: string, lapsedDate: Date = new Date()): void {
    if (this.status === BequestStatus.DISTRIBUTED) {
      throw new Error('Cannot lapse already distributed bequest');
    }

    this.updateState({
      status: BequestStatus.LAPSED,
      lapsedDate,
      notes: `${this.notes}\nLapsed: ${reason}`,
    });
  }

  /**
   * Mark as adeemed (asset no longer exists)
   */
  public adeem(reason: string): void {
    if (this.status === BequestStatus.DISTRIBUTED) {
      throw new Error('Cannot adeem already distributed bequest');
    }

    this.updateState({
      status: BequestStatus.ADEEMED,
      notes: `${this.notes}\nAdeemed: ${reason}`,
    });
  }

  /**
   * Revoke bequest (by codicil)
   */
  public revoke(reason: string): void {
    if (this.status === BequestStatus.DISTRIBUTED) {
      throw new Error('Cannot revoke already distributed bequest');
    }

    this.updateState({
      status: BequestStatus.REVOKED,
      notes: `${this.notes}\nRevoked: ${reason}`,
    });
  }

  /**
   * Contest bequest (legal challenge)
   */
  public contest(reason: string): void {
    this.updateState({
      status: BequestStatus.CONTESTED,
      notes: `${this.notes}\nContested: ${reason}`,
    });
  }

  /**
   * Add condition to bequest
   */
  public addCondition(condition: BequestCondition): void {
    if (this.status !== BequestStatus.PENDING) {
      throw new Error('Can only add conditions to PENDING bequests');
    }

    const updatedConditions = [...this.conditions, condition];
    const newStatus = updatedConditions.length > 0 ? BequestStatus.CONDITION_PENDING : this.status;

    this.updateState({
      conditions: updatedConditions,
      status: newStatus,
    });
  }

  /**
   * Update S.26 compliance status (dependant provision)
   */
  public updateS26Compliance(complies: boolean): void {
    this.updateState({
      compliesWithS26: complies,
    });
  }

  /**
   * Update hotchpot status (S.35(3) adjustment)
   */
  public updateHotchpotStatus(isSubject: boolean): void {
    this.updateState({
      isSubjectToHotchpot: isSubject,
    });
  }

  /**
   * Set tax responsibility
   */
  public setTaxResponsibility(bearsOwnTax: boolean): void {
    this.updateState({
      bearsOwnTax,
    });
  }

  /**
   * Set debt responsibility
   */
  public setDebtResponsibility(bearsOwnDebts: boolean): void {
    this.updateState({
      bearsOwnDebts,
    });
  }

  // =========================================================================
  // QUERY METHODS (PURE)
  // =========================================================================

  /**
   * Check if bequest is currently effective
   */
  public isEffective(): boolean {
    const effectiveStatuses = [
      BequestStatus.VESTED,
      BequestStatus.CONDITION_SATISFIED,
      BequestStatus.DISTRIBUTED,
    ];
    return effectiveStatuses.includes(this.status);
  }

  /**
   * Check if bequest has failed
   */
  public hasFailed(): boolean {
    const failedStatuses = [
      BequestStatus.CONDITION_FAILED,
      BequestStatus.LAPSED,
      BequestStatus.ADEEMED,
      BequestStatus.REVOKED,
    ];
    return failedStatuses.includes(this.status);
  }

  /**
   * Check if bequest has conditions
   */
  public hasConditions(): boolean {
    return this.conditions.length > 0;
  }

  /**
   * Check if all conditions are satisfied
   */
  public areAllConditionsSatisfied(): boolean {
    return this.status === BequestStatus.CONDITION_SATISFIED;
  }

  /**
   * Check if bequest is specific asset
   */
  public isSpecificAsset(): boolean {
    return this.bequestValue.isSpecificAsset();
  }

  /**
   * Check if bequest is residuary
   */
  public isResiduary(): boolean {
    return this.bequestValue.isResiduary();
  }

  /**
   * Check if bequest is primary (not alternate/contingent)
   */
  public isPrimary(): boolean {
    return this.priority === BequestPriority.PRIMARY;
  }

  /**
   * Check if bequest is alternate
   */
  public isAlternate(): boolean {
    return this.priority === BequestPriority.ALTERNATE;
  }

  /**
   * Check if bequest is contingent
   */
  public isContingent(): boolean {
    return this.priority === BequestPriority.CONTINGENT;
  }

  /**
   * Check if bequest is a life interest
   */
  public isLifeInterest(): boolean {
    return this.bequestType === BequestType.LIFE_INTEREST;
  }

  /**
   * Get asset ID if bequest is for specific asset
   */
  public getAssetId(): string | undefined {
    return this.bequestValue.assetId;
  }

  /**
   * Get percentage if bequest is percentage-based
   */
  public getPercentage(): number | undefined {
    return this.bequestValue.isPercentage() ? this.bequestValue.value : undefined;
  }

  /**
   * Get fixed amount if bequest is fixed amount
   */
  public getFixedAmount(): number | undefined {
    return this.bequestValue.isFixedAmount() ? this.bequestValue.value : undefined;
  }

  /**
   * Check if bequest can be distributed
   */
  public canBeDistributed(): boolean {
    return (
      (this.status === BequestStatus.VESTED || this.status === BequestStatus.CONDITION_SATISFIED) &&
      !this.hasFailed()
    );
  }

  // =========================================================================
  // PROPERTY GETTERS
  // =========================================================================

  get willId(): string {
    return this.props.willId;
  }

  get bequestValue(): BequestValue {
    return this.props.bequestValue;
  }

  get bequestType(): BequestType {
    return this.props.bequestType;
  }

  get description(): string {
    return this.props.description;
  }

  get beneficiary(): BeneficiaryIdentity {
    return this.props.beneficiary;
  }

  get priority(): BequestPriority {
    return this.props.priority;
  }

  get conditions(): BequestCondition[] {
    return [...this.props.conditions];
  }

  get status(): BequestStatus {
    return this.props.status;
  }

  get alternateAssignmentId(): string | undefined {
    return this.props.alternateAssignmentId;
  }

  get substituteAssignmentId(): string | undefined {
    return this.props.substituteAssignmentId;
  }

  get compliesWithS26(): boolean {
    return this.props.compliesWithS26;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  get isDiscretionaryTrust(): boolean {
    return this.props.isDiscretionaryTrust;
  }

  get effectiveDate(): Date | undefined {
    return this.props.effectiveDate;
  }

  get conditionSatisfiedDate(): Date | undefined {
    return this.props.conditionSatisfiedDate;
  }

  get lapsedDate(): Date | undefined {
    return this.props.lapsedDate;
  }

  get bearsOwnTax(): boolean {
    return this.props.bearsOwnTax;
  }

  get bearsOwnDebts(): boolean {
    return this.props.bearsOwnDebts;
  }

  get clauseReference(): string | undefined {
    return this.props.clauseReference;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  // Status checkers
  public isPending(): boolean {
    return this.status === BequestStatus.PENDING;
  }

  public isVested(): boolean {
    return this.status === BequestStatus.VESTED;
  }

  public isConditionPending(): boolean {
    return this.status === BequestStatus.CONDITION_PENDING;
  }

  public isConditionSatisfied(): boolean {
    return this.status === BequestStatus.CONDITION_SATISFIED;
  }

  public isDistributed(): boolean {
    return this.status === BequestStatus.DISTRIBUTED;
  }

  public isLapsed(): boolean {
    return this.status === BequestStatus.LAPSED;
  }

  public isAdeemed(): boolean {
    return this.status === BequestStatus.ADEEMED;
  }

  public isRevoked(): boolean {
    return this.status === BequestStatus.REVOKED;
  }

  public isContested(): boolean {
    return this.status === BequestStatus.CONTESTED;
  }

  // =========================================================================
  // VALIDATION
  // =========================================================================

  /**
   * Validate bequest against Kenyan legal requirements
   */
  public validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!this.description || this.description.trim().length < 10) {
      errors.push('Bequest must have meaningful description');
    }

    // S.26 LSA: Dependant provision warning
    if (!this.compliesWithS26 && this.beneficiary.isFamilyMember()) {
      warnings.push('Family member bequest may need S.26 dependant provision review');
    }

    // Condition validation
    this.conditions.forEach((condition, index) => {
      if (condition.isAgeCondition()) {
        const age = condition.getAgeRequirement();
        if (age && age < 18) {
          warnings.push(`Condition ${index + 1}: Age requirement (${age}) is below majority`);
        }
      }

      if (condition.isSurvivalCondition()) {
        const days = condition.getSurvivalDays();
        if (days && days > 180) {
          warnings.push(
            `Condition ${index + 1}: Long survival period (${days} days) may cause issues`,
          );
        }
      }
    });

    // Specific asset without asset ID
    if (this.bequestValue.isSpecificAsset() && !this.bequestValue.assetId) {
      errors.push('Specific asset bequest must specify asset ID');
    }

    // Percentage validation
    if (this.bequestValue.isPercentage()) {
      const percentage = this.bequestValue.value!;
      if (percentage <= 0) {
        errors.push('Percentage must be positive');
      }
      if (percentage > 100) {
        errors.push('Percentage cannot exceed 100%');
      }
    }

    // Fixed amount validation
    if (this.bequestValue.isFixedAmount()) {
      const amount = this.bequestValue.value!;
      if (amount <= 0) {
        errors.push('Fixed amount must be positive');
      }
    }

    // Life interest special checks
    if (this.isLifeInterest() && !this.bequestValue.isSpecificAsset()) {
      warnings.push('Life interests typically apply to specific assets');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  public toJSON() {
    const validation = this.validate();

    return {
      id: this.id.toString(),
      willId: this.willId,

      // What is being given
      bequestValue: {
        type: this.bequestValue.type,
        value: this.bequestValue.value,
        assetId: this.bequestValue.assetId,
        currency: this.bequestValue.currency,
        description: this.bequestValue.toString(),
        isSpecificAsset: this.bequestValue.isSpecificAsset(),
        isPercentage: this.bequestValue.isPercentage(),
        isFixedAmount: this.bequestValue.isFixedAmount(),
        isResiduary: this.bequestValue.isResiduary(),
      },

      bequestType: this.bequestType,
      description: this.description,
      isLifeInterest: this.isLifeInterest(),
      isResiduary: this.isResiduary(),

      // Beneficiary
      beneficiary: {
        type: this.beneficiary.type,
        id: this.beneficiary.id,
        name: this.beneficiary.getName(),
        isSystemUser: this.beneficiary.isSystemUser(),
        isFamilyMember: this.beneficiary.isFamilyMember(),
        isExternal: this.beneficiary.isExternal(),
        isCharity: this.beneficiary.isCharity(),
        externalDetails: this.beneficiary.externalDetails,
      },

      // Priority and status
      priority: this.priority,
      isPrimary: this.isPrimary(),
      isAlternate: this.isAlternate(),
      isContingent: this.isContingent(),

      status: this.status,
      isEffective: this.isEffective(),
      hasFailed: this.hasFailed(),
      canBeDistributed: this.canBeDistributed(),
      isPending: this.isPending(),
      isVested: this.isVested(),
      isDistributed: this.isDistributed(),
      isLapsed: this.isLapsed(),

      // Conditions
      conditions: this.conditions.map((c) => ({
        type: c.type,
        description: c.description,
        parameters: c.parameters,
        mustBeSatisfiedBy: c.mustBeSatisfiedBy?.toISOString(),
      })),
      hasConditions: this.hasConditions(),
      areAllConditionsSatisfied: this.areAllConditionsSatisfied(),
      conditionSatisfiedDate: this.conditionSatisfiedDate?.toISOString(),

      // Legal compliance
      alternateAssignmentId: this.alternateAssignmentId,
      substituteAssignmentId: this.substituteAssignmentId,
      compliesWithS26: this.compliesWithS26,
      isSubjectToHotchpot: this.isSubjectToHotchpot,
      isDiscretionaryTrust: this.isDiscretionaryTrust,

      // Timeline
      effectiveDate: this.effectiveDate?.toISOString(),
      lapsedDate: this.lapsedDate?.toISOString(),

      // Financial
      bearsOwnTax: this.bearsOwnTax,
      bearsOwnDebts: this.bearsOwnDebts,

      // Specific values
      assetId: this.getAssetId(),
      percentage: this.getPercentage(),
      fixedAmount: this.getFixedAmount(),
      currency: this.bequestValue.currency,

      // Metadata
      clauseReference: this.clauseReference,
      notes: this.notes,

      // Validation
      validation,

      // System
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version,
    };
  }
}
