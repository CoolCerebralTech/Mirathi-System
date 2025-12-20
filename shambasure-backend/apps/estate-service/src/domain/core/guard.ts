// src/domain/core/guard.ts

export interface IGuardResult {
  succeeded: boolean;
  message?: string;
}

export interface IGuardArgument {
  argument: any;
  argumentName: string;
}

export type GuardArgumentCollection = IGuardArgument[];

export class Guard {
  public static combine(guardResults: IGuardResult[]): IGuardResult {
    for (const result of guardResults) {
      if (result.succeeded === false) return result;
    }

    return { succeeded: true };
  }

  public static againstNullOrUndefined(argument: any, argumentName: string): IGuardResult {
    if (argument === null || argument === undefined) {
      return {
        succeeded: false,
        message: `${argumentName} is null or undefined`,
      };
    }

    return { succeeded: true };
  }

  public static againstNullOrUndefinedBulk(args: GuardArgumentCollection): IGuardResult {
    for (const arg of args) {
      const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
      if (!result.succeeded) return result;
    }

    return { succeeded: true };
  }

  public static isOneOf(value: any, validValues: any[], argumentName: string): IGuardResult {
    let isValid = false;
    for (const validValue of validValues) {
      if (value === validValue) {
        isValid = true;
      }
    }

    if (isValid) {
      return { succeeded: true };
    }

    return {
      succeeded: false,
      message: `${argumentName} isn't oneOf the correct types in ${JSON.stringify(validValues)}. Got "${value}".`,
    };
  }

  public static inRange(num: number, min: number, max: number, argumentName: string): IGuardResult {
    const isInRange = num >= min && num <= max;
    if (!isInRange) {
      return {
        succeeded: false,
        message: `${argumentName} is not within range ${min} to ${max}.`,
      };
    }

    return { succeeded: true };
  }

  public static allInRange(
    numbers: number[],
    min: number,
    max: number,
    argumentName: string,
  ): IGuardResult {
    let failingResult: IGuardResult = { succeeded: true };

    for (const num of numbers) {
      const numIsInRangeResult = this.inRange(num, min, max, argumentName);
      if (!numIsInRangeResult.succeeded) {
        failingResult = numIsInRangeResult;
        break;
      }
    }

    return failingResult;
  }

  public static againstInvalidPattern(
    value: string,
    pattern: RegExp,
    argumentName: string,
  ): IGuardResult {
    if (!pattern.test(value)) {
      return {
        succeeded: false,
        message: `${argumentName} doesn't match the required pattern: ${pattern}`,
      };
    }

    return { succeeded: true };
  }

  public static againstFutureDate(date: Date, argumentName: string): IGuardResult {
    if (date > new Date()) {
      return {
        succeeded: false,
        message: `${argumentName} cannot be in the future`,
      };
    }

    return { succeeded: true };
  }

  public static againstPastDate(date: Date, argumentName: string): IGuardResult {
    if (date < new Date()) {
      return {
        succeeded: false,
        message: `${argumentName} cannot be in the past`,
      };
    }

    return { succeeded: true };
  }

  public static againstNegativeNumber(value: number, argumentName: string): IGuardResult {
    if (value < 0) {
      return {
        succeeded: false,
        message: `${argumentName} cannot be negative`,
      };
    }

    return { succeeded: true };
  }

  public static againstZeroOrNegative(value: number, argumentName: string): IGuardResult {
    if (value <= 0) {
      return {
        succeeded: false,
        message: `${argumentName} must be greater than 0`,
      };
    }

    return { succeeded: true };
  }

  public static againstEmptyString(value: string, argumentName: string): IGuardResult {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return {
        succeeded: false,
        message: `${argumentName} cannot be empty`,
      };
    }

    return { succeeded: true };
  }

  public static againstEmptyArray(value: any[], argumentName: string): IGuardResult {
    if (!Array.isArray(value) || value.length === 0) {
      return {
        succeeded: false,
        message: `${argumentName} cannot be empty`,
      };
    }

    return { succeeded: true };
  }

  // Kenyan law specific validations (Quick Checks)
  public static againstInvalidKenyanDateFormat(
    dateString: string,
    argumentName: string,
  ): IGuardResult {
    const kenyanDateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!kenyanDateFormat.test(dateString)) {
      return {
        succeeded: false,
        message: `${argumentName} must be in DD/MM/YYYY format`,
      };
    }

    return { succeeded: true };
  }

  public static againstInvalidPhoneNumber(phone: string, argumentName: string): IGuardResult {
    // Basic regex for quick guarding. The PhoneNumber ValueObject has full validation.
    const kenyanPhonePattern = /^(?:254|\+254|0)?(7[0-9]{8}|1[0-9]{8})$/;
    if (!kenyanPhonePattern.test(phone)) {
      return {
        succeeded: false,
        message: `${argumentName} must be a valid Kenyan phone number`,
      };
    }

    return { succeeded: true };
  }
}
