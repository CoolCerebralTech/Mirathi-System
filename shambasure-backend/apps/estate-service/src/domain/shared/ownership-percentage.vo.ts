// src/shared/domain/value-objects/ownership-percentage.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidOwnershipPercentageException,
  InvalidOwnershipTypeException,
  OwnershipSumExceeds100Exception,
} from '../exceptions/ownership-percentage.exception';
import { Percentage } from './percentage.vo';

export enum OwnershipType {
  SOLE = 'SOLE', // Single owner
  JOINT_TENANCY = 'JOINT_TENANCY', // Right of survivorship
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON', // Separate shares
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY', // Matrimonial Property Act 2013
  TRUST = 'TRUST', // Held in trust
  CUSTOMARY = 'CUSTOMARY', // Customary land ownership
  SECTIONAL_TITLE = 'SECTIONAL_TITLE', // Apartment/condo
  LIFE_INTEREST = 'LIFE_INTEREST', // Usufruct rights
  REVERSIONARY = 'REVERSIONARY', // Future interest
}

export enum KenyanTenureType {
  FREEHOLD = 'FREEHOLD',
  LEASEHOLD = 'LEASEHOLD',
  COMMUNITY_LAND = 'COMMUNITY_LAND',
  GROUP_RANCH = 'GROUP_RANCH',
  ADJUDICATED_LAND = 'ADJUDICATED_LAND',
  SETTLEMENT_SCHEME = 'SETTLEMENT_SCHEME',
  CUSTOMARY_LAND = 'CUSTOMARY_LAND',
}

interface OwnershipPercentageProps {
  percentage: Percentage;
  ownershipType: OwnershipType;
  tenureType?: KenyanTenureType; // Kenyan specific tenure
  isLifeInterest: boolean;
  lifeInterestEndsAt?: Date;
  lifeInterestConditions?: string[]; // e.g., "until remarriage", "for life"
  isConditional: boolean;
  conditionDescription?: string;
  conditionsMet?: boolean;
  isMatrimonialProperty: boolean;
  acquiredDuringMarriage: boolean;
  requiresSpouseConsent: boolean;
  spouseConsentObtained: boolean;
  hasRestrictions: boolean;
  restrictions?: string[]; // e.g., "cannot sell", "cannot mortgage"
  createdDate: Date;
  registrationReference?: string; // Title deed reference
  courtOrderReference?: string; // For court-ordered ownership
}

export class OwnershipPercentage extends ValueObject<OwnershipPercentageProps> {
  // Kenyan legal minimums for certain ownership types
  private static readonly MIN_CUSTOMARY_SHARE = 0.1; // 0.1% minimum for customary land
  private static readonly MIN_SECTIONAL_SHARE = 0.01; // 0.01% for sectional titles

  constructor(props: OwnershipPercentageProps) {
    super(props);
    this.validateOwnershipTypeConstraints();
    this.validateKenyanLegalRequirements();
  }

  protected validate(): void {
    this.validateOwnershipConstraints();
    this.validateLifeInterest();
    this.validateConditionalOwnership();
  }

  private validateOwnershipConstraints(): void {
    // Life interest validation
    if (this._value.isLifeInterest && !this._value.lifeInterestEndsAt) {
      // Life interest must have end date or condition
      if (!this._value.lifeInterestConditions || this._value.lifeInterestConditions.length === 0) {
        throw new InvalidOwnershipPercentageException(
          'Life interest must specify end date or conditions',
          'lifeInterestEndsAt',
          { isLifeInterest: true },
        );
      }
    }

    // Conditional ownership validation
    if (this._value.isConditional && !this._value.conditionDescription) {
      throw new InvalidOwnershipPercentageException(
        'Conditional ownership must specify condition',
        'conditionDescription',
        { isConditional: true },
      );
    }
  }

  private validateLifeInterest(): void {
    if (this._value.isLifeInterest) {
      // Kenyan law: Life interest must be registered if over 1 year
      if (this._value.percentage.value >= 50 && !this._value.registrationReference) {
        console.warn('Life interest over 50% should be registered with lands registry');
      }

      // Life interest cannot be transferred/sold (only usufruct rights)
      if (this._value.ownershipType === OwnershipType.SOLE) {
        console.warn('Sole ownership with life interest may have transfer restrictions');
      }
    }
  }

  private validateConditionalOwnership(): void {
    if (this._value.isConditional) {
      // Kenyan law: Conditional ownership must have clear conditions
      const conditions = this._value.conditionDescription?.toLowerCase() || '';
      const prohibitedConditions = ['illegal', 'impossible', 'against public policy'];

      if (prohibitedConditions.some((cond) => conditions.includes(cond))) {
        throw new InvalidOwnershipPercentageException(
          'Condition violates Kenyan law or public policy',
          'conditionDescription',
          { condition: this._value.conditionDescription },
        );
      }
    }
  }

  private validateOwnershipTypeConstraints(): void {
    const { ownershipType, percentage, tenureType } = this._value;

    // Validate based on ownership type
    switch (ownershipType) {
      case OwnershipType.SOLE:
        if (!percentage.equals(new Percentage(100))) {
          throw new InvalidOwnershipTypeException('Sole ownership must be 100%', ownershipType, {
            percentage: percentage.value,
          });
        }
        break;

      case OwnershipType.JOINT_TENANCY:
        // Joint tenancy with right of survivorship (jus accrescendi)
        // Under Kenyan law, all joint tenants must have equal shares
        if (
          percentage.value !== 100 / 2 &&
          percentage.value !== 100 / 3 &&
          percentage.value !== 100 / 4
        ) {
          console.warn(`Joint tenancy typically has equal shares. Current: ${percentage.value}%`);
        }
        break;

      case OwnershipType.COMMUNITY_PROPERTY:
        // Matrimonial Property Act 2013
        if (percentage.value !== 50) {
          console.warn(
            `Community property ownership percentage is ${percentage.value}%, expected 50% under Kenyan law`,
          );
        }
        if (!this._value.isMatrimonialProperty) {
          console.warn('Community property should be marked as matrimonial property');
        }
        break;

      case OwnershipType.CUSTOMARY:
        // Customary land ownership has minimum share requirements
        if (percentage.value < OwnershipPercentage.MIN_CUSTOMARY_SHARE) {
          throw new InvalidOwnershipPercentageException(
            `Customary ownership must be at least ${OwnershipPercentage.MIN_CUSTOMARY_SHARE}%`,
            'percentage',
            { tenureType: 'CUSTOMARY', min: OwnershipPercentage.MIN_CUSTOMARY_SHARE },
          );
        }
        break;

      case OwnershipType.SECTIONAL_TITLE:
        // Sectional Properties Act 2020
        if (percentage.value < OwnershipPercentage.MIN_SECTIONAL_SHARE) {
          throw new InvalidOwnershipPercentageException(
            `Sectional title share must be at least ${OwnershipPercentage.MIN_SECTIONAL_SHARE}%`,
            'percentage',
            { tenureType: 'SECTIONAL_TITLE', min: OwnershipPercentage.MIN_SECTIONAL_SHARE },
          );
        }
        break;
    }

    // Validate tenure-specific rules
    if (
      tenureType === KenyanTenureType.COMMUNITY_LAND &&
      ownershipType !== OwnershipType.CUSTOMARY
    ) {
      console.warn('Community land typically held under customary ownership');
    }
  }

  private validateKenyanLegalRequirements(): void {
    const { isMatrimonialProperty, requiresSpouseConsent, spouseConsentObtained } = this._value;

    // Matrimonial Property Act 2013 compliance
    if (isMatrimonialProperty && requiresSpouseConsent && !spouseConsentObtained) {
      throw new InvalidOwnershipPercentageException(
        'Spouse consent required for matrimonial property transactions',
        'spouseConsentObtained',
        { isMatrimonialProperty, requiresSpouseConsent },
      );
    }

    // Land Control Board requirements for agricultural land
    if (this._value.percentage.value >= 10 && this.isAgriculturalLand()) {
      console.warn(
        'Ownership over 10% of agricultural land may require Land Control Board consent',
      );
    }
  }

  // Factory methods
  static createSoleOwnership(
    tenureType?: KenyanTenureType,
    registrationReference?: string,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(100),
      ownershipType: OwnershipType.SOLE,
      tenureType,
      isLifeInterest: false,
      isConditional: false,
      isMatrimonialProperty: false,
      acquiredDuringMarriage: false,
      requiresSpouseConsent: false,
      spouseConsentObtained: false,
      hasRestrictions: false,
      createdDate: new Date(),
      registrationReference,
    });
  }

  static createJointTenancy(
    percentage: number,
    numberOfTenants: number = 2,
    tenureType?: KenyanTenureType,
    isLifeInterest: boolean = false,
    lifeInterestEndsAt?: Date,
  ): OwnershipPercentage {
    const equalShare = 100 / numberOfTenants;
    if (Math.abs(percentage - equalShare) > 0.01) {
      console.warn(
        `Joint tenancy typically has equal shares of ${equalShare}%, got ${percentage}%`,
      );
    }

    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType: OwnershipType.JOINT_TENANCY,
      tenureType,
      isLifeInterest,
      lifeInterestEndsAt,
      isConditional: false,
      isMatrimonialProperty: false,
      acquiredDuringMarriage: false,
      requiresSpouseConsent: false,
      spouseConsentObtained: false,
      hasRestrictions: false,
      createdDate: new Date(),
    });
  }

  static createCommunityProperty(
    acquiredDuringMarriage: boolean = true,
    registrationReference?: string,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(50),
      ownershipType: OwnershipType.COMMUNITY_PROPERTY,
      tenureType: KenyanTenureType.FREEHOLD,
      isLifeInterest: false,
      isConditional: false,
      isMatrimonialProperty: true,
      acquiredDuringMarriage,
      requiresSpouseConsent: true,
      spouseConsentObtained: true, // Presumed for existing marriages
      hasRestrictions: true,
      restrictions: ['Cannot dispose without spouse consent'],
      createdDate: new Date(),
      registrationReference,
    });
  }

  static createCustomaryOwnership(percentage: number): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType: OwnershipType.CUSTOMARY,
      tenureType: KenyanTenureType.CUSTOMARY_LAND,
      isLifeInterest: false,
      isConditional: false,
      isMatrimonialProperty: false,
      acquiredDuringMarriage: false,
      requiresSpouseConsent: false,
      spouseConsentObtained: false,
      hasRestrictions: true,
      restrictions: ['Subject to customary law', 'Family council approval required'],
      createdDate: new Date(),
    });
  }

  static createLifeInterest(
    percentage: number,
    endsAt: Date,
    conditions: string[] = [],
    ownershipType: OwnershipType = OwnershipType.LIFE_INTEREST,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType,
      isLifeInterest: true,
      lifeInterestEndsAt: endsAt,
      lifeInterestConditions: conditions,
      isConditional: false,
      isMatrimonialProperty: false,
      acquiredDuringMarriage: false,
      requiresSpouseConsent: false,
      spouseConsentObtained: false,
      hasRestrictions: true,
      restrictions: ['Non-transferable', 'Usufruct rights only'],
      createdDate: new Date(),
    });
  }

  // Business logic methods
  isLifeInterestActive(): boolean {
    if (!this._value.isLifeInterest) {
      return false;
    }

    // Check end date
    if (this._value.lifeInterestEndsAt) {
      return new Date() < this._value.lifeInterestEndsAt;
    }

    // Check conditions
    if (this._value.lifeInterestConditions && this._value.lifeInterestConditions.length > 0) {
      // In real implementation, evaluate conditions
      return true; // Default to active if conditions not evaluated
    }

    return false;
  }

  getLifeInterestRemainingDays(): number | null {
    if (!this._value.isLifeInterest || !this._value.lifeInterestEndsAt) {
      return null;
    }

    const now = new Date();
    const end = this._value.lifeInterestEndsAt;

    if (now >= end) {
      return 0;
    }

    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isSoleOwnership(): boolean {
    return this._value.ownershipType === OwnershipType.SOLE;
  }

  isJointOwnership(): boolean {
    return [
      OwnershipType.JOINT_TENANCY,
      OwnershipType.TENANCY_IN_COMMON,
      OwnershipType.COMMUNITY_PROPERTY,
    ].includes(this._value.ownershipType);
  }

  hasRightOfSurvivorship(): boolean {
    return this._value.ownershipType === OwnershipType.JOINT_TENANCY;
  }

  isCustomaryLand(): boolean {
    return (
      this._value.tenureType === KenyanTenureType.CUSTOMARY_LAND ||
      this._value.ownershipType === OwnershipType.CUSTOMARY
    );
  }

  isAgriculturalLand(): boolean {
    // Simplified check - in production, would check land registry
    return (
      this._value.tenureType === KenyanTenureType.ADJUDICATED_LAND ||
      this._value.tenureType === KenyanTenureType.GROUP_RANCH ||
      this._value.tenureType === KenyanTenureType.SETTLEMENT_SCHEME
    );
  }

  requiresLandControlBoardConsent(): boolean {
    // Land Control Act - transfers of agricultural land require consent
    return this.isAgriculturalLand() && this._value.percentage.value >= 10;
  }

  // For inheritance calculations under Kenyan law
  getInheritableShare(): Percentage {
    if (this._value.isLifeInterest && this.isLifeInterestActive()) {
      // Life interest terminates on death under S. 35(1)(b) LSA
      return new Percentage(0);
    }

    // Conditional ownership - check if conditions are met
    if (this._value.isConditional && this._value.conditionsMet === false) {
      return new Percentage(0);
    }

    // Customary land may have different inheritance rules
    if (this.isCustomaryLand()) {
      // Customary land typically passes to family/clan, not individuals
      console.warn('Customary land inheritance follows customary law, not statutory law');
    }

    return this._value.percentage;
  }

  getSuccessionRequirements(): string[] {
    const requirements: string[] = [];

    if (this._value.ownershipType === OwnershipType.JOINT_TENANCY) {
      requirements.push('Surviving joint tenant takes full ownership (right of survivorship)');
    }

    if (this._value.isMatrimonialProperty) {
      requirements.push('Matrimonial Property Act 2013 applies');
      requirements.push('Spouse has automatic life interest');
    }

    if (this.isCustomaryLand()) {
      requirements.push('Customary law succession applies');
      requirements.push('Family/Clan council involvement required');
    }

    if (this.requiresLandControlBoardConsent()) {
      requirements.push('Land Control Board consent required for transfer');
    }

    if (this._value.hasRestrictions && this._value.restrictions) {
      requirements.push(...this._value.restrictions);
    }

    return requirements;
  }

  // Formatting methods
  getLegalDescription(): string {
    const typeDescriptions: Record<OwnershipType, string> = {
      [OwnershipType.SOLE]: 'sole and absolute proprietor',
      [OwnershipType.JOINT_TENANCY]: 'joint tenant with right of survivorship',
      [OwnershipType.TENANCY_IN_COMMON]: 'tenant in common',
      [OwnershipType.COMMUNITY_PROPERTY]:
        'community property owner under Matrimonial Property Act 2013',
      [OwnershipType.TRUST]: 'trust beneficiary',
      [OwnershipType.CUSTOMARY]: 'customary land owner',
      [OwnershipType.SECTIONAL_TITLE]: 'sectional title owner under Sectional Properties Act 2020',
      [OwnershipType.LIFE_INTEREST]: 'life interest holder (usufructuary)',
      [OwnershipType.REVERSIONARY]: 'reversionary interest holder',
    };

    let description = `${this._value.percentage.format(2)} as ${typeDescriptions[this._value.ownershipType]}`;

    if (this._value.tenureType) {
      description += `, tenure: ${this._value.tenureType}`;
    }

    if (this._value.isLifeInterest) {
      description += `, life interest`;
      if (this._value.lifeInterestEndsAt) {
        description += ` until ${this._value.lifeInterestEndsAt.toLocaleDateString()}`;
      }
      if (this._value.lifeInterestConditions) {
        description += `, conditions: ${this._value.lifeInterestConditions.join(', ')}`;
      }
    }

    if (this._value.isMatrimonialProperty) {
      description += `, matrimonial property`;
    }

    if (this._value.registrationReference) {
      description += `, registered under ${this._value.registrationReference}`;
    }

    return description;
  }

  // Getters
  get percentage(): Percentage {
    return this._value.percentage;
  }

  get ownershipType(): OwnershipType {
    return this._value.ownershipType;
  }

  get tenureType(): KenyanTenureType | undefined {
    return this._value.tenureType;
  }

  get isLifeInterest(): boolean {
    return this._value.isLifeInterest;
  }

  get lifeInterestEndsAt(): Date | undefined {
    return this._value.lifeInterestEndsAt;
  }

  get isConditional(): boolean {
    return this._value.isConditional;
  }

  get conditionDescription(): string | undefined {
    return this._value.conditionDescription;
  }

  get isMatrimonialProperty(): boolean {
    return this._value.isMatrimonialProperty;
  }

  get createdDate(): Date {
    return this._value.createdDate;
  }

  get registrationReference(): string | undefined {
    return this._value.registrationReference;
  }

  // For API responses
  toJSON() {
    return {
      percentage: this._value.percentage.toJSON(),
      ownershipType: this._value.ownershipType,
      tenureType: this._value.tenureType,
      isLifeInterest: this._value.isLifeInterest,
      lifeInterestActive: this.isLifeInterestActive(),
      lifeInterestRemainingDays: this.getLifeInterestRemainingDays(),
      isConditional: this._value.isConditional,
      isMatrimonialProperty: this._value.isMatrimonialProperty,
      isCustomaryLand: this.isCustomaryLand(),
      isAgriculturalLand: this.isAgriculturalLand(),
      requiresLandControlBoardConsent: this.requiresLandControlBoardConsent(),
      inheritableShare: this.getInheritableShare().toJSON(),
      successionRequirements: this.getSuccessionRequirements(),
      legalDescription: this.getLegalDescription(),
      restrictions: this._value.restrictions,
      registrationReference: this._value.registrationReference,
      courtOrderReference: this._value.courtOrderReference,
    };
  }
}

// Enhanced Portfolio Management with Kenyan Legal Context
export class OwnershipPortfolio {
  private percentages: OwnershipPercentage[] = [];

  constructor(percentages: OwnershipPercentage[] = []) {
    this.percentages = percentages;
    this.validatePortfolio();
  }

  private validatePortfolio(): void {
    const total = this.getTotalPercentage();

    // Allow for rounding errors
    const tolerance = 0.01;

    if (total.value > 100 + tolerance) {
      throw new OwnershipSumExceeds100Exception(total.value, {
        percentages: this.percentages.map((p) => p.percentage.value),
        total: total.value,
      });
    }

    // Check if portfolio is incomplete (less than 100% and no sole ownership)
    if (total.value < 100 - tolerance && !this.hasSoleOwnership()) {
      console.warn(`Ownership portfolio sums to ${total.value}% - missing ${100 - total.value}%`);
    }

    // Validate Kenyan legal constraints
    this.validateKenyanLegalConstraints();
  }

  private validateKenyanLegalConstraints(): void {
    // Check for mixed ownership types that might violate Kenyan law
    const hasCustomary = this.percentages.some((p) => p.isCustomaryLand());
    const hasStatutory = this.percentages.some((p) => !p.isCustomaryLand());

    if (hasCustomary && hasStatutory) {
      console.warn('Mixed customary and statutory ownership - may require special legal treatment');
    }

    // Check matrimonial property consistency
    const matrimonialProperties = this.percentages.filter((p) => p.isMatrimonialProperty);
    if (
      matrimonialProperties.length > 0 &&
      matrimonialProperties.length !== this.percentages.length
    ) {
      console.warn('Mixed matrimonial and non-matrimonial property in same portfolio');
    }
  }

  addOwnership(ownership: OwnershipPercentage): void {
    this.percentages.push(ownership);
    this.validatePortfolio();
  }

  removeOwnership(index: number): void {
    this.percentages.splice(index, 1);
    this.validatePortfolio();
  }

  getTotalPercentage(): Percentage {
    const total = this.percentages.reduce((sum, ownership) => sum + ownership.percentage.value, 0);
    return new Percentage(total);
  }

  hasSoleOwnership(): boolean {
    return this.percentages.some((ownership) => ownership.isSoleOwnership());
  }

  getInheritablePortfolio(): OwnershipPortfolio {
    const inheritable = this.percentages.filter(
      (ownership) => ownership.getInheritableShare().value > 0,
    );
    return new OwnershipPortfolio(inheritable);
  }

  getLifeInterests(): OwnershipPercentage[] {
    return this.percentages.filter(
      (ownership) => ownership.isLifeInterest && ownership.isLifeInterestActive(),
    );
  }

  getConditionalOwnerships(): OwnershipPercentage[] {
    return this.percentages.filter((ownership) => ownership.isConditional);
  }

  getCustomaryOwnerships(): OwnershipPercentage[] {
    return this.percentages.filter((ownership) => ownership.isCustomaryLand());
  }

  getMatrimonialProperties(): OwnershipPercentage[] {
    return this.percentages.filter((ownership) => ownership.isMatrimonialProperty);
  }

  // Kenyan succession specific
  getStatutorySuccessionPortfolio(): OwnershipPortfolio {
    // Filter out customary land (follows different succession rules)
    const statutory = this.percentages.filter((p) => !p.isCustomaryLand());
    return new OwnershipPortfolio(statutory);
  }

  getCustomarySuccessionPortfolio(): OwnershipPortfolio {
    const customary = this.percentages.filter((p) => p.isCustomaryLand());
    return new OwnershipPortfolio(customary);
  }

  // Getters
  get allPercentages(): OwnershipPercentage[] {
    return [...this.percentages];
  }

  get count(): number {
    return this.percentages.length;
  }

  isEmpty(): boolean {
    return this.percentages.length === 0;
  }

  // For API responses
  toJSON() {
    return {
      count: this.count,
      totalPercentage: this.getTotalPercentage().toJSON(),
      hasSoleOwnership: this.hasSoleOwnership(),
      percentages: this.percentages.map((p) => p.toJSON()),
      lifeInterests: this.getLifeInterests().map((p) => p.toJSON()),
      conditionalOwnerships: this.getConditionalOwnerships().map((p) => p.toJSON()),
      customaryOwnerships: this.getCustomaryOwnerships().map((p) => p.toJSON()),
      matrimonialProperties: this.getMatrimonialProperties().map((p) => p.toJSON()),
      statutoryPortfolio: this.getStatutorySuccessionPortfolio().toJSON(),
      customaryPortfolio: this.getCustomarySuccessionPortfolio().toJSON(),
    };
  }
}
