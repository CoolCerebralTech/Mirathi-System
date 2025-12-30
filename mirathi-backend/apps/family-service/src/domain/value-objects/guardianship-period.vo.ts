// src/domain/value-objects/guardianship-period.vo.ts
import { ValueObject } from '../base/value-object';

export interface GuardianshipPeriodProps {
  startDate: Date;
  endDate?: Date; // undefined = indefinite
  wardDateOfBirth: Date; // For age-based calculations
}

export class GuardianshipPeriodVO extends ValueObject<GuardianshipPeriodProps> {
  constructor(props: GuardianshipPeriodProps) {
    super(props);
  }

  protected validate(): void {
    if (this.props.startDate > new Date()) {
      throw new Error('Start date cannot be in the future');
    }

    if (this.props.endDate && this.props.endDate <= this.props.startDate) {
      throw new Error('End date must be after start date');
    }

    if (this.props.wardDateOfBirth > new Date()) {
      throw new Error('Ward date of birth cannot be in the future');
    }
  }

  // 🎯 INNOVATIVE: Calculate ward's age
  public getWardAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.props.wardDateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - this.props.wardDateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < this.props.wardDateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }

  // 🎯 INNOVATIVE: Check if ward is still a minor (<18)
  public isWardMinor(): boolean {
    return this.getWardAge() < 18;
  }

  // 🎯 INNOVATIVE: Calculate when ward turns 18
  public getAgeOfMajorityDate(): Date {
    const majorityDate = new Date(this.props.wardDateOfBirth);
    majorityDate.setFullYear(majorityDate.getFullYear() + 18);
    return majorityDate;
  }

  // 🎯 INNOVATIVE: Auto-calculate end date if not specified
  public getEffectiveEndDate(): Date {
    if (this.props.endDate) return this.props.endDate;

    // Default to when ward turns 18 for guardianships
    return this.getAgeOfMajorityDate();
  }

  // 🎯 INNOVATIVE: Calculate days remaining
  public getDaysRemaining(): number | null {
    const effectiveEnd = this.getEffectiveEndDate();
    const today = new Date();

    if (effectiveEnd <= today) return 0;

    const diffTime = effectiveEnd.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 🎯 INNOVATIVE: Get status description
  public getStatus(): string {
    if (!this.isWardMinor()) return 'Ward reached majority';

    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining === null) return 'Active (indefinite)';
    if (daysRemaining <= 0) return 'Expired';
    if (daysRemaining <= 30) return 'Expiring soon';
    if (daysRemaining <= 365) return 'Active (<1 year)';
    return 'Active';
  }

  public static create(props: GuardianshipPeriodProps): GuardianshipPeriodVO {
    return new GuardianshipPeriodVO(props);
  }

  public toJSON(): Record<string, any> {
    return {
      startDate: this.props.startDate.toISOString(),
      endDate: this.props.endDate?.toISOString(),
      effectiveEndDate: this.getEffectiveEndDate().toISOString(),
      wardAge: this.getWardAge(),
      isWardMinor: this.isWardMinor(),
      daysRemaining: this.getDaysRemaining(),
      status: this.getStatus(),
      ageOfMajorityDate: this.getAgeOfMajorityDate().toISOString(),
    };
  }
}
