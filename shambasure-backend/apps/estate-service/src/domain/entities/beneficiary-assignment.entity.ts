// src/estate-service/src/domain/entities/beneficiary-assignment.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { WillBequestException } from '../exceptions/will-bequest.exception';
import { BeneficiaryIdentity } from '../value-objects/beneficiary-identity.vo';
import { BequestCondition } from '../value-objects/bequest-condition.vo';
import { Money } from '../value-objects/money.vo';

/**
 * Bequest Type Enum
 */
export type BequestType =
  | 'SPECIFIC_ASSET' // Specific asset to specific person
  | 'RESIDUARY' // Remainder after specific bequests
  | 'PERCENTAGE' // Percentage of total estate
  | 'FIXED_AMOUNT' // Fixed monetary amount
  | 'LIFE_INTEREST' // Use during lifetime, then passes to another
  | 'TRUST' // Held in trust for beneficiary
  | 'ALTERNATE' // Alternate beneficiary if primary fails
  | 'CONTINGENT'; // Only if condition met

/**
 * Bequest Priority Enum
 */
export type BequestPriority = 'PRIMARY' | 'ALTERNATE' | 'CONTINGENT';

/**
 * WillBequest Properties Interface
 */
export interface WillBequestProps {
  willId: string; // Reference to parent Will aggregate
  beneficiary: BeneficiaryIdentity;
  bequestType: BequestType;

  // Value specifications (mutually exclusive based on type)
  specificAssetId?: string; // For SPECIFIC_ASSET type
  percentage?: number; // For PERCENTAGE type (0-100)
  fixedAmount?: Money; // For FIXED_AMOUNT type
  residuaryShare?: number; // For RESIDUARY type (share of residue)

  // Life interest details (if applicable)
  lifeInterestDetails?: {
    durationType: 'LIFETIME' | 'PERIOD' | 'UNTIL_EVENT';
    durationValue?: number; // Years or months
    remainderBeneficiary?: BeneficiaryIdentity;
  };

  // Trust details (if applicable)
  trustDetails?: {
    trusteeId: string;
    trustPurpose: string;
    terminationEvent: string;
  };

  // Conditions
  conditions: BequestCondition[];

  // Priority and ordering
  priority: BequestPriority;
  executionOrder: number; // Order in which bequests are executed

  // Alternate beneficiary (if primary fails)
  alternateBeneficiary?: BeneficiaryIdentity;
  alternateConditions?: BequestCondition[];

  // Description and notes
  description: string;
  notes?: string;

  // Legal restrictions
  isVested: boolean; // Whether interest is vested immediately
  isSubjectToHotchpot: boolean; // Whether subject to S.35 hotchpot rules

  // Validation flags
  isValid: boolean;
  validationErrors: string[];
}

/**
 * WillBequest Entity (Beneficiary Assignment)
 *
 * Represents a gift of property or value to a beneficiary in a Kenyan will
 *
 * Legal Context (S.5, S.26, S.35 LSA):
 * - Testamentary freedom to dispose of property
 * - Subject to dependant's provision (S.26)
 * - Subject to hotchpot rules for inter vivos gifts (S.35)
 * - Must be clear and ascertainable
 * - Cannot be illegal, impossible, or against public policy
 *
 * IMPORTANT: This is a statement of testamentary intent only.
 * Actual distribution depends on probate and administration.
 */
export class WillBequest extends Entity<WillBequestProps> {
  private constructor(props: WillBequestProps, id?: UniqueEntityID) {
    super(id, props);
  }

  /**
   * Factory method to create a new WillBequest
   */
  public static create(props: WillBequestProps, id?: UniqueEntityID): WillBequest {
    const bequest = new WillBequest(props, id);
    bequest.validate();

    // Apply domain event for Bequest creation
    bequest.addDomainEvent({
      eventType: 'BequestDefined',
      aggregateId: props.willId,
      eventData: {
        bequestId: id?.toString(),
        beneficiary: props.beneficiary.toJSON(),
        bequestType: props.bequestType,
        description: props.description,
      },
    });

    return bequest;
  }

  /**
   * Validate WillBequest invariants
   *
   * Ensures:
   * - Valid beneficiary identity
   * - Consistent value specifications based on type
   * - Valid conditions
   * - Kenyan legal compliance
   * - No contradictory provisions
   */
  public validate(): void {
    // Beneficiary validation
    this.props.beneficiary.validate();

    // Type-specific validation
    this.validateTypeSpecificRules();

    // Conditions validation
    this.validateConditions();

    // Priority validation
    this.validatePriority();

    // Execution order validation
    if (this.props.executionOrder < 1) {
      throw new WillBequestException('Execution order must be at least 1', 'executionOrder');
    }

    // Description validation
    if (!this.props.description || this.props.description.trim().length === 0) {
      throw new WillBequestException('Bequest must have a description', 'description');
    }

    if (this.props.description.length > 500) {
      throw new WillBequestException('Description cannot exceed 500 characters', 'description');
    }

    // Validate alternate beneficiary if present
    if (this.props.alternateBeneficiary) {
      this.props.alternateBeneficiary.validate();
    }

    // Validate validation flags
    this.updateValidationFlags();
  }

  /**
   * Validate type-specific rules
   */
  private validateTypeSpecificRules(): void {
    switch (this.props.bequestType) {
      case 'SPECIFIC_ASSET':
        if (!this.props.specificAssetId) {
          throw new WillBequestException(
            'Specific asset bequest must specify asset ID',
            'specificAssetId',
          );
        }
        break;

      case 'PERCENTAGE':
        if (this.props.percentage === undefined) {
          throw new WillBequestException(
            'Percentage bequest must specify percentage',
            'percentage',
          );
        }
        if (this.props.percentage <= 0 || this.props.percentage > 100) {
          throw new WillBequestException('Percentage must be between 0 and 100', 'percentage');
        }
        break;

      case 'FIXED_AMOUNT':
        if (!this.props.fixedAmount) {
          throw new WillBequestException('Fixed amount bequest must specify amount', 'fixedAmount');
        }
        this.props.fixedAmount.validate();
        break;

      case 'RESIDUARY':
        if (this.props.residuaryShare === undefined) {
          throw new WillBequestException('Residuary bequest must specify share', 'residuaryShare');
        }
        if (this.props.residuaryShare <= 0) {
          throw new WillBequestException('Residuary share must be positive', 'residuaryShare');
        }
        break;

      case 'LIFE_INTEREST':
        if (!this.props.lifeInterestDetails) {
          throw new WillBequestException(
            'Life interest bequest must specify details',
            'lifeInterestDetails',
          );
        }
        this.validateLifeInterestDetails();
        break;

      case 'TRUST':
        if (!this.props.trustDetails) {
          throw new WillBequestException(
            'Trust bequest must specify trust details',
            'trustDetails',
          );
        }
        this.validateTrustDetails();
        break;

      case 'ALTERNATE':
        if (!this.props.alternateBeneficiary) {
          throw new WillBequestException(
            'Alternate bequest must reference primary beneficiary',
            'alternateBeneficiary',
          );
        }
        break;

      case 'CONTINGENT':
        if (this.props.conditions.length === 0) {
          throw new WillBequestException(
            'Contingent bequest must have at least one condition',
            'conditions',
          );
        }
        break;
    }

    // Ensure no conflicting value specifications
    this.checkForConflictingSpecifications();
  }

  private validateLifeInterestDetails(): void {
    const details = this.props.lifeInterestDetails!;

    if (!details.durationType) {
      throw new WillBequestException(
        'Life interest must specify duration type',
        'lifeInterestDetails.durationType',
      );
    }

    if (details.durationType === 'PERIOD' && !details.durationValue) {
      throw new WillBequestException(
        'Period life interest must specify duration value',
        'lifeInterestDetails.durationValue',
      );
    }

    if (details.durationType === 'UNTIL_EVENT' && !details.durationValue) {
      throw new WillBequestException(
        'Life interest until event must specify the event',
        'lifeInterestDetails.durationValue',
      );
    }

    if (details.remainderBeneficiary) {
      details.remainderBeneficiary.validate();
    }
  }

  private validateTrustDetails(): void {
    const details = this.props.trustDetails!;

    if (!details.trusteeId) {
      throw new WillBequestException('Trust must specify trustee', 'trustDetails.trusteeId');
    }

    if (!details.trustPurpose) {
      throw new WillBequestException('Trust must specify purpose', 'trustDetails.trustPurpose');
    }

    if (!details.terminationEvent) {
      throw new WillBequestException(
        'Trust must specify termination event',
        'trustDetails.terminationEvent',
      );
    }

    // Check trust purpose is not illegal
    const illegalPurposes = ['ILLEGAL_ACTIVITY', 'TAX_EVASION', 'FRAUD'];
    if (illegalPurposes.some((p) => details.trustPurpose.includes(p))) {
      throw new WillBequestException(
        'Trust purpose cannot be illegal',
        'trustDetails.trustPurpose',
      );
    }
  }

  private validateConditions(): void {
    // Validate each condition
    this.props.conditions.forEach((condition) => {
      condition.validate();
    });

    // Check for contradictory conditions
    this.checkForContradictoryConditions();
  }

  private validatePriority(): void {
    const validPriorities: BequestPriority[] = ['PRIMARY', 'ALTERNATE', 'CONTINGENT'];

    if (!validPriorities.includes(this.props.priority)) {
      throw new WillBequestException(`Invalid priority: ${this.props.priority}`, 'priority');
    }

    // Check priority consistency
    if (this.props.priority === 'ALTERNATE' && !this.props.alternateBeneficiary) {
      throw new WillBequestException(
        'Alternate priority bequest must specify alternate beneficiary',
        'alternateBeneficiary',
      );
    }
  }

  private checkForConflictingSpecifications(): void {
    const specifications = [
      this.props.specificAssetId,
      this.props.percentage,
      this.props.fixedAmount,
      this.props.residuaryShare,
    ].filter((spec) => spec !== undefined && spec !== null);

    // For most bequest types, only one value specification should be present
    if (specifications.length > 1) {
      throw new WillBequestException(
        'Bequest cannot have multiple value specifications',
        'bequestType',
      );
    }
  }

  private checkForContradictoryConditions(): void {
    const conditions = this.props.conditions;

    // Check for direct contradictions (e.g., both "upon marriage" and "if not married")
    for (let i = 0; i < conditions.length; i++) {
      for (let j = i + 1; j < conditions.length; j++) {
        const cond1 = conditions[i];
        const cond2 = conditions[j];

        // This is a simplified check - would need more sophisticated logic
        // for actual contradictory conditions
        if (cond1.toJSON().type === 'MARRIAGE' && cond2.toJSON().type === 'MARRIAGE') {
          const params1 = cond1.toJSON().parameters;
          const params2 = cond2.toJSON().parameters;

          if (params1?.marriageAllowed !== params2?.marriageAllowed) {
            throw new WillBequestException(
              'Contradictory marriage conditions in bequest',
              'conditions',
            );
          }
        }
      }
    }
  }

  private updateValidationFlags(): void {
    const errors: string[] = [];

    try {
      // Re-run validation to catch any errors
      this.validate();
    } catch (error: any) {
      errors.push(error.message);
    }

    // Additional business logic checks
    if (
      this.props.bequestType === 'RESIDUARY' &&
      this.props.residuaryShare &&
      this.props.residuaryShare > 100
    ) {
      errors.push('Residuary share cannot exceed 100%');
    }

    if (
      this.props.bequestType === 'PERCENTAGE' &&
      this.props.percentage &&
      this.props.percentage > 100
    ) {
      errors.push('Percentage cannot exceed 100%');
    }

    // Check if beneficiary is also a witness (would need cross-checking with Will aggregate)
    // For now, we'll just note it as a warning if relationship suggests witness status
    if (this.props.beneficiary.toJSON().identifier?.includes('WITNESS')) {
      errors.push('Warning: Beneficiary may also be a witness - check S.11(2) LSA');
    }

    const isValid = errors.length === 0;

    // Update validation state
    this.updateState({
      isValid,
      validationErrors: errors,
    });
  }

  /**
   * Update bequest description
   */
  public updateDescription(description: string, notes?: string): void {
    if (!description || description.trim().length === 0) {
      throw new WillBequestException('Description cannot be empty', 'description');
    }

    if (description.length > 500) {
      throw new WillBequestException('Description cannot exceed 500 characters', 'description');
    }

    this.updateState({
      description,
      notes,
    });

    // Add domain event for description update
    this.addDomainEvent({
      eventType: 'BequestDescriptionUpdated',
      aggregateId: this.props.willId,
      eventData: {
        bequestId: this.id.toString(),
        beneficiary: this.props.beneficiary.toJSON(),
        previousDescription: this.props.description,
        newDescription: description,
      },
    });
  }

  /**
   * Add condition to bequest
   */
  public addCondition(condition: BequestCondition): void {
    // Check for duplicates
    const duplicate = this.props.conditions.find(
      (c) => JSON.stringify(c.toJSON()) === JSON.stringify(condition.toJSON()),
    );

    if (duplicate) {
      throw new WillBequestException('Condition already exists in bequest', 'conditions');
    }

    // Check for contradictions with existing conditions
    const updatedConditions = [...this.props.conditions, condition];

    // Temporarily update to check for contradictions
    const tempBequest = new WillBequest(
      {
        ...this.props,
        conditions: updatedConditions,
      },
      this.id,
    );

    try {
      tempBequest.validate();
    } catch (error) {
      throw new WillBequestException(`Cannot add condition: ${error.message}`, 'conditions');
    }

    this.updateState({
      conditions: updatedConditions,
    });

    // Add domain event for condition addition
    this.addDomainEvent({
      eventType: 'BequestConditionAdded',
      aggregateId: this.props.willId,
      eventData: {
        bequestId: this.id.toString(),
        beneficiary: this.props.beneficiary.toJSON(),
        condition: condition.toJSON(),
      },
    });
  }

  /**
   * Set alternate beneficiary
   */
  public setAlternateBeneficiary(
    beneficiary: BeneficiaryIdentity,
    conditions?: BequestCondition[],
  ): void {
    beneficiary.validate();

    if (beneficiary.equals(this.props.beneficiary)) {
      throw new WillBequestException(
        'Alternate beneficiary cannot be the same as primary beneficiary',
        'alternateBeneficiary',
      );
    }

    this.updateState({
      alternateBeneficiary: beneficiary,
      alternateConditions: conditions || [],
    });

    // Add domain event for alternate beneficiary
    this.addDomainEvent({
      eventType: 'AlternateBeneficiarySet',
      aggregateId: this.props.willId,
      eventData: {
        bequestId: this.id.toString(),
        primaryBeneficiary: this.props.beneficiary.toJSON(),
        alternateBeneficiary: beneficiary.toJSON(),
      },
    });
  }

  /**
   * Check if bequest takes effect (based on conditions)
   */
  public checkTakesEffect(facts: Record<string, any>): {
    takesEffect: boolean;
    unmetConditions: string[];
    warnings: string[];
  } {
    const unmetConditions: string[] = [];
    const warnings: string[] = [];

    // Check all conditions
    for (const condition of this.props.conditions) {
      if (!condition.evaluate(facts)) {
        unmetConditions.push(condition.getDescription());
      }
    }

    // Check if alternate beneficiary conditions are met
    if (this.props.alternateBeneficiary && this.props.alternateConditions) {
      let allAlternateConditionsMet = true;
      for (const condition of this.props.alternateConditions) {
        if (!condition.evaluate(facts)) {
          allAlternateConditionsMet = false;
          warnings.push(`Alternate condition not met: ${condition.getDescription()}`);
          break;
        }
      }

      if (allAlternateConditionsMet && unmetConditions.length > 0) {
        warnings.push('Primary conditions not met, but alternate conditions are met');
      }
    }

    const takesEffect = unmetConditions.length === 0;

    return { takesEffect, unmetConditions, warnings };
  }

  /**
   * Get bequest value summary
   */
  public getValueSummary(): {
    type: string;
    value: any;
    description: string;
  } {
    let value: any;
    let description: string;

    switch (this.props.bequestType) {
      case 'SPECIFIC_ASSET':
        value = this.props.specificAssetId;
        description = `Specific asset: ${this.props.specificAssetId}`;
        break;
      case 'PERCENTAGE':
        value = `${this.props.percentage}%`;
        description = `Percentage: ${this.props.percentage}% of estate`;
        break;
      case 'FIXED_AMOUNT':
        value = this.props.fixedAmount?.toString();
        description = `Fixed amount: ${this.props.fixedAmount?.toString()}`;
        break;
      case 'RESIDUARY':
        value = `${this.props.residuaryShare} share`;
        description = `Residuary share: ${this.props.residuaryShare}`;
        break;
      case 'LIFE_INTEREST':
        value = this.props.lifeInterestDetails?.durationType;
        description = `Life interest: ${this.props.lifeInterestDetails?.durationType}`;
        break;
      case 'TRUST':
        value = this.props.trustDetails?.trustPurpose;
        description = `Trust: ${this.props.trustDetails?.trustPurpose}`;
        break;
      default:
        value = 'N/A';
        description = this.props.description;
    }

    return { type: this.props.bequestType, value, description };
  }

  /**
   * Get legal risk assessment
   */
  public getRiskAssessment(): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    reasons: string[];
    recommendations: string[];
  } {
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Check for high-risk conditions
    if (this.props.conditions.some((c) => c.toJSON().type === 'MARRIAGE')) {
      const condition = this.props.conditions.find((c) => c.toJSON().type === 'MARRIAGE');
      const params = condition?.toJSON().parameters;

      if (params?.marriageAllowed === false) {
        reasons.push('Condition against marriage may be unenforceable in Kenyan courts');
        recommendations.push('Reconsider or rephrase marriage condition');
      }
    }

    // Check for vague conditions
    const vagueKeywords = ['reasonable', 'suitable', 'adequate', 'as determined by'];
    if (this.props.description.toLowerCase().includes(vagueKeywords.join('|'))) {
      reasons.push('Bequest contains vague language that may lead to disputes');
      recommendations.push('Use specific, measurable terms in bequest description');
    }

    // Check for S.26 dependant provision risks
    if (this.props.beneficiary.toJSON().relationship?.includes('DEPENDANT')) {
      reasons.push('Beneficiary may be a dependant under S.26 LSA - will may be challenged');
      recommendations.push('Consider making reasonable provision for dependant');
    }

    // Check for hotchpot implications
    if (this.props.isSubjectToHotchpot) {
      reasons.push('Bequest may be subject to hotchpot adjustment (S.35 LSA)');
      recommendations.push('Consider inter vivos gifts when calculating shares');
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (reasons.some((r) => r.includes('unenforceable') || r.includes('S.26'))) {
      riskLevel = 'HIGH';
    } else if (reasons.length > 0) {
      riskLevel = 'MEDIUM';
    }

    return { riskLevel, reasons, recommendations };
  }

  // Getters
  get willId(): string {
    return this.props.willId;
  }

  get beneficiary(): BeneficiaryIdentity {
    return this.props.beneficiary;
  }

  get bequestType(): BequestType {
    return this.props.bequestType;
  }

  get specificAssetId(): string | undefined {
    return this.props.specificAssetId;
  }

  get percentage(): number | undefined {
    return this.props.percentage;
  }

  get fixedAmount(): Money | undefined {
    return this.props.fixedAmount;
  }

  get residuaryShare(): number | undefined {
    return this.props.residuaryShare;
  }

  get lifeInterestDetails(): WillBequestProps['lifeInterestDetails'] | undefined {
    return this.props.lifeInterestDetails ? { ...this.props.lifeInterestDetails } : undefined;
  }

  get trustDetails(): WillBequestProps['trustDetails'] | undefined {
    return this.props.trustDetails ? { ...this.props.trustDetails } : undefined;
  }

  get conditions(): BequestCondition[] {
    return [...this.props.conditions];
  }

  get priority(): BequestPriority {
    return this.props.priority;
  }

  get executionOrder(): number {
    return this.props.executionOrder;
  }

  get alternateBeneficiary(): BeneficiaryIdentity | undefined {
    return this.props.alternateBeneficiary;
  }

  get alternateConditions(): BequestCondition[] {
    return this.props.alternateConditions ? [...this.props.alternateConditions] : [];
  }

  get description(): string {
    return this.props.description;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get isVested(): boolean {
    return this.props.isVested;
  }

  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }

  get isValid(): boolean {
    return this.props.isValid;
  }

  get validationErrors(): string[] {
    return [...this.props.validationErrors];
  }
}
