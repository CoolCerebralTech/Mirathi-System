// domain/value-objects/personal/age-calculation.vo.ts
import { ValueObject } from '../../base/value-object';

export interface AgeCalculationProps {
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  estimatedBirthYear?: number;
  isApproximateDate: boolean;
}

export class AgeCalculation extends ValueObject<AgeCalculationProps> {
  private constructor(props: AgeCalculationProps) {
    super(props);
    this.validate();
  }

  static create(dateOfBirth?: Date): AgeCalculation {
    return new AgeCalculation({
      dateOfBirth,
      isApproximateDate: false,
    });
  }

  static createWithEstimatedYear(year: number): AgeCalculation {
    return new AgeCalculation({
      estimatedBirthYear: year,
      isApproximateDate: true,
    });
  }

  static createFromProps(props: AgeCalculationProps): AgeCalculation {
    return new AgeCalculation(props);
  }

  validate(): void {
    // Date of birth validation
    if (this._value.dateOfBirth) {
      if (this._value.dateOfBirth > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }

      // Check if date is reasonable (not before 1900)
      if (this._value.dateOfBirth.getFullYear() < 1900) {
        throw new Error('Date of birth before 1900 is not valid');
      }
    }

    // Date of death validation
    if (this._value.dateOfDeath) {
      if (this._value.dateOfDeath > new Date()) {
        throw new Error('Date of death cannot be in the future');
      }

      if (this._value.dateOfBirth && this._value.dateOfDeath < this._value.dateOfBirth) {
        throw new Error('Date of death cannot be before date of birth');
      }
    }

    // Estimated birth year validation
    if (this._value.estimatedBirthYear) {
      const currentYear = new Date().getFullYear();
      if (this._value.estimatedBirthYear < 1900) {
        throw new Error('Estimated birth year before 1900 is not valid');
      }
      if (this._value.estimatedBirthYear > currentYear) {
        throw new Error('Estimated birth year cannot be in the future');
      }
    }

    // Must have either date of birth or estimated year
    if (!this._value.dateOfBirth && !this._value.estimatedBirthYear) {
      throw new Error('Either date of birth or estimated birth year is required');
    }
  }

  updateDateOfBirth(dateOfBirth: Date): AgeCalculation {
    return new AgeCalculation({
      ...this._value,
      dateOfBirth,
      isApproximateDate: false,
      estimatedBirthYear: undefined,
    });
  }

  updateDateOfDeath(dateOfDeath?: Date): AgeCalculation {
    return new AgeCalculation({
      ...this._value,
      dateOfDeath,
    });
  }

  markAsApproximate(): AgeCalculation {
    if (!this._value.dateOfBirth) {
      throw new Error('Cannot mark as approximate without date of birth');
    }

    return new AgeCalculation({
      ...this._value,
      isApproximateDate: true,
    });
  }

  markAsExact(): AgeCalculation {
    return new AgeCalculation({
      ...this._value,
      isApproximateDate: false,
    });
  }

  get dateOfBirth(): Date | undefined {
    return this._value.dateOfBirth;
  }

  get dateOfDeath(): Date | undefined {
    return this._value.dateOfDeath;
  }

  get estimatedBirthYear(): number | undefined {
    return this._value.estimatedBirthYear;
  }

  get isApproximateDate(): boolean {
    return this._value.isApproximateDate;
  }

  // Calculate current age or age at death
  get age(): number | null {
    if (this._value.dateOfBirth) {
      const referenceDate = this._value.dateOfDeath || new Date();
      let age = referenceDate.getFullYear() - this._value.dateOfBirth.getFullYear();
      const monthDiff = referenceDate.getMonth() - this._value.dateOfBirth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && referenceDate.getDate() < this._value.dateOfBirth.getDate())
      ) {
        age--;
      }

      return age;
    } else if (this._value.estimatedBirthYear) {
      const referenceYear = this._value.dateOfDeath?.getFullYear() || new Date().getFullYear();
      return referenceYear - this._value.estimatedBirthYear;
    }

    return null;
  }

  // Get age in years, months, days
  get detailedAge(): { years: number; months: number; days: number } | null {
    if (!this._value.dateOfBirth) return null;

    const referenceDate = this._value.dateOfDeath || new Date();
    let years = referenceDate.getFullYear() - this._value.dateOfBirth.getFullYear();
    let months = referenceDate.getMonth() - this._value.dateOfBirth.getMonth();
    let days = referenceDate.getDate() - this._value.dateOfBirth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  // Check if person is a minor (<18 years)
  get isMinor(): boolean {
    const age = this.age;
    return age !== null && age < 18;
  }

  // Check if person is a young adult (18-25)
  get isYoungAdult(): boolean {
    const age = this.age;
    return age !== null && age >= 18 && age <= 25;
  }

  // Check if person is elderly (>60 years)
  get isElderly(): boolean {
    const age = this.age;
    return age !== null && age > 60;
  }

  // Check if person is of legal age for marriage (18+ in Kenya)
  get isMarriageAge(): boolean {
    const age = this.age;
    return age !== null && age >= 18;
  }

  // Check if person is of legal age for will making (18+ in Kenya)
  get isWillMakingAge(): boolean {
    const age = this.age;
    return age !== null && age >= 18;
  }

  // Check if person was a minor at time of death
  get wasMinorAtDeath(): boolean {
    if (!this._value.dateOfDeath) return false;

    const age = this.age;
    return age !== null && age < 18 && this._value.dateOfDeath !== undefined;
  }

  // Get next birthday
  get nextBirthday(): Date | null {
    if (!this._value.dateOfBirth) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const birthDate = this._value.dateOfBirth;

    const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());

    if (nextBirthday < now) {
      nextBirthday.setFullYear(currentYear + 1);
    }

    return nextBirthday;
  }

  // Get days until next birthday
  get daysUntilBirthday(): number | null {
    const nextBirthday = this.nextBirthday;
    if (!nextBirthday) return null;

    const now = new Date();
    const diffTime = nextBirthday.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Get zodiac sign (for cultural reference)
  get zodiacSign(): string | null {
    if (!this._value.dateOfBirth) return null;

    const month = this._value.dateOfBirth.getMonth() + 1;
    const day = this._value.dateOfBirth.getDate();

    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
    return 'Capricorn';
  }

  // Get generation (for demographic analysis)
  get generation(): string | null {
    const birthYear = this._value.dateOfBirth?.getFullYear() || this._value.estimatedBirthYear;
    if (!birthYear) return null;

    if (birthYear >= 1997) return 'Generation Z';
    if (birthYear >= 1981) return 'Millennials';
    if (birthYear >= 1965) return 'Generation X';
    if (birthYear >= 1946) return 'Baby Boomers';
    return 'Silent Generation';
  }

  toJSON() {
    return {
      dateOfBirth: this._value.dateOfBirth?.toISOString(),
      dateOfDeath: this._value.dateOfDeath?.toISOString(),
      estimatedBirthYear: this._value.estimatedBirthYear,
      isApproximateDate: this._value.isApproximateDate,
      age: this.age,
      detailedAge: this.detailedAge,
      isMinor: this.isMinor,
      isYoungAdult: this.isYoungAdult,
      isElderly: this.isElderly,
      isMarriageAge: this.isMarriageAge,
      isWillMakingAge: this.isWillMakingAge,
      wasMinorAtDeath: this.wasMinorAtDeath,
      nextBirthday: this.nextBirthday?.toISOString(),
      daysUntilBirthday: this.daysUntilBirthday,
      zodiacSign: this.zodiacSign,
      generation: this.generation,
    };
  }
}
