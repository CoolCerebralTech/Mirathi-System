import { AggregateRoot } from '@nestjs/cqrs';
import { BequestType, BequestConditionType, DistributionStatus } from '@prisma/client';
import { SharePercentage } from '../value-objects/share-percentage.vo';
import { AssetValue } from '../value-objects/asset-value.vo';
import { BeneficiaryAssignedEvent } from '../events/beneficiary-assigned.event';
import { BeneficiaryConditionAddedEvent } from '../events/beneficiary-condition-added.event';
import { BeneficiaryShareUpdatedEvent } from '../events/beneficiary-share-updated.event';
import { BeneficiaryDistributedEvent } from '../events/beneficiary-distributed.event';
import { BeneficiaryRemovedEvent } from '../events/beneficiary-removed.event';

/**
 * Represents the identity of a beneficiary in Kenyan succession law
 * A beneficiary can be a registered user, family member, or external entity
 * @interface BeneficiaryIdentity
 */
export interface BeneficiaryIdentity {
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalContact?: string;
  relationship?: string;
}

/**
 * Data structure for asset valuation information
 * @interface AssetValueData
 */
export interface AssetValueData {
  amount: number;
  currency: string;
  valuationDate: Date | string;
}

/**
 * Properties required for entity reconstitution from persistence
 * @interface BeneficiaryReconstituteProps
 */
export interface BeneficiaryReconstituteProps {
  id: string;
  willId: string;
  assetId: string;
  beneficiaryIdentity: BeneficiaryIdentity;
  bequestType: BequestType;
  sharePercentage: number | null;
  specificAmount: AssetValueData | AssetValue | null;
  conditionType: BequestConditionType;
  conditionDetails: string | null;
  alternateBeneficiaryId: string | null;
  alternateShare: number | null;
  distributionStatus: DistributionStatus;
  distributedAt: Date | string | null;
  distributionNotes: string | null;
  priority: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Beneficiary Assignment Entity representing inheritance rights under Kenyan succession law
 *
 * Core Domain Entity for managing:
 * - User beneficiaries (registered platform users)
 * - Family member beneficiaries (non-registered family members)
 * - External beneficiaries (charities, organizations, non-family)
 * - Conditional bequests with Kenyan legal compliance
 *
 * @class BeneficiaryAssignment
 * @extends {AggregateRoot}
 */
export class BeneficiaryAssignment extends AggregateRoot {
  // Core Assignment Properties
  private readonly _id: string;
  private readonly _willId: string;
  private readonly _assetId: string;
  private readonly _beneficiaryIdentity: BeneficiaryIdentity;
  private _bequestType: BequestType;
  private _sharePercentage: SharePercentage | null;
  private _specificAmount: AssetValue | null;
  private _conditionType: BequestConditionType;
  private _conditionDetails: string | null;
  private _alternateBeneficiaryId: string | null;
  private _alternateShare: SharePercentage | null;
  private _distributionStatus: DistributionStatus;
  private _distributedAt: Date | null;
  private _distributionNotes: string | null;
  private _priority: number;

  // Audit Trail
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // PRIVATE CONSTRUCTOR - Enforces use of factory methods
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    willId: string,
    assetId: string,
    identity: BeneficiaryIdentity,
    bequestType: BequestType,
    priority: number = 1,
  ) {
    super();

    // Validate required parameters
    if (!id?.trim()) throw new Error('Beneficiary assignment ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');
    if (!assetId?.trim()) throw new Error('Asset ID is required');

    BeneficiaryAssignment.validateIdentity(identity);

    this._id = id;
    this._willId = willId;
    this._assetId = assetId;
    this._beneficiaryIdentity = { ...identity };
    this._bequestType = bequestType;
    this._priority = priority;

    // Initialize default values
    this._sharePercentage = null;
    this._specificAmount = null;
    this._conditionType = BequestConditionType.NONE;
    this._conditionDetails = null;
    this._alternateBeneficiaryId = null;
    this._alternateShare = null;
    this._distributionStatus = DistributionStatus.PENDING;
    this._distributedAt = null;
    this._distributionNotes = null;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS - Domain Lifecycle Management
  // --------------------------------------------------------------------------

  /**
   * Creates a beneficiary assignment for a registered platform user
   *
   * @static
   * @param {string} id - Unique assignment identifier
   * @param {string} willId - Will containing the bequest
   * @param {string} assetId - Asset being bequeathed
   * @param {string} userId - Registered user ID of beneficiary
   * @param {BequestType} bequestType - Type of bequest under Kenyan law
   * @param {string} [relationship] - Relationship to testator
   * @returns {BeneficiaryAssignment} New beneficiary assignment
   */
  static createForUser(
    id: string,
    willId: string,
    assetId: string,
    userId: string,
    bequestType: BequestType,
    relationship?: string,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = {
      userId: userId.trim(),
      relationship: relationship?.trim(),
    };

    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryIdentity,
        assignment._bequestType,
      ),
    );

    return assignment;
  }

  /**
   * Creates a beneficiary assignment for a family member
   *
   * @static
   * @param {string} id - Unique assignment identifier
   * @param {string} willId - Will containing the bequest
   * @param {string} assetId - Asset being bequeathed
   * @param {string} familyMemberId - Family member ID of beneficiary
   * @param {BequestType} bequestType - Type of bequest under Kenyan law
   * @returns {BeneficiaryAssignment} New beneficiary assignment
   */
  static createForFamilyMember(
    id: string,
    willId: string,
    assetId: string,
    familyMemberId: string,
    bequestType: BequestType,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = {
      familyMemberId: familyMemberId.trim(),
    };

    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryIdentity,
        assignment._bequestType,
      ),
    );

    return assignment;
  }

  /**
   * Creates a beneficiary assignment for external entities (charities, organizations)
   *
   * @static
   * @param {string} id - Unique assignment identifier
   * @param {string} willId - Will containing the bequest
   * @param {string} assetId - Asset being bequeathed
   * @param {string} externalName - Name of external beneficiary
   * @param {string} [externalContact] - Contact information
   * @param {BequestType} [bequestType=BequestType.SPECIFIC] - Type of bequest
   * @returns {BeneficiaryAssignment} New beneficiary assignment
   */
  static createForExternal(
    id: string,
    willId: string,
    assetId: string,
    externalName: string,
    externalContact?: string,
    bequestType: BequestType = BequestType.SPECIFIC,
  ): BeneficiaryAssignment {
    const identity: BeneficiaryIdentity = {
      externalName: externalName.trim(),
      externalContact: externalContact?.trim(),
    };

    const assignment = new BeneficiaryAssignment(id, willId, assetId, identity, bequestType);

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryIdentity,
        assignment._bequestType,
      ),
    );

    return assignment;
  }

  /**
   * Reconstructs BeneficiaryAssignment entity from persistence layer data
   *
   * @static
   * @param {BeneficiaryReconstituteProps} props - Data from database
   * @returns {BeneficiaryAssignment} Rehydrated beneficiary assignment
   * @throws {Error} When data validation fails during reconstruction
   */
  static reconstitute(props: BeneficiaryReconstituteProps): BeneficiaryAssignment {
    // Validate required reconstruction data
    if (!props.id || !props.willId || !props.assetId) {
      throw new Error('Invalid reconstruction data: missing required fields');
    }

    BeneficiaryAssignment.validateIdentity(props.beneficiaryIdentity);

    const assignment = new BeneficiaryAssignment(
      props.id,
      props.willId,
      props.assetId,
      props.beneficiaryIdentity,
      props.bequestType,
      props.priority,
    );

    // Hydrate additional properties with type safety
    assignment._conditionType = props.conditionType;
    assignment._conditionDetails = props.conditionDetails || null;
    assignment._alternateBeneficiaryId = props.alternateBeneficiaryId || null;
    assignment._distributionStatus = props.distributionStatus;
    assignment._distributionNotes = props.distributionNotes || null;

    // Reconstruct Value Objects with proper typing
    if (props.sharePercentage !== null && props.sharePercentage !== undefined) {
      assignment._sharePercentage = BeneficiaryAssignment.reconstructSharePercentage(
        props.sharePercentage,
      );
    }

    if (props.specificAmount) {
      assignment._specificAmount = BeneficiaryAssignment.reconstructAssetValue(
        props.specificAmount,
      );
    }

    if (props.alternateShare !== null && props.alternateShare !== undefined) {
      assignment._alternateShare = BeneficiaryAssignment.reconstructSharePercentage(
        props.alternateShare,
      );
    }

    // Handle date conversions safely
    assignment._distributedAt = props.distributedAt
      ? BeneficiaryAssignment.safeDateConversion(props.distributedAt, 'distributedAt')
      : null;
    assignment._createdAt = BeneficiaryAssignment.safeDateConversion(props.createdAt, 'createdAt');
    assignment._updatedAt = BeneficiaryAssignment.safeDateConversion(props.updatedAt, 'updatedAt');

    return assignment;
  }

  /**
   * Safely converts date strings to Date objects with validation
   *
   * @private
   * @static
   * @param {Date | string} dateInput - Date to convert
   * @param {string} fieldName - Field name for error reporting
   * @returns {Date} Valid Date object
   * @throws {Error} When date conversion fails
   */
  private static safeDateConversion(dateInput: Date | string, fieldName: string): Date {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date value for ${fieldName}`);
      }
      return date;
    } catch (error) {
      throw new Error(
        `Failed to convert ${fieldName} to valid Date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Reconstructs SharePercentage from raw number or existing instance
   *
   * @private
   * @static
   * @param {number | SharePercentage} shareData - Share data to reconstruct
   * @returns {SharePercentage} Reconstructed SharePercentage instance
   * @throws {Error} When share data is invalid
   */
  private static reconstructSharePercentage(shareData: number | SharePercentage): SharePercentage {
    if (shareData instanceof SharePercentage) {
      return shareData;
    }

    if (typeof shareData !== 'number' || isNaN(shareData)) {
      throw new Error('Invalid share percentage data: must be number or SharePercentage instance');
    }

    return new SharePercentage(shareData);
  }

  /**
   * Reconstructs AssetValue from raw data or existing instance
   *
   * @private
   * @static
   * @param {AssetValueData | AssetValue} valueData - Value data to reconstruct
   * @returns {AssetValue} Reconstructed AssetValue instance
   * @throws {Error} When value data is invalid
   */
  private static reconstructAssetValue(valueData: AssetValueData | AssetValue): AssetValue {
    if (valueData instanceof AssetValue) {
      return valueData;
    }

    if (typeof valueData !== 'object' || valueData === null) {
      throw new Error('Invalid asset value data: must be object or AssetValue instance');
    }

    if (typeof valueData.amount !== 'number' || valueData.amount < 0) {
      throw new Error('Invalid asset value: amount must be non-negative number');
    }

    if (typeof valueData.currency !== 'string' || !valueData.currency.trim()) {
      throw new Error('Invalid asset value: currency is required');
    }

    const valuationDate = BeneficiaryAssignment.safeDateConversion(
      valueData.valuationDate,
      'valuationDate',
    );

    return new AssetValue(valueData.amount, valueData.currency.trim(), valuationDate);
  }

  /**
   * Validates beneficiary identity structure
   *
   * @private
   * @static
   * @param {BeneficiaryIdentity} identity - Identity to validate
   * @throws {Error} When identity structure is invalid
   */
  private static validateIdentity(identity: BeneficiaryIdentity): void {
    const hasUserId = Boolean(identity.userId?.trim());
    const hasFamilyMemberId = Boolean(identity.familyMemberId?.trim());
    const hasExternalName = Boolean(identity.externalName?.trim());

    const identityCount =
      (hasUserId ? 1 : 0) + (hasFamilyMemberId ? 1 : 0) + (hasExternalName ? 1 : 0);

    if (identityCount === 0) {
      throw new Error(
        'Beneficiary must have exactly one form of identification (User ID, Family Member ID, or External Name)',
      );
    }

    if (identityCount > 1) {
      throw new Error('Beneficiary cannot have multiple forms of identification simultaneously');
    }
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC & DOMAIN OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Updates percentage share allocation for percentage/residuary bequests
   *
   * @param {SharePercentage} share - Percentage share (0-100%)
   * @param {string} [updatedBy] - User ID of person making update
   * @throws {Error} When bequest type doesn't support shares or share is invalid
   */
  updateShare(share: SharePercentage, updatedBy?: string): void {
    if (
      this._bequestType !== BequestType.PERCENTAGE &&
      this._bequestType !== BequestType.RESIDUARY
    ) {
      throw new Error('Share percentage can only be set for PERCENTAGE or RESIDUARY bequests');
    }

    this._sharePercentage = share;
    this._specificAmount = null; // Mutual exclusion
    this._updatedAt = new Date();

    if (updatedBy?.trim()) {
      this.apply(
        new BeneficiaryShareUpdatedEvent(
          this._id,
          this._willId,
          this._bequestType,
          share,
          null,
          updatedBy.trim(),
        ),
      );
    }
  }

  /**
   * Updates specific amount allocation for specific bequests
   *
   * @param {AssetValue} amount - Specific monetary amount
   * @param {string} [updatedBy] - User ID of person making update
   * @throws {Error} When bequest type doesn't support specific amounts
   */
  updateSpecificAmount(amount: AssetValue, updatedBy?: string): void {
    if (this._bequestType !== BequestType.SPECIFIC) {
      throw new Error('Specific amount can only be set for SPECIFIC bequests');
    }

    this._specificAmount = amount;
    this._sharePercentage = null; // Mutual exclusion
    this._updatedAt = new Date();

    if (updatedBy?.trim()) {
      this.apply(
        new BeneficiaryShareUpdatedEvent(
          this._id,
          this._willId,
          this._bequestType,
          null,
          amount,
          updatedBy.trim(),
        ),
      );
    }
  }

  /**
   * Adds conditional requirement to bequest under Kenyan law
   *
   * @param {BequestConditionType} type - Type of condition
   * @param {string} details - Condition details description
   * @throws {Error} When condition details are empty
   */
  addCondition(type: BequestConditionType, details: string): void {
    if (type === BequestConditionType.NONE) {
      this.removeCondition();
      return;
    }

    if (!details?.trim()) {
      throw new Error('Condition details are required');
    }

    this._conditionType = type;
    this._conditionDetails = details.trim();
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryConditionAddedEvent(this._id, this._willId, type, this._conditionDetails),
    );
  }

  /**
   * Removes all conditions from bequest
   */
  removeCondition(): void {
    this._conditionType = BequestConditionType.NONE;
    this._conditionDetails = null;
    this._updatedAt = new Date();
  }

  /**
   * Sets alternate beneficiary for conditional bequests
   *
   * @param {string} alternateBeneficiaryId - ID of alternate beneficiary
   * @param {SharePercentage} share - Share percentage for alternate
   * @throws {Error} When parameters are invalid
   */
  setAlternateBeneficiary(alternateBeneficiaryId: string, share: SharePercentage): void {
    if (!alternateBeneficiaryId?.trim()) {
      throw new Error('Alternate beneficiary ID is required');
    }

    this._alternateBeneficiaryId = alternateBeneficiaryId.trim();
    this._alternateShare = share;
    this._updatedAt = new Date();
  }

  /**
   * Updates distribution priority order
   *
   * @param {number} priority - Priority level (1 = highest)
   * @throws {Error} When priority is less than 1
   */
  updatePriority(priority: number): void {
    if (priority < 1) {
      throw new Error('Priority must be at least 1');
    }

    this._priority = priority;
    this._updatedAt = new Date();
  }

  /**
   * Marks bequest as distributed (succession execution phase)
   *
   * @param {string} [notes] - Distribution notes or comments
   */
  markAsDistributed(notes?: string): void {
    if (this._distributionStatus === DistributionStatus.COMPLETED) return;

    this._distributionStatus = DistributionStatus.COMPLETED;
    this._distributedAt = new Date();
    this._distributionNotes = notes?.trim() || null;
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryDistributedEvent(
        this._id,
        this._willId,
        this._assetId,
        this._distributedAt,
        this._distributionNotes ?? undefined,
      ),
    );
  }

  /**
   * Marks bequest as in progress during distribution
   */
  markAsInProgress(): void {
    this._distributionStatus = DistributionStatus.IN_PROGRESS;
    this._updatedAt = new Date();
  }

  /**
   * Marks bequest as disputed under Kenyan succession law
   */
  markAsDisputed(): void {
    this._distributionStatus = DistributionStatus.DISPUTED;
    this._updatedAt = new Date();
  }

  /**
   * Marks bequest as deferred (conditions not yet met)
   */
  markAsDeferred(): void {
    this._distributionStatus = DistributionStatus.DEFERRED;
    this._updatedAt = new Date();
  }

  /**
   * Initiates removal of beneficiary assignment with reason
   *
   * @param {string} [reason] - Reason for removal
   */
  remove(reason?: string): void {
    this.apply(new BeneficiaryRemovedEvent(this._id, this._willId, reason?.trim() || undefined));
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS & BUSINESS RULES
  // --------------------------------------------------------------------------

  /**
   * Determines if bequest has conditional requirements
   *
   * @returns {boolean} True if conditional bequest
   */
  isConditional(): boolean {
    return this._conditionType !== BequestConditionType.NONE;
  }

  /**
   * Determines if bequest has alternate beneficiary configured
   *
   * @returns {boolean} True if alternate beneficiary exists
   */
  hasAlternate(): boolean {
    return Boolean(this._alternateBeneficiaryId && this._alternateShare);
  }

  /**
   * Determines if bequest has been fully distributed
   *
   * @returns {boolean} True if distribution completed
   */
  isDistributed(): boolean {
    return this._distributionStatus === DistributionStatus.COMPLETED;
  }

  /**
   * Determines if bequest can be distributed
   *
   * @returns {boolean} True if distribution can proceed
   */
  canBeDistributed(): boolean {
    return (
      this._distributionStatus === DistributionStatus.PENDING ||
      this._distributionStatus === DistributionStatus.IN_PROGRESS
    );
  }

  /**
   * Determines if bequest is pending distribution
   *
   * @returns {boolean} True if pending distribution
   */
  isPending(): boolean {
    return this._distributionStatus === DistributionStatus.PENDING;
  }

  /**
   * Determines if bequest distribution is in progress
   *
   * @returns {boolean} True if distribution in progress
   */
  isInProgress(): boolean {
    return this._distributionStatus === DistributionStatus.IN_PROGRESS;
  }

  /**
   * Determines if bequest is disputed
   *
   * @returns {boolean} True if disputed
   */
  isDisputed(): boolean {
    return this._distributionStatus === DistributionStatus.DISPUTED;
  }

  /**
   * Determines if bequest is deferred
   *
   * @returns {boolean} True if deferred
   */
  isDeferred(): boolean {
    return this._distributionStatus === DistributionStatus.DEFERRED;
  }

  /**
   * Calculates expected value based on asset total and allocation type
   *
   * @param {number} [assetTotalValue] - Total value of the asset
   * @returns {AssetValue | null} Expected value or null if cannot calculate
   */
  getExpectedValue(assetTotalValue?: number): AssetValue | null {
    if (this._sharePercentage && assetTotalValue !== undefined && assetTotalValue > 0) {
      const amount = assetTotalValue * (this._sharePercentage.getValue() / 100);
      // Use KES as default currency for Kenyan succession
      return new AssetValue(amount, 'KES', new Date());
    }

    return this._specificAmount;
  }

  /**
   * Validates if assignment is properly configured for execution
   *
   * @returns {boolean} True if valid for execution
   */
  isValidForExecution(): boolean {
    const hasValidAllocation = Boolean(
      (this._sharePercentage && this._sharePercentage.getValue() > 0) ||
        (this._specificAmount && this._specificAmount.getAmount() > 0),
    );

    const hasValidIdentity = Boolean(
      this._beneficiaryIdentity.userId ||
        this._beneficiaryIdentity.familyMemberId ||
        this._beneficiaryIdentity.externalName,
    );

    return hasValidAllocation && hasValidIdentity && !this.isDistributed();
  }

  /**
   * Determines if alternate beneficiary should be activated
   *
   * @returns {boolean} True if conditions met for alternate activation
   */
  requiresAlternateActivation(): boolean {
    return this.isConditional() && this.hasAlternate();
  }

  /**
   * Validates allocation configuration based on bequest type
   *
   * @returns {boolean} True if allocation is valid
   */
  hasValidAllocation(): boolean {
    if (
      this._bequestType === BequestType.PERCENTAGE ||
      this._bequestType === BequestType.RESIDUARY
    ) {
      return Boolean(this._sharePercentage && this._sharePercentage.getValue() > 0);
    } else if (this._bequestType === BequestType.SPECIFIC) {
      return Boolean(this._specificAmount && this._specificAmount.getAmount() > 0);
    }

    return false;
  }

  /**
   * Determines if assignment is fully configured
   *
   * @returns {boolean} True if fully configured
   */
  isFullyConfigured(): boolean {
    return this.hasValidAllocation() && this.isValidForExecution();
  }

  /**
   * Gets human-readable beneficiary name
   *
   * @returns {string} Beneficiary display name
   */
  getBeneficiaryName(): string {
    if (this._beneficiaryIdentity.userId) {
      return `User ${this._beneficiaryIdentity.userId}`;
    } else if (this._beneficiaryIdentity.familyMemberId) {
      return `Family Member ${this._beneficiaryIdentity.familyMemberId}`;
    } else if (this._beneficiaryIdentity.externalName) {
      return this._beneficiaryIdentity.externalName;
    }

    return 'Unknown Beneficiary';
  }

  /**
   * Gets beneficiary type category
   *
   * @returns {'USER' | 'FAMILY_MEMBER' | 'EXTERNAL'} Beneficiary type
   * @throws {Error} When identity is invalid
   */
  getBeneficiaryType(): 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL' {
    if (this._beneficiaryIdentity.userId) return 'USER';
    if (this._beneficiaryIdentity.familyMemberId) return 'FAMILY_MEMBER';
    if (this._beneficiaryIdentity.externalName) return 'EXTERNAL';

    throw new Error('Invalid beneficiary identity configuration');
  }

  /**
   * Gets validation errors for assignment configuration
   *
   * @returns {string[]} Array of validation error messages
   */
  getValidationErrors(): string[] {
    const errors: string[] = [];

    if (!this.hasValidAllocation()) {
      errors.push('Beneficiary assignment has no valid allocation configured');
    }

    const hasValidIdentity = Boolean(
      this._beneficiaryIdentity.userId ||
        this._beneficiaryIdentity.familyMemberId ||
        this._beneficiaryIdentity.externalName,
    );

    if (!hasValidIdentity) {
      errors.push('Beneficiary has no valid identity information');
    }

    if (this.isDistributed()) {
      errors.push('Beneficiary assignment has already been distributed');
    }

    return errors;
  }

  // --------------------------------------------------------------------------
  // IMMUTABLE GETTERS - Provide read-only access to entity state
  // --------------------------------------------------------------------------

  get id(): string {
    return this._id;
  }
  get willId(): string {
    return this._willId;
  }
  get assetId(): string {
    return this._assetId;
  }
  get beneficiaryIdentity(): BeneficiaryIdentity {
    return { ...this._beneficiaryIdentity };
  }
  get bequestType(): BequestType {
    return this._bequestType;
  }
  get sharePercentage(): SharePercentage | null {
    return this._sharePercentage;
  }
  get specificAmount(): AssetValue | null {
    return this._specificAmount;
  }
  get conditionType(): BequestConditionType {
    return this._conditionType;
  }
  get conditionDetails(): string | null {
    return this._conditionDetails;
  }
  get alternateBeneficiaryId(): string | null {
    return this._alternateBeneficiaryId;
  }
  get alternateShare(): SharePercentage | null {
    return this._alternateShare;
  }
  get distributionStatus(): DistributionStatus {
    return this._distributionStatus;
  }
  get distributedAt(): Date | null {
    return this._distributedAt ? new Date(this._distributedAt) : null;
  }
  get distributionNotes(): string | null {
    return this._distributionNotes;
  }
  get priority(): number {
    return this._priority;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
