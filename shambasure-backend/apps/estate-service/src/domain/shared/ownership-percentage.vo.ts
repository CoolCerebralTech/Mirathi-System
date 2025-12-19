// src/shared/domain/value-objects/ownership-percentage.vo.ts
import { ValueObject } from '../base/value-object';
import {
  InvalidOwnershipPercentageException,
  InvalidOwnershipTypeException,
  OwnershipSumExceeds100Exception,
  OwnershipSumLessThan100Exception,
} from '../exceptions/ownership-percentage.exception';
import { Percentage } from './percentage.vo';

export enum OwnershipType {
  SOLE = 'SOLE',
  JOINT_TENANCY = 'JOINT_TENANCY',
  TENANCY_IN_COMMON = 'TENANCY_IN_COMMON',
  COMMUNITY_PROPERTY = 'COMMUNITY_PROPERTY',
  TRUST = 'TRUST',
}

export interface OwnershipPercentageProps {
  percentage: Percentage;
  ownershipType: OwnershipType;
  isLifeInterest: boolean;
  lifeInterestEndsAt?: Date;
  isConditional: boolean;
  conditionDescription?: string;
}

export class OwnershipPercentage extends ValueObject<OwnershipPercentageProps> {
  constructor(props: OwnershipPercentageProps) {
    super(props);
    this.validateOwnershipTypeConstraints();
  }

  protected validate(): void {
    // Base validation is handled by Percentage VO
    // Additional validation for ownership-specific rules
    this.validateOwnershipConstraints();
  }

  private validateOwnershipConstraints(): void {
    // Life interest validation
    if (this._value.isLifeInterest && !this._value.lifeInterestEndsAt) {
      throw new InvalidOwnershipPercentageException(
        'Life interest must specify end date',
        'lifeInterestEndsAt',
        { isLifeInterest: true },
      );
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

  private validateOwnershipTypeConstraints(): void {
    const { ownershipType, percentage } = this._value;

    switch (ownershipType) {
      case OwnershipType.SOLE:
        if (!percentage.equals(new Percentage(100))) {
          throw new InvalidOwnershipTypeException('Sole ownership must be 100%', ownershipType, {
            percentage: percentage.value,
          });
        }
        break;

      case OwnershipType.JOINT_TENANCY:
        // Joint tenancy typically implies equal shares, but not always
        // We'll allow any percentage for flexibility
        break;

      case OwnershipType.TENANCY_IN_COMMON:
        // Tenancy in common can have any percentage distribution
        break;

      case OwnershipType.COMMUNITY_PROPERTY:
        // Community property typically implies 50/50 in Kenya under Matrimonial Property Act
        if (percentage.value !== 50) {
          console.warn(
            `Community property ownership percentage is ${percentage.value}%, expected 50%`,
          );
        }
        break;
    }
  }

  // Factory methods
  static createSoleOwnership(): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(100),
      ownershipType: OwnershipType.SOLE,
      isLifeInterest: false,
      isConditional: false,
    });
  }

  static createJointTenancy(
    percentage: number,
    isLifeInterest: boolean = false,
    lifeInterestEndsAt?: Date,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType: OwnershipType.JOINT_TENANCY,
      isLifeInterest,
      lifeInterestEndsAt,
      isConditional: false,
    });
  }

  static createTenancyInCommon(
    percentage: number,
    isLifeInterest: boolean = false,
    lifeInterestEndsAt?: Date,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType: OwnershipType.TENANCY_IN_COMMON,
      isLifeInterest,
      lifeInterestEndsAt,
      isConditional: false,
    });
  }

  static createCommunityProperty(): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(50),
      ownershipType: OwnershipType.COMMUNITY_PROPERTY,
      isLifeInterest: false,
      isConditional: false,
    });
  }

  static createLifeInterest(
    percentage: number,
    endsAt: Date,
    ownershipType: OwnershipType = OwnershipType.JOINT_TENANCY,
  ): OwnershipPercentage {
    return new OwnershipPercentage({
      percentage: new Percentage(percentage),
      ownershipType,
      isLifeInterest: true,
      lifeInterestEndsAt: endsAt,
      isConditional: false,
    });
  }

  // Business logic methods
  isLifeInterestActive(): boolean {
    if (!this._value.isLifeInterest || !this._value.lifeInterestEndsAt) {
      return false;
    }
    return new Date() < this._value.lifeInterestEndsAt;
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

    const diffTime = Math.abs(end.getTime() - now.getTime());
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

  // Mathematical operations
  add(other: OwnershipPercentage): OwnershipPercentage {
    // Only add if ownership types are compatible
    if (this._value.ownershipType !== other._value.ownershipType) {
      throw new InvalidOwnershipPercentageException(
        `Cannot add different ownership types: ${this._value.ownershipType} and ${other._value.ownershipType}`,
        'ownershipType',
        { type1: this._value.ownershipType, type2: other._value.ownershipType },
      );
    }

    const newPercentage = this._value.percentage.add(other._value.percentage);

    return new OwnershipPercentage({
      ...this._value,
      percentage: newPercentage,
    });
  }

  split(ways: number): OwnershipPercentage[] {
    if (ways <= 0) {
      throw new InvalidOwnershipPercentageException(`Cannot split into ${ways} ways`, 'split', {
        ways,
      });
    }

    const splitPercentage = this._value.percentage.value / ways;
    const results: OwnershipPercentage[] = [];

    for (let i = 0; i < ways; i++) {
      results.push(
        new OwnershipPercentage({
          ...this._value,
          percentage: new Percentage(splitPercentage),
        }),
      );
    }

    return results;
  }

  // For inheritance calculations
  getInheritableShare(): Percentage {
    if (this._value.isLifeInterest && this.isLifeInterestActive()) {
      // Life interest is not inheritable while active
      return new Percentage(0);
    }

    // Conditional ownership might have restrictions
    if (this._value.isConditional) {
      // In real system, evaluate condition
      console.warn(`Conditional ownership: ${this._value.conditionDescription}`);
    }

    return this._value.percentage;
  }

  // Formatting methods
  getLegalDescription(): string {
    const typeDescriptions: Record<OwnershipType, string> = {
      [OwnershipType.SOLE]: 'sole and absolute owner',
      [OwnershipType.JOINT_TENANCY]: 'joint tenant with right of survivorship',
      [OwnershipType.TENANCY_IN_COMMON]: 'tenant in common',
      [OwnershipType.COMMUNITY_PROPERTY]: 'community property owner',
      [OwnershipType.TRUST]: 'trust beneficiary',
    };

    let description = `${this._value.percentage.format(2)} as ${typeDescriptions[this._value.ownershipType]}`;

    if (this._value.isLifeInterest) {
      description += ` for life until ${this._value.lifeInterestEndsAt?.toLocaleDateString()}`;
    }

    if (this._value.isConditional) {
      description += ` subject to: ${this._value.conditionDescription}`;
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
}

// Utility class for managing multiple ownership percentages
export class OwnershipPortfolio {
  private percentages: OwnershipPercentage[] = [];

  constructor(percentages: OwnershipPercentage[] = []) {
    this.percentages = percentages;
    this.validatePortfolio();
  }

  private validatePortfolio(): void {
    const total = this.getTotalPercentage();

    if (total.value > 100) {
      throw new OwnershipSumExceeds100Exception(total.value, {
        percentages: this.percentages.map((p) => p.percentage.value),
      });
    }

    if (total.value < 100 && !this.hasSoleOwnership()) {
      throw new OwnershipSumLessThan100Exception(total.value, {
        percentages: this.percentages.map((p) => p.percentage.value),
      });
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
}
