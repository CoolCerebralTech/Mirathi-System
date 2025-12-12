import { AggregateRoot } from '@nestjs/cqrs';
import {
  BeneficiaryType,
  BequestConditionType,
  BequestPriority,
  BequestType,
  DistributionStatus,
  KenyanRelationshipCategory,
} from '@prisma/client';

import { BeneficiaryAssignedEvent } from '../events/beneficiary-assigned.event';
import { BeneficiaryConditionAddedEvent } from '../events/beneficiary-condition-added.event';
import { BeneficiaryDistributedEvent } from '../events/beneficiary-distributed.event';
import { BeneficiaryLifeInterestSetEvent } from '../events/beneficiary-life-interest-set.event';
import { BeneficiaryLifeInterestTerminatedEvent } from '../events/beneficiary-life-interest-terminated.event';
import { BeneficiaryRemovedEvent } from '../events/beneficiary-removed.event';
import { BeneficiaryShareUpdatedEvent } from '../events/beneficiary-share-updated.event';

/**
 * Properties required for entity reconstitution from persistence
 * Strictly aligned with Prisma Schema.
 */
export interface BeneficiaryReconstituteProps {
  id: string;
  willId: string;
  assetId: string;

  // Beneficiary Identity
  beneficiaryType: BeneficiaryType;
  userId: string | null;
  familyMemberId: string | null;
  externalName: string | null;
  externalContact: string | null;
  externalIdentification: string | null;
  externalAddress: Record<string, any> | null;

  // Kenyan Relationship Context
  relationshipCategory: KenyanRelationshipCategory;
  specificRelationship: string | null;
  isDependant: boolean;

  // Bequest Configuration
  bequestType: BequestType;
  sharePercent: number | null;
  specificAmount: number | null;
  currency: string;

  // Life Interest Support (Section 37 - Law of Succession Act)
  hasLifeInterest: boolean;
  lifeInterestDuration: number | null;
  lifeInterestEndsAt: Date | string | null;

  // Conditions for Kenyan Law
  conditionType: BequestConditionType;
  conditionDetails: string | null;
  conditionMet: boolean | null;
  conditionDeadline: Date | string | null;

  // Alternate Beneficiary
  alternateAssignmentId: string | null;

  // Distribution Tracking
  distributionStatus: DistributionStatus;
  distributedAt: Date | string | null;
  distributionNotes: string | null;
  distributionMethod: string | null;

  // Legal Compliance (Kenyan Law)
  isSubjectToDependantsProvision: boolean;
  courtApprovalRequired: boolean;
  courtApprovalObtained: boolean;

  // Priority & Order
  priority: number;
  bequestPriority: BequestPriority;

  // Audit Trail
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Beneficiary Assignment Entity
 *
 * Represents the assignment of an Asset to a Beneficiary within a Will.
 *
 * Legal Context:
 * - Governed by Law of Succession Act (Cap 160).
 * - Section 26 & 29: Provisions for Dependants.
 * - Section 37: Life Interest for Spouses.
 */
export class BeneficiaryAssignment extends AggregateRoot {
  // Core Assignment Properties
  private readonly _id: string;
  private readonly _willId: string;
  private readonly _assetId: string;

  // Beneficiary Identity
  private readonly _beneficiaryType: BeneficiaryType;
  private _userId: string | null;
  private _familyMemberId: string | null;
  private _externalName: string | null;
  private _externalContact: string | null;
  private _externalIdentification: string | null;
  private _externalAddress: Record<string, any> | null;

  // Kenyan Relationship Context
  private _relationshipCategory: KenyanRelationshipCategory;
  private _specificRelationship: string | null;
  private _isDependant: boolean;

  // Bequest Configuration
  private _bequestType: BequestType;
  private _sharePercent: number | null;
  private _specificAmount: number | null;
  private readonly _currency: string;

  // Life Interest Support (Section 37 - Law of Succession Act)
  private _hasLifeInterest: boolean;
  private _lifeInterestDuration: number | null;
  private _lifeInterestEndsAt: Date | null;

  // Conditions (Section 11 - Law of Succession Act)
  private _conditionType: BequestConditionType;
  private _conditionDetails: string | null;
  private _conditionMet: boolean | null;
  private _conditionDeadline: Date | null;

  // Alternate Beneficiary (Section 13 - Lapse provisions)
  private _alternateAssignmentId: string | null;

  // Distribution Tracking
  private _distributionStatus: DistributionStatus;
  private _distributedAt: Date | null;
  private _distributionNotes: string | null;
  private _distributionMethod: string | null;

  // Legal Compliance (Section 26-29 - Dependants' Provision)
  private _isSubjectToDependantsProvision: boolean;
  private _courtApprovalRequired: boolean;
  private _courtApprovalObtained: boolean;

  // Priority & Order
  private _priority: number;
  private _bequestPriority: BequestPriority;

  // Timestamps
  private _createdAt: Date;
  private _updatedAt: Date;

  // --------------------------------------------------------------------------
  // CONSTRUCTOR
  // --------------------------------------------------------------------------
  private constructor(
    id: string,
    willId: string,
    assetId: string,
    beneficiaryType: BeneficiaryType,
    relationshipCategory: KenyanRelationshipCategory,
    bequestType: BequestType = BequestType.SPECIFIC,
    currency: string = 'KES',
  ) {
    super();

    if (!id?.trim()) throw new Error('Beneficiary assignment ID is required');
    if (!willId?.trim()) throw new Error('Will ID is required');
    if (!assetId?.trim()) throw new Error('Asset ID is required');
    if (!beneficiaryType) throw new Error('Beneficiary type is required');
    if (!relationshipCategory) throw new Error('Relationship category is required');

    this._id = id;
    this._willId = willId;
    this._assetId = assetId;
    this._beneficiaryType = beneficiaryType;
    this._relationshipCategory = relationshipCategory;
    this._bequestType = bequestType;
    this._currency = currency;

    // Defaults
    this._userId = null;
    this._familyMemberId = null;
    this._externalName = null;
    this._externalContact = null;
    this._externalIdentification = null;
    this._externalAddress = null;
    this._specificRelationship = null;
    this._isDependant = false;

    // Bequest defaults
    this._sharePercent = null;
    this._specificAmount = null;

    // Life Interest defaults (matches Prisma schema)
    this._hasLifeInterest = false;
    this._lifeInterestDuration = null;
    this._lifeInterestEndsAt = null;

    // Conditions defaults
    this._conditionType = BequestConditionType.NONE;
    this._conditionDetails = null;
    this._conditionMet = null;
    this._conditionDeadline = null;

    // Alternate beneficiary
    this._alternateAssignmentId = null;

    // Distribution defaults
    this._distributionStatus = DistributionStatus.PENDING;
    this._distributedAt = null;
    this._distributionNotes = null;
    this._distributionMethod = null;

    // Legal compliance defaults
    this._isSubjectToDependantsProvision = false;
    this._courtApprovalRequired = false;
    this._courtApprovalObtained = false;

    // Priority defaults
    this._priority = 1;
    this._bequestPriority = BequestPriority.PRIMARY;

    // Timestamps
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static createForUser(
    id: string,
    willId: string,
    assetId: string,
    userId: string,
    relationshipCategory: KenyanRelationshipCategory,
    specificRelationship?: string,
    isDependant: boolean = false,
  ): BeneficiaryAssignment {
    if (!userId?.trim()) throw new Error('User ID is required');

    const assignment = new BeneficiaryAssignment(
      id,
      willId,
      assetId,
      BeneficiaryType.USER,
      relationshipCategory,
    );
    assignment._userId = userId;
    assignment._specificRelationship = specificRelationship || null;
    assignment._isDependant = isDependant;

    // Dependants automatically subject to Section 26-29 protections
    if (isDependant) {
      assignment._isSubjectToDependantsProvision = true;
    }

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryType,
        assignment._userId,
        assignment._relationshipCategory,
      ),
    );
    return assignment;
  }

  static createForFamilyMember(
    id: string,
    willId: string,
    assetId: string,
    familyMemberId: string,
    relationshipCategory: KenyanRelationshipCategory,
    specificRelationship?: string,
    isDependant: boolean = false,
  ): BeneficiaryAssignment {
    if (!familyMemberId?.trim()) throw new Error('Family member ID is required');

    const assignment = new BeneficiaryAssignment(
      id,
      willId,
      assetId,
      BeneficiaryType.FAMILY_MEMBER,
      relationshipCategory,
    );
    assignment._familyMemberId = familyMemberId;
    assignment._specificRelationship = specificRelationship || null;
    assignment._isDependant = isDependant;

    // Dependants automatically subject to Section 26-29 protections
    if (isDependant) {
      assignment._isSubjectToDependantsProvision = true;
    }

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryType,
        assignment._familyMemberId,
        assignment._relationshipCategory,
      ),
    );
    return assignment;
  }

  static createForExternal(
    id: string,
    willId: string,
    assetId: string,
    externalName: string,
    relationshipCategory: KenyanRelationshipCategory,
    externalContact?: string,
    externalIdentification?: string,
    externalAddress?: Record<string, any>,
  ): BeneficiaryAssignment {
    if (!externalName?.trim()) throw new Error('External name is required');

    const assignment = new BeneficiaryAssignment(
      id,
      willId,
      assetId,
      BeneficiaryType.EXTERNAL,
      relationshipCategory,
    );
    assignment._externalName = externalName.trim();
    assignment._externalContact = externalContact?.trim() || null;
    assignment._externalIdentification = externalIdentification?.trim() || null;
    assignment._externalAddress = externalAddress || null;

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryType,
        assignment._externalName,
        assignment._relationshipCategory,
      ),
    );
    return assignment;
  }

  static createForCharity(
    id: string,
    willId: string,
    assetId: string,
    charityName: string,
    registrationNumber?: string,
    contact?: string,
  ): BeneficiaryAssignment {
    if (!charityName?.trim()) throw new Error('Charity name is required');

    const assignment = new BeneficiaryAssignment(
      id,
      willId,
      assetId,
      BeneficiaryType.CHARITY,
      KenyanRelationshipCategory.NON_FAMILY,
    );
    assignment._externalName = charityName;
    assignment._externalContact = contact || null;
    assignment._externalIdentification = registrationNumber || null;

    assignment.apply(
      new BeneficiaryAssignedEvent(
        assignment._id,
        assignment._willId,
        assignment._assetId,
        assignment._beneficiaryType,
        assignment._externalName,
        assignment._relationshipCategory,
      ),
    );
    return assignment;
  }

  static reconstitute(props: BeneficiaryReconstituteProps): BeneficiaryAssignment {
    const assignment = new BeneficiaryAssignment(
      props.id,
      props.willId,
      props.assetId,
      props.beneficiaryType,
      props.relationshipCategory,
      props.bequestType,
      props.currency,
    );

    // Beneficiary Identity
    assignment._userId = props.userId;
    assignment._familyMemberId = props.familyMemberId;
    assignment._externalName = props.externalName;
    assignment._externalContact = props.externalContact;
    assignment._externalIdentification = props.externalIdentification;
    assignment._externalAddress = props.externalAddress;
    assignment._specificRelationship = props.specificRelationship;
    assignment._isDependant = props.isDependant;

    // Bequest Configuration
    assignment._sharePercent = props.sharePercent;
    assignment._specificAmount = props.specificAmount;

    // Life Interest Support
    assignment._hasLifeInterest = props.hasLifeInterest;
    assignment._lifeInterestDuration = props.lifeInterestDuration;
    assignment._lifeInterestEndsAt = props.lifeInterestEndsAt
      ? new Date(props.lifeInterestEndsAt)
      : null;

    // Conditions
    assignment._conditionType = props.conditionType;
    assignment._conditionDetails = props.conditionDetails;
    assignment._conditionMet = props.conditionMet;
    assignment._conditionDeadline = props.conditionDeadline
      ? new Date(props.conditionDeadline)
      : null;

    // Alternate Beneficiary
    assignment._alternateAssignmentId = props.alternateAssignmentId;

    // Distribution Tracking
    assignment._distributionStatus = props.distributionStatus;
    assignment._distributedAt = props.distributedAt ? new Date(props.distributedAt) : null;
    assignment._distributionNotes = props.distributionNotes;
    assignment._distributionMethod = props.distributionMethod;

    // Legal Compliance
    assignment._isSubjectToDependantsProvision = props.isSubjectToDependantsProvision;
    assignment._courtApprovalRequired = props.courtApprovalRequired;
    assignment._courtApprovalObtained = props.courtApprovalObtained;

    // Priority & Order
    assignment._priority = props.priority;
    assignment._bequestPriority = props.bequestPriority;

    // Timestamps
    assignment._createdAt = new Date(props.createdAt);
    assignment._updatedAt = new Date(props.updatedAt);

    return assignment;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - BEQUEST MANAGEMENT
  // --------------------------------------------------------------------------

  public updateSharePercentage(sharePercent: number): void {
    if (
      this._bequestType !== BequestType.PERCENTAGE &&
      this._bequestType !== BequestType.RESIDUARY
    ) {
      throw new Error('Share percentage can only be set for PERCENTAGE or RESIDUARY bequests');
    }

    if (sharePercent < 0 || sharePercent > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    this._sharePercent = sharePercent;
    this._specificAmount = null;
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryShareUpdatedEvent(
        this._id,
        this._willId,
        this._bequestType,
        sharePercent,
        null,
      ),
    );
  }

  public updateSpecificAmount(amount: number): void {
    if (this._bequestType !== BequestType.SPECIFIC) {
      throw new Error('Specific amount can only be set for SPECIFIC bequests');
    }

    if (amount < 0) throw new Error('Specific amount cannot be negative');

    this._specificAmount = amount;
    this._sharePercent = null;
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryShareUpdatedEvent(this._id, this._willId, this._bequestType, null, amount),
    );
  }

  public updateBequestType(bequestType: BequestType): void {
    if (this._bequestType === bequestType) return;

    // Reset values when changing bequest type
    if (bequestType === BequestType.SPECIFIC) {
      this._sharePercent = null;
    } else if (bequestType === BequestType.PERCENTAGE || bequestType === BequestType.RESIDUARY) {
      this._specificAmount = null;
    }

    this._bequestType = bequestType;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - DEPENDANT MANAGEMENT
  // --------------------------------------------------------------------------

  public markAsDependant(): void {
    // Reference: Law of Succession Act, Section 29
    if (this._isDependant) return;

    this._isDependant = true;
    this._isSubjectToDependantsProvision = true;
    this._updatedAt = new Date();
  }

  public removeDependantStatus(): void {
    if (!this._isDependant) return;

    this._isDependant = false;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - LIFE INTEREST MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Grant life interest to beneficiary (typically for spouse)
   * Section 37 of Law of Succession Act - Life Interest
   *
   * @param durationMonths Duration in months
   * @param endsAt Optional specific end date (overrides duration)
   */
  public grantLifeInterest(durationMonths?: number, endsAt?: Date): void {
    if (this._hasLifeInterest) {
      throw new Error('Life interest already granted');
    }

    // Only specific assets can have life interest
    if (this._bequestType !== BequestType.SPECIFIC) {
      throw new Error('Life interest can only be granted for specific assets');
    }

    // Kenyan Law: Typically only for spouses and dependants
    if (!this.isEligibleForLifeInterest()) {
      throw new Error('Beneficiary is not eligible for life interest under Kenyan law');
    }

    if (durationMonths && durationMonths <= 0) {
      throw new Error('Life interest duration must be positive');
    }

    this._hasLifeInterest = true;
    this._lifeInterestDuration = durationMonths || null;

    if (endsAt) {
      this._lifeInterestEndsAt = endsAt;
    } else if (durationMonths) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);
      this._lifeInterestEndsAt = endDate;
    } else {
      // Life interest until death of life tenant (no fixed end date)
      this._lifeInterestEndsAt = null;
    }

    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryLifeInterestSetEvent(
        this._id,
        this._willId,
        this.getBeneficiaryIdentifier(),
        durationMonths,
        this._lifeInterestEndsAt,
      ),
    );
  }

  /**
   * Terminate life interest (e.g., on remarriage, death of life tenant)
   */
  public terminateLifeInterest(reason: string): void {
    if (!this._hasLifeInterest) {
      throw new Error('No life interest to terminate');
    }

    const previousEndDate = this._lifeInterestEndsAt;

    this._hasLifeInterest = false;
    this._lifeInterestEndsAt = new Date(); // Terminate immediately

    // Add to distribution notes
    const terminationNote = `Life interest terminated on ${new Date().toISOString().split('T')[0]}: ${reason}`;
    this._distributionNotes = this._distributionNotes
      ? `${this._distributionNotes}; ${terminationNote}`
      : terminationNote;

    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryLifeInterestTerminatedEvent(
        this._id,
        this._willId,
        this.getBeneficiaryIdentifier(),
        reason,
        previousEndDate,
      ),
    );
  }

  /**
   * Check if beneficiary is eligible for life interest under Kenyan law
   */
  private isEligibleForLifeInterest(): boolean {
    // Section 37: Life interest typically for spouse
    if (this._relationshipCategory === KenyanRelationshipCategory.SPOUSE) {
      return true;
    }

    // Can also be granted to dependants in certain circumstances
    if (this._isDependant && this._isSubjectToDependantsProvision) {
      return true;
    }

    // Courts may grant life interest to other categories in special circumstances
    return false;
  }

  /**
   * Check if life interest is currently active
   */
  public isLifeInterestActive(): boolean {
    if (!this._hasLifeInterest) return false;

    // If no end date specified (life interest until death), always active
    if (!this._lifeInterestEndsAt) return true;

    return new Date() <= this._lifeInterestEndsAt;
  }

  /**
   * Get remaining life interest duration in days
   */
  public getRemainingLifeInterestDays(): number | null {
    if (!this._hasLifeInterest || !this._lifeInterestEndsAt) return null;

    const now = new Date();
    const endDate = this._lifeInterestEndsAt;

    if (now >= endDate) return 0;

    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - CONDITION MANAGEMENT
  // --------------------------------------------------------------------------

  public addCondition(type: BequestConditionType, details: string, deadline?: Date): void {
    if (type === BequestConditionType.NONE) {
      this.removeCondition();
      return;
    }

    if (!details?.trim()) throw new Error('Condition details required');

    // Section 11 of Law of Succession Act: Void conditions.
    // Conditions repugnant to the interest given, or illegal/immoral conditions are void.
    if (type === BequestConditionType.MARRIAGE && this._isDependant) {
      throw new Error(
        'Marriage conditions on dependants may be void under Kenyan law (Section 11)',
      );
    }

    this._conditionType = type;
    this._conditionDetails = details.trim();
    this._conditionDeadline = deadline || null;
    this._conditionMet = false;
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryConditionAddedEvent(this._id, this._willId, type, this._conditionDetails),
    );
  }

  private removeCondition(): void {
    this._conditionType = BequestConditionType.NONE;
    this._conditionDetails = null;
    this._conditionMet = null;
    this._conditionDeadline = null;
    this._updatedAt = new Date();
  }

  public markConditionAsMet(): void {
    if (this._conditionType === BequestConditionType.NONE) throw new Error('No condition set');

    this._conditionMet = true;
    this._updatedAt = new Date();
  }

  public markConditionAsNotMet(): void {
    if (this._conditionType === BequestConditionType.NONE) throw new Error('No condition set');

    this._conditionMet = false;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - DISTRIBUTION MANAGEMENT
  // --------------------------------------------------------------------------

  public setAlternateBeneficiary(alternateAssignmentId: string): void {
    if (!alternateAssignmentId?.trim()) throw new Error('Alternate beneficiary ID required');
    this._alternateAssignmentId = alternateAssignmentId.trim();
    this._updatedAt = new Date();
  }

  public markAsDistributed(method: string, notes?: string): void {
    if (this._distributionStatus === DistributionStatus.COMPLETED) {
      throw new Error('Bequest already distributed');
    }

    if (this._courtApprovalRequired && !this._courtApprovalObtained) {
      throw new Error(
        'Court approval required before distribution (Law of Succession Act, Section 26)',
      );
    }

    if (this.isConditional() && !this.isConditionMet()) {
      throw new Error('Condition must be met before distribution');
    }

    if (this.isLifeInterestActive()) {
      throw new Error('Cannot distribute asset with active life interest');
    }

    if (!method?.trim()) throw new Error('Distribution method is required');

    this._distributionStatus = DistributionStatus.COMPLETED;
    this._distributedAt = new Date();
    this._distributionMethod = method.trim();
    this._distributionNotes = notes?.trim() || null;
    this._updatedAt = new Date();

    this.apply(
      new BeneficiaryDistributedEvent(
        this._id,
        this._willId,
        this._assetId,
        this._distributedAt,
        this._distributionMethod,
      ),
    );
  }

  public markDistributionInProgress(method: string): void {
    if (this._distributionStatus === DistributionStatus.COMPLETED) {
      throw new Error('Bequest already distributed');
    }

    this._distributionStatus = DistributionStatus.IN_PROGRESS;
    this._distributionMethod = method.trim();
    this._updatedAt = new Date();
  }

  public cancelDistribution(reason: string): void {
    if (this._distributionStatus !== DistributionStatus.IN_PROGRESS) {
      throw new Error('Only in-progress distributions can be cancelled');
    }

    this._distributionStatus = DistributionStatus.PENDING;
    this._distributionMethod = null;
    this._distributionNotes = this._distributionNotes
      ? `${this._distributionNotes}; Distribution cancelled: ${reason}`
      : `Distribution cancelled: ${reason}`;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - LEGAL COMPLIANCE
  // --------------------------------------------------------------------------

  public obtainCourtApproval(approvalDate: Date, courtOrderNumber?: string): void {
    if (!this._courtApprovalRequired) {
      throw new Error('Court approval not required for this beneficiary');
    }

    this._courtApprovalObtained = true;
    this._updatedAt = new Date();

    if (courtOrderNumber) {
      const approvalNote = `Court Order ${courtOrderNumber} dated ${approvalDate.toISOString().split('T')[0]}`;
      this._distributionNotes = this._distributionNotes
        ? `${this._distributionNotes}; ${approvalNote}`
        : approvalNote;
    }
  }

  public requireCourtApproval(reason: string): void {
    if (!reason?.trim()) throw new Error('Reason for court approval required');

    this._courtApprovalRequired = true;
    this._distributionNotes = this._distributionNotes
      ? `${this._distributionNotes}; Court approval required: ${reason.trim()}`
      : `Court approval required: ${reason.trim()}`;
    this._updatedAt = new Date();
  }

  public removeCourtApprovalRequirement(): void {
    this._courtApprovalRequired = false;
    this._courtApprovalObtained = false;
    this._updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC - ENTITY OPERATIONS
  // --------------------------------------------------------------------------

  public remove(reason?: string): void {
    // If this is a Post-Probate entity, removing a dependant is illegal without court order.
    // If Pre-Probate (Will Writing), the Testator can do what they want (though it may be contested later).
    if (this._isDependant && this._isSubjectToDependantsProvision) {
      // Warning: Removing a dependant increases risk of litigation under Section 26.
      // We allow it but the service layer should log a warning.
    }

    this.apply(new BeneficiaryRemovedEvent(this._id, this._willId, reason?.trim()));
  }

  // --------------------------------------------------------------------------
  // DOMAIN CALCULATIONS
  // --------------------------------------------------------------------------

  public isConditional(): boolean {
    return this._conditionType !== BequestConditionType.NONE;
  }

  public isConditionMet(): boolean {
    if (!this.isConditional()) return true; // No condition = automatically met
    return this._conditionMet === true;
  }

  public isConditionExpired(): boolean {
    if (!this.isConditional() || !this._conditionDeadline) return false;
    return this._conditionDeadline < new Date();
  }

  public canBeDistributed(): boolean {
    if (this._distributionStatus === DistributionStatus.COMPLETED) return false;
    if (this._courtApprovalRequired && !this._courtApprovalObtained) return false;
    if (this.isLifeInterestActive()) return false;

    // Condition checks
    if (this.isConditional()) {
      // If condition met, can distribute
      if (this.isConditionMet()) return true;
      // If deadline passed and not met, cannot distribute to this beneficiary
      if (this.isConditionExpired()) return false;
      // Condition pending, cannot distribute yet
      return false;
    }

    return this.hasValidAllocation();
  }

  public hasValidAllocation(): boolean {
    switch (this._bequestType) {
      case BequestType.PERCENTAGE:
      case BequestType.RESIDUARY:
        return Boolean(this._sharePercent && this._sharePercent > 0);
      case BequestType.SPECIFIC:
        return Boolean(this._specificAmount && this._specificAmount > 0);
      case BequestType.CONDITIONAL:
        return this.isConditional();
      default:
        return false;
    }
  }

  public getBeneficiaryIdentifier(): string {
    switch (this._beneficiaryType) {
      case BeneficiaryType.USER:
        return this._userId || 'INVALID_USER';
      case BeneficiaryType.FAMILY_MEMBER:
        return this._familyMemberId || 'INVALID_FAMILY_MEMBER';
      case BeneficiaryType.EXTERNAL:
      case BeneficiaryType.CHARITY:
      case BeneficiaryType.ORGANIZATION:
        return this._externalName || 'INVALID_EXTERNAL';
      default:
        throw new Error('Invalid beneficiary type');
    }
  }

  public getBeneficiaryName(): string {
    switch (this._beneficiaryType) {
      case BeneficiaryType.USER:
        return `User ${this._userId}`;
      case BeneficiaryType.FAMILY_MEMBER:
        return `Family Member ${this._familyMemberId}`;
      case BeneficiaryType.EXTERNAL:
      case BeneficiaryType.CHARITY:
      case BeneficiaryType.ORGANIZATION:
        return this._externalName || '';
      default:
        throw new Error('Invalid beneficiary type');
    }
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  // Core Properties
  get id(): string {
    return this._id;
  }

  get willId(): string {
    return this._willId;
  }

  get assetId(): string {
    return this._assetId;
  }

  // Beneficiary Identity
  get beneficiaryType(): BeneficiaryType {
    return this._beneficiaryType;
  }

  get userId(): string | null {
    return this._userId;
  }

  get familyMemberId(): string | null {
    return this._familyMemberId;
  }

  get externalName(): string | null {
    return this._externalName;
  }

  get externalContact(): string | null {
    return this._externalContact;
  }

  get externalIdentification(): string | null {
    return this._externalIdentification;
  }

  get externalAddress(): Record<string, any> | null {
    return this._externalAddress ? { ...this._externalAddress } : null;
  }

  // Kenyan Relationship Context
  get relationshipCategory(): KenyanRelationshipCategory {
    return this._relationshipCategory;
  }

  get specificRelationship(): string | null {
    return this._specificRelationship;
  }

  get isDependant(): boolean {
    return this._isDependant;
  }

  // Bequest Configuration
  get bequestType(): BequestType {
    return this._bequestType;
  }

  get sharePercent(): number | null {
    return this._sharePercent;
  }

  get specificAmount(): number | null {
    return this._specificAmount;
  }

  get currency(): string {
    return this._currency;
  }

  // Life Interest Support
  get hasLifeInterest(): boolean {
    return this._hasLifeInterest;
  }

  get lifeInterestDuration(): number | null {
    return this._lifeInterestDuration;
  }

  get lifeInterestEndsAt(): Date | null {
    return this._lifeInterestEndsAt;
  }

  // Conditions
  get conditionType(): BequestConditionType {
    return this._conditionType;
  }

  get conditionDetails(): string | null {
    return this._conditionDetails;
  }

  get conditionMet(): boolean | null {
    return this._conditionMet;
  }

  get conditionDeadline(): Date | null {
    return this._conditionDeadline;
  }

  // Alternate Beneficiary
  get alternateAssignmentId(): string | null {
    return this._alternateAssignmentId;
  }

  // Distribution Tracking
  get distributionStatus(): DistributionStatus {
    return this._distributionStatus;
  }

  get distributedAt(): Date | null {
    return this._distributedAt;
  }

  get distributionNotes(): string | null {
    return this._distributionNotes;
  }

  get distributionMethod(): string | null {
    return this._distributionMethod;
  }

  // Legal Compliance
  get isSubjectToDependantsProvision(): boolean {
    return this._isSubjectToDependantsProvision;
  }

  get courtApprovalRequired(): boolean {
    return this._courtApprovalRequired;
  }

  get courtApprovalObtained(): boolean {
    return this._courtApprovalObtained;
  }

  // Priority & Order
  get priority(): number {
    return this._priority;
  }

  get bequestPriority(): BequestPriority {
    return this._bequestPriority;
  }

  // Timestamps
  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }
}
