// src/application/common/result.ts
import {
  ComplianceReport,
  ComplianceViolation,
  ComplianceWarning,
} from './interfaces/use-case.interface';

/**
 * A generic Result envelope for Domain Operations.
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: Error | null;
  private readonly _value: T | null;

  protected constructor(isSuccess: boolean, error: Error | null = null, value: T | null = null) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot retrieve value from failed result. Error: ${this.error?.message}`);
    }
    return this._value as T;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value ?? null);
  }

  public static fail<U>(error: Error | string): Result<U> {
    const errObj = typeof error === 'string' ? new Error(error) : error;
    return new Result<U>(false, errObj);
  }

  public static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail<void>(result.error!);
      }
    }
    return Result.ok<void>();
  }
}

/**
 * Specialized Result for Kenyan Legal Context.
 * Captures Compliance Warnings (risks) and Violations (illegalities).
 */
export class KenyanLegalResult<T> extends Result<T> {
  private _warnings: ComplianceWarning[] = [];
  private _violations: ComplianceViolation[] = [];
  private _recommendations: string[] = [];

  protected constructor(isSuccess: boolean, error: Error | null = null, value: T | null = null) {
    super(isSuccess, error, value);
  }

  // --- Builder Methods ---

  public addWarning(
    section: string,
    issue: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM',
  ): void {
    this._warnings.push({ section, issue, riskLevel });
  }

  public addViolation(
    section: string,
    requirement: string,
    description: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH',
  ): void {
    this._violations.push({ section, requirement, description, severity });
  }

  public addRecommendation(rec: string): void {
    this._recommendations.push(rec);
  }

  // --- Query Methods ---

  public hasViolations(): boolean {
    return this._violations.length > 0;
  }

  public hasWarnings(): boolean {
    return this._warnings.length > 0;
  }

  /**
   * Converts the result state into a full Compliance Report
   */
  public getComplianceReport(): ComplianceReport {
    return {
      isCompliant: this._violations.length === 0,
      violations: [...this._violations],
      warnings: [...this._warnings],
      recommendations: [...this._recommendations],
    };
  }

  // --- Static Factories ---

  public static legalOk<U>(value?: U): KenyanLegalResult<U> {
    return new KenyanLegalResult<U>(true, null, value ?? null);
  }

  public static legalFail<U>(
    section: string,
    requirement: string,
    description: string,
  ): KenyanLegalResult<U> {
    const error = new Error(`Legal Violation [${section}]: ${description}`);
    const result = new KenyanLegalResult<U>(false, error);
    result.addViolation(section, requirement, description, 'CRITICAL');
    return result;
  }

  public static fromResult<U>(result: Result<U>): KenyanLegalResult<U> {
    if (result.isSuccess) {
      return KenyanLegalResult.legalOk<U>(result.getValue());
    }
    return new KenyanLegalResult<U>(false, result.error);
  }
}
