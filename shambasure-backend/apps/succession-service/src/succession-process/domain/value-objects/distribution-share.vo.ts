import { ShareType } from '../../../common/types/kenyan-law.types';

export class DistributionShare {
  private readonly percentage: number;
  private readonly type: ShareType;
  private readonly lifeInterestEndsCondition?: string;
  private readonly beneficiaryType: 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER';

  constructor(
    percentage: number,
    type: ShareType,
    beneficiaryType: 'SPOUSE' | 'CHILD' | 'DEPENDANT' | 'OTHER' = 'OTHER',
    condition?: string,
  ) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }

    this.percentage = percentage;
    this.type = type;
    this.beneficiaryType = beneficiaryType;
    this.lifeInterestEndsCondition = condition;
  }

  isLifeInterest(): boolean {
    return this.type === 'LIFE_INTEREST';
  }

  isAbsolute(): boolean {
    return this.type === 'ABSOLUTE_INTEREST';
  }

  isContingent(): boolean {
    return this.type === 'CONTINGENT_INTEREST';
  }

  /**
   * Section 35(1)(b): Spouse Life Interest terminates upon remarriage
   */
  terminatesOnRemarriage(): boolean {
    return (
      this.isLifeInterest() &&
      this.beneficiaryType === 'SPOUSE' &&
      this.lifeInterestEndsCondition === 'REMARRIAGE'
    );
  }

  /**
   * Section 35(5): Life interest terminates upon death of life tenant
   */
  terminatesOnDeath(): boolean {
    return this.isLifeInterest() && this.lifeInterestEndsCondition === 'DEATH';
  }

  /**
   * Section 35(4): Life interest for minors terminates at age 18
   */
  terminatesOnMajority(): boolean {
    return (
      this.isLifeInterest() &&
      this.beneficiaryType === 'CHILD' &&
      this.lifeInterestEndsCondition === 'ATTAINING_MAJORITY_AGE'
    );
  }

  /**
   * Validates if this share complies with Kenyan dependant provision rules
   */
  compliesWithDependantsProvision(totalEstateValue: number): boolean {
    if (this.beneficiaryType === 'DEPENDANT') {
      const minimumShare = totalEstateValue * 0.05; // At least 5% for dependants
      const shareValue = totalEstateValue * (this.percentage / 100);
      return shareValue >= minimumShare;
    }
    return true;
  }

  /**
   * Checks if this share requires court confirmation
   */
  requiresCourtConfirmation(): boolean {
    return this.isLifeInterest() || this.isContingent() || this.percentage > 50;
  }

  getPercentage(): number {
    return this.percentage;
  }

  getType(): ShareType {
    return this.type;
  }

  getBeneficiaryType(): string {
    return this.beneficiaryType;
  }

  getCondition(): string | undefined {
    return this.lifeInterestEndsCondition;
  }

  getDescription(): string {
    const typeDescription = this.isLifeInterest()
      ? 'Life Interest'
      : this.isAbsolute()
        ? 'Absolute Interest'
        : 'Contingent Interest';

    return `${this.percentage}% ${typeDescription} for ${this.beneficiaryType.toLowerCase()}`;
  }
}
