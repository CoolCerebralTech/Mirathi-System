import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/entity';
import { Result, combine } from '../../../core/result';
import { KenyanId } from '../../../shared/kenyan-id.vo';
import { Money } from '../../../shared/money.vo';
import { Percentage } from '../../../shared/percentage.vo';

export enum BequestType {
  SPECIFIC = 'SPECIFIC', // Specific asset to specific person
  RESIDUARY = 'RESIDUARY', // Remainder after specific bequests
  CONDITIONAL = 'CONDITIONAL', // Only if condition met
  TRUST = 'TRUST', // Held in trust until condition
  PERCENTAGE = 'PERCENTAGE', // Percentage of total estate
}

export enum BequestConditionType {
  AGE_REQUIREMENT = 'AGE_REQUIREMENT', // "When beneficiary turns 25"
  SURVIVAL = 'SURVIVAL', // "If they survive me by 30 days"
  EDUCATION = 'EDUCATION', // "Upon graduation"
  MARRIAGE = 'MARRIAGE', // "Upon marriage"
  ALTERNATE = 'ALTERNATE', // "If primary dies, give to alternate"
  NONE = 'NONE',
}

export enum BeneficiaryType {
  USER = 'USER', // Registered user
  FAMILY_MEMBER = 'FAMILY_MEMBER', // From family-service
  EXTERNAL = 'EXTERNAL', // Non-registered person
  CHARITY = 'CHARITY', // Charitable organization
  ORGANIZATION = 'ORGANIZATION', // Company, trust
}

export enum BequestPriority {
  PRIMARY = 'PRIMARY',
  ALTERNATE = 'ALTERNATE',
  CONTINGENT = 'CONTINGENT',
}

export enum DistributionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  DEFERRED = 'DEFERRED',
}

interface BeneficiaryIdentity {
  type: BeneficiaryType;
  userId?: string;
  familyMemberId?: string;
  externalDetails?: {
    fullName: string;
    nationalId?: KenyanId;
    kraPin?: string;
    contact?: string;
    address?: string;
  };
  organizationDetails?: {
    name: string;
    registrationNumber?: string;
    kraPin?: string;
    contactPerson?: string;
  };
  charityDetails?: {
    name: string;
    registrationNumber?: string;
    cause?: string;
  };
}

interface BequestCondition {
  type: BequestConditionType;
  details: string;
  deadline?: Date;
  met?: boolean;
  metAt?: Date;
  evidenceRequired?: boolean;
  evidenceProvided?: boolean;
  evidenceDocumentIds?: string[];
}

interface TrustDetails {
  trusteeId?: string;
  trusteeName?: string;
  trustPeriod?: string; // "Until age 25", "For life", etc.
  distributionSchedule?: {
    frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'LUMP_SUM';
    amountPerDistribution?: Money;
    startDate?: Date;
    endDate?: Date;
  };
  specialInstructions?: string;
}

interface LifeInterest {
  hasLifeInterest: boolean;
  lifeInterestHolderId?: string;
  lifeInterestHolderName?: string;
  lifeInterestEndsAt?: Date;
  lifeInterestCondition?: string; // "Terminates on remarriage"
  currentHolderAlive?: boolean;
}

interface BequestProps {
  // Asset Reference
  assetId: string;
  assetName: string;
  assetType: string;

  // Beneficiary Information
  beneficiary: BeneficiaryIdentity;

  // Kenyan Relationship Context
  relationshipToDeceased?: string;
  isDependant: boolean; // For S. 29 LSA consideration
  dependencyLevel?: 'NONE' | 'PARTIAL' | 'FULL';

  // Bequest Configuration
  type: BequestType;
  sharePercentage?: Percentage;
  specificAmount?: Money;
  currency: string;

  // Conditions
  condition: BequestCondition;

  // Life Interest (S. 35(1)(b) LSA)
  lifeInterest: LifeInterest;

  // Trust Details
  trust?: TrustDetails;

  // Alternate Beneficiary
  alternateBequestId?: string;
  isAlternate: boolean;
  primaryBequestId?: string;

  // Distribution Tracking
  distributionStatus: DistributionStatus;
  distributedAt?: Date;
  distributionMethod?: string;
  distributionNotes?: string;

  // Priority and Order
  priority: BequestPriority;
  executionOrder: number; // Order in which bequests should be executed

  // Legal Compliance
  compliesWithS26: boolean; // Dependant provision compliance
  s26CourtOrderNumber?: string;
  isContested: boolean;
  contestationReason?: string;
  courtApproved?: boolean;
  courtApprovalDate?: Date;

  // Hotchpot Consideration (S. 35(3) LSA)
  isSubjectToHotchpot: boolean;
  hotchpotValue?: Money;
  hotchpotAdjusted?: boolean;

  // Computed Values
  computedShareValue?: Money;
  computedSharePercentage?: Percentage;

  // Matrimonial Property Considerations
  isMatrimonialProperty: boolean;
  spouseConsentRequired: boolean;
  spouseConsentObtained?: boolean;
  spouseConsentDate?: Date;

  // Tax Considerations
  estimatedTax?: Money;
  taxPaid?: boolean;
  taxPaidAt?: Date;

  // Documentation
  supportingDocumentIds: string[];
  deedOfVariationIds: string[]; // For changes after will execution

  // Audit
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Bequest extends Entity<BequestProps> {
  get id(): UniqueEntityID {
    return this._id;
  }
  get assetId(): string {
    return this.props.assetId;
  }
  get type(): BequestType {
    return this.props.type;
  }
  get priority(): BequestPriority {
    return this.props.priority;
  }
  get distributionStatus(): DistributionStatus {
    return this.props.distributionStatus;
  }
  get beneficiary(): BeneficiaryIdentity {
    return this.props.beneficiary;
  }
  get isDependant(): boolean {
    return this.props.isDependant;
  }
  get isSubjectToHotchpot(): boolean {
    return this.props.isSubjectToHotchpot;
  }
  get condition(): BequestCondition {
    return this.props.condition;
  }

  private constructor(props: BequestProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /**
   * Factory method to create a Bequest
   */
  public static create(props: Partial<BequestProps>, id?: UniqueEntityID): Result<Bequest> {
    const defaultProps: BequestProps = {
      assetId: '',
      assetName: '',
      assetType: '',
      beneficiary: {
        type: BeneficiaryType.EXTERNAL,
        externalDetails: { fullName: '' },
      },
      isDependant: false,
      type: BequestType.SPECIFIC,
      currency: 'KES',
      condition: {
        type: BequestConditionType.NONE,
        details: '',
      },
      lifeInterest: {
        hasLifeInterest: false,
      },
      isAlternate: false,
      distributionStatus: DistributionStatus.PENDING,
      priority: BequestPriority.PRIMARY,
      executionOrder: 1,
      compliesWithS26: false,
      isContested: false,
      isSubjectToHotchpot: false,
      isMatrimonialProperty: false,
      spouseConsentRequired: false,
      supportingDocumentIds: [],
      deedOfVariationIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mergedProps = { ...defaultProps, ...props };

    // Validate bequest properties
    const validationResult = this.validate(mergedProps);
    if (validationResult.isFailure) {
      return Result.fail<Bequest>(validationResult.getErrorValue());
    }

    return Result.ok<Bequest>(new Bequest(mergedProps, id));
  }

  /**
   * Validate bequest properties
   */
  private static validate(props: BequestProps): Result<void> {
    const errors: string[] = [];

    // Asset validation
    if (!props.assetId) {
      errors.push('Asset ID is required');
    }

    if (!props.assetName) {
      errors.push('Asset name is required');
    }

    // Beneficiary validation
    if (!this.validateBeneficiary(props.beneficiary)) {
      errors.push('Beneficiary details are invalid');
    }

    // Type-specific validation
    switch (props.type) {
      case BequestType.SPECIFIC:
        if (!props.specificAmount) {
          errors.push('Specific bequest requires a specific amount');
        }
        break;

      case BequestType.PERCENTAGE:
        if (!props.sharePercentage) {
          errors.push('Percentage bequest requires a share percentage');
        } else if (props.sharePercentage.value <= 0 || props.sharePercentage.value > 100) {
          errors.push('Share percentage must be between 0 and 100');
        }
        break;

      case BequestType.RESIDUARY:
        // Residuary bequests don't need specific amount or percentage
        break;

      case BequestType.TRUST:
        if (!props.trust) {
          errors.push('Trust bequest requires trust details');
        }
        break;

      case BequestType.CONDITIONAL:
        if (props.condition.type === BequestConditionType.NONE) {
          errors.push('Conditional bequest requires a condition type');
        }
        break;
    }

    // Life interest validation
    if (props.lifeInterest.hasLifeInterest && !props.lifeInterest.lifeInterestHolderId) {
      errors.push('Life interest requires a holder');
    }

    // Condition deadline validation
    if (props.condition.deadline && props.condition.deadline < new Date()) {
      errors.push('Condition deadline cannot be in the past');
    }

    // Priority validation for alternate bequests
    if (props.isAlternate && props.priority !== BequestPriority.ALTERNATE) {
      errors.push('Alternate bequests must have ALTERNATE priority');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Validate beneficiary details
   */
  private static validateBeneficiary(beneficiary: BeneficiaryIdentity): boolean {
    switch (beneficiary.type) {
      case BeneficiaryType.USER:
        return !!beneficiary.userId;

      case BeneficiaryType.FAMILY_MEMBER:
        return !!beneficiary.familyMemberId;

      case BeneficiaryType.EXTERNAL:
        return !!beneficiary.externalDetails?.fullName;

      case BeneficiaryType.CHARITY:
        return !!beneficiary.charityDetails?.name;

      case BeneficiaryType.ORGANIZATION:
        return !!beneficiary.organizationDetails?.name;

      default:
        return false;
    }
  }

  /**
   * Mark condition as met
   */
  public markConditionAsMet(evidenceDocumentIds?: string[]): Result<void> {
    if (this.props.condition.type === BequestConditionType.NONE) {
      return Result.fail('Bequest has no conditions');
    }

    if (this.props.condition.met) {
      return Result.fail('Condition already met');
    }

    // Validate evidence if required
    if (this.props.condition.evidenceRequired && !evidenceDocumentIds?.length) {
      return Result.fail('Evidence is required to mark condition as met');
    }

    this.props.condition.met = true;
    this.props.condition.metAt = new Date();

    if (evidenceDocumentIds) {
      this.props.condition.evidenceDocumentIds = evidenceDocumentIds;
      this.props.condition.evidenceProvided = true;
    }

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Update distribution status
   */
  public updateDistributionStatus(
    status: DistributionStatus,
    method?: string,
    notes?: string,
  ): Result<void> {
    // Validate status transitions
    const validTransitions: Record<DistributionStatus, DistributionStatus[]> = {
      [DistributionStatus.PENDING]: [
        DistributionStatus.IN_PROGRESS,
        DistributionStatus.DEFERRED,
        DistributionStatus.DISPUTED,
      ],
      [DistributionStatus.IN_PROGRESS]: [
        DistributionStatus.COMPLETED,
        DistributionStatus.DISPUTED,
        DistributionStatus.DEFERRED,
      ],
      [DistributionStatus.COMPLETED]: [],
      [DistributionStatus.DISPUTED]: [DistributionStatus.IN_PROGRESS, DistributionStatus.DEFERRED],
      [DistributionStatus.DEFERRED]: [DistributionStatus.IN_PROGRESS, DistributionStatus.DISPUTED],
    };

    if (!validTransitions[this.props.distributionStatus].includes(status)) {
      return Result.fail(
        `Invalid status transition from ${this.props.distributionStatus} to ${status}`,
      );
    }

    // Special validation for COMPLETED status
    if (status === DistributionStatus.COMPLETED) {
      if (this.props.condition.type !== BequestConditionType.NONE && !this.props.condition.met) {
        return Result.fail('Cannot complete distribution while conditions are unmet');
      }

      if (this.props.lifeInterest.hasLifeInterest && this.props.lifeInterest.lifeInterestEndsAt) {
        const now = new Date();
        if (this.props.lifeInterest.lifeInterestEndsAt > now) {
          return Result.fail('Cannot complete distribution while life interest is active');
        }
      }
    }

    this.props.distributionStatus = status;
    this.props.distributionMethod = method;
    this.props.distributionNotes = notes;

    if (status === DistributionStatus.COMPLETED) {
      this.props.distributedAt = new Date();
    }

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Calculate share value based on estate net value
   */
  public calculateShareValue(estateNetValue: Money, totalResiduary?: Money): Result<Money> {
    switch (this.props.type) {
      case BequestType.SPECIFIC:
        if (!this.props.specificAmount) {
          return Result.fail('Specific bequest requires specific amount');
        }
        return Result.ok(this.props.specificAmount);

      case BequestType.PERCENTAGE:
        if (!this.props.sharePercentage) {
          return Result.fail('Percentage bequest requires share percentage');
        }
        const percentageAmount = estateNetValue.amount * (this.props.sharePercentage.value / 100);
        return Result.ok(
          Money.create({
            amount: percentageAmount,
            currency: this.props.currency,
          }).getValue(),
        );

      case BequestType.RESIDUARY:
        if (!totalResiduary) {
          return Result.fail('Residuary bequest requires total residuary amount');
        }
        return Result.ok(totalResiduary);

      case BequestType.CONDITIONAL:
        if (!this.props.condition.met) {
          return Result.fail('Conditional bequest requires condition to be met');
        }
        // Fall through to specific amount if available
        if (this.props.specificAmount) {
          return Result.ok(this.props.specificAmount);
        }
        return Result.fail('Conditional bequest requires either specific amount or percentage');

      case BequestType.TRUST:
        // Trust bequests hold the entire amount in trust
        if (this.props.specificAmount) {
          return Result.ok(this.props.specificAmount);
        }
        return Result.fail('Trust bequest requires specific amount');

      default:
        return Result.fail('Unknown bequest type');
    }
  }

  /**
   * Apply hotchpot adjustment (S. 35(3) LSA)
   */
  public applyHotchpotAdjustment(hotchpotValue: Money): Result<void> {
    if (!this.props.isSubjectToHotchpot) {
      return Result.fail('Bequest is not subject to hotchpot');
    }

    this.props.hotchpotValue = hotchpotValue;
    this.props.hotchpotAdjusted = true;
    this.props.updatedAt = new Date();

    // Adjust the computed value if available
    if (this.props.computedShareValue) {
      const adjustedValue = this.props.computedShareValue.add(hotchpotValue);
      this.props.computedShareValue = adjustedValue;
    }

    return Result.ok();
  }

  /**
   * Add spouse consent
   */
  public addSpouseConsent(consentedBy: string): Result<void> {
    if (!this.props.spouseConsentRequired) {
      return Result.fail('Spouse consent is not required for this bequest');
    }

    if (this.props.spouseConsentObtained) {
      return Result.fail('Spouse consent already obtained');
    }

    this.props.spouseConsentObtained = true;
    this.props.spouseConsentDate = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Contest the bequest
   */
  public contestBequest(reason: string): Result<void> {
    if (this.props.isContested) {
      return Result.fail('Bequest is already contested');
    }

    this.props.isContested = true;
    this.props.contestationReason = reason;
    this.props.distributionStatus = DistributionStatus.DISPUTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Resolve contestation
   */
  public resolveContestation(courtApproved: boolean, courtOrderNumber?: string): Result<void> {
    if (!this.props.isContested) {
      return Result.fail('Bequest is not contested');
    }

    this.props.isContested = false;
    this.props.courtApproved = courtApproved;
    this.props.courtApprovalDate = new Date();

    if (courtApproved) {
      this.props.distributionStatus = DistributionStatus.IN_PROGRESS;
    } else {
      this.props.distributionStatus = DistributionStatus.DEFERRED;
    }

    if (courtOrderNumber) {
      this.props.s26CourtOrderNumber = courtOrderNumber;
    }

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
   * Add deed of variation (for post-execution changes)
   */
  public addDeedOfVariation(deedId: string): void {
    if (!this.props.deedOfVariationIds.includes(deedId)) {
      this.props.deedOfVariationIds.push(deedId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Check if bequest is ready for distribution
   */
  public isReadyForDistribution(): boolean {
    if (this.props.distributionStatus === DistributionStatus.COMPLETED) {
      return false;
    }

    // Check conditions
    if (this.props.condition.type !== BequestConditionType.NONE && !this.props.condition.met) {
      return false;
    }

    // Check life interest
    if (this.props.lifeInterest.hasLifeInterest && this.props.lifeInterest.lifeInterestEndsAt) {
      const now = new Date();
      if (this.props.lifeInterest.lifeInterestEndsAt > now) {
        return false;
      }
    }

    // Check contestation
    if (this.props.isContested) {
      return false;
    }

    // Check spouse consent if required
    if (this.props.spouseConsentRequired && !this.props.spouseConsentObtained) {
      return false;
    }

    return this.props.distributionStatus === DistributionStatus.PENDING;
  }

  /**
   * Get beneficiary name
   */
  public getBeneficiaryName(): string {
    switch (this.props.beneficiary.type) {
      case BeneficiaryType.USER:
        return 'Registered User';

      case BeneficiaryType.FAMILY_MEMBER:
        return 'Family Member';

      case BeneficiaryType.EXTERNAL:
        return this.props.beneficiary.externalDetails?.fullName || 'Unknown';

      case BeneficiaryType.CHARITY:
        return this.props.beneficiary.charityDetails?.name || 'Charity';

      case BeneficiaryType.ORGANIZATION:
        return this.props.beneficiary.organizationDetails?.name || 'Organization';

      default:
        return 'Unknown';
    }
  }

  /**
   * Get bequest value description
   */
  public getValueDescription(): string {
    switch (this.props.type) {
      case BequestType.SPECIFIC:
        return `${this.props.specificAmount?.toString() || '0'} KES`;

      case BequestType.PERCENTAGE:
        return `${this.props.sharePercentage?.value || 0}% of estate`;

      case BequestType.RESIDUARY:
        return 'Residuary estate';

      case BequestType.CONDITIONAL:
        return `Conditional: ${this.props.condition.details}`;

      case BequestType.TRUST:
        return `Trust: ${this.props.specificAmount?.toString() || '0'} KES`;

      default:
        return 'Unknown';
    }
  }

  /**
   * Check if this is a dependant provision (S. 26 LSA)
   */
  public isDependantProvision(): boolean {
    return this.props.isDependant && this.props.compliesWithS26;
  }

  /**
   * Mark as court-approved dependant provision
   */
  public markAsCourtApprovedDependantProvision(courtOrderNumber: string): void {
    this.props.compliesWithS26 = true;
    this.props.s26CourtOrderNumber = courtOrderNumber;
    this.props.courtApproved = true;
    this.props.courtApprovalDate = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Set up trust details
   */
  public setupTrust(
    trusteeId: string,
    trusteeName: string,
    trustPeriod: string,
    distributionSchedule?: {
      frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'LUMP_SUM';
      amountPerDistribution?: Money;
      startDate?: Date;
      endDate?: Date;
    },
    specialInstructions?: string,
  ): Result<void> {
    if (this.props.type !== BequestType.TRUST) {
      return Result.fail('Only trust bequests can have trust details');
    }

    this.props.trust = {
      trusteeId,
      trusteeName,
      trustPeriod,
      distributionSchedule,
      specialInstructions,
    };

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Set up life interest
   */
  public setupLifeInterest(
    holderId: string,
    holderName: string,
    endsAt?: Date,
    condition?: string,
  ): Result<void> {
    this.props.lifeInterest = {
      hasLifeInterest: true,
      lifeInterestHolderId: holderId,
      lifeInterestHolderName: holderName,
      lifeInterestEndsAt: endsAt,
      lifeInterestCondition: condition,
    };

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Update computed values
   */
  public updateComputedValues(shareValue?: Money, sharePercentage?: Percentage): void {
    if (shareValue) {
      this.props.computedShareValue = shareValue;
    }

    if (sharePercentage) {
      this.props.computedSharePercentage = sharePercentage;
    }

    this.props.updatedAt = new Date();
  }
}
