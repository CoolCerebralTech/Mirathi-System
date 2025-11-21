import { ShareType } from '../../../common/types/kenyan-law.types';

export class DistributionShare {
  private readonly percentage: number; // 0-100
  private readonly type: ShareType;
  private readonly lifeInterestEndsCondition?: string; // e.g. "REMARRIAGE"

  constructor(percentage: number, type: ShareType, condition?: string) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Share percentage must be between 0 and 100');
    }
    this.percentage = percentage;
    this.type = type;
    this.lifeInterestEndsCondition = condition;
  }

  isLifeInterest(): boolean {
    return this.type === 'LIFE_INTEREST';
  }

  isAbsolute(): boolean {
    return this.type === 'ABSOLUTE_INTEREST';
  }

  getPercentage(): number {
    return this.percentage;
  }
  getType(): ShareType {
    return this.type;
  }

  /**
   * Logic for Section 35(1)(b): Spouse Life Interest terminates upon remarriage.
   */
  terminatesOnRemarriage(): boolean {
    return this.isLifeInterest() && this.lifeInterestEndsCondition === 'REMARRIAGE';
  }
}
