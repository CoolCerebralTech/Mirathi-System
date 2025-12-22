// src/domain/core/result.ts

export interface LegalComplianceIssue {
  section: string; // e.g., "LSA Section 35(1)(b)"
  requirement: string; // e.g., "Spouse must retain life interest"
  severity: 'BLOCKING' | 'WARNING' | 'ADVISORY';
  details?: string;
}

/**
 * A generic Result envelope for Domain Operations.
 * Represents the outcome of an operation (Success or Failure).
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

  public getErrorValue(): Error {
    return this.error as Error;
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, null, value ?? null);
  }

  public static fail<U>(error: Error | string): Result<U> {
    const errObj = typeof error === 'string' ? new Error(error) : error;
    return new Result<U>(false, errObj);
  }

  /**
   * Combines multiple results. If any fail, returns the first failure.
   */
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
 * Used by Domain Services (e.g., IntestacyCalculator) to return legally compliant distributions
 * while flagging warnings (e.g., Customary Law conflicts with Constitution).
 */
export class KenyanLegalResult<T> extends Result<T> {
  private _complianceIssues: LegalComplianceIssue[] = [];

  protected constructor(isSuccess: boolean, error: Error | null = null, value: T | null = null) {
    super(isSuccess, error, value);
  }

  public get issues(): ReadonlyArray<LegalComplianceIssue> {
    return this._complianceIssues;
  }

  public get warnings(): LegalComplianceIssue[] {
    return this._complianceIssues.filter((i) => i.severity === 'WARNING');
  }

  public get violations(): LegalComplianceIssue[] {
    return this._complianceIssues.filter((i) => i.severity === 'BLOCKING');
  }

  public addIssue(issue: LegalComplianceIssue): void {
    this._complianceIssues.push(issue);
  }

  public hasBlockingViolations(): boolean {
    return this._complianceIssues.some((i) => i.severity === 'BLOCKING');
  }

  // --- Static Factories ---

  public static legalOk<U>(value?: U): KenyanLegalResult<U> {
    return new KenyanLegalResult<U>(true, null, value ?? null);
  }

  public static legalFail<U>(
    section: string,
    requirement: string,
    detail?: string,
  ): KenyanLegalResult<U> {
    const message = `Legal Violation [${section}]: ${requirement}`;
    const error = new Error(message);
    error.name = 'LegalComplianceError';

    const result = new KenyanLegalResult<U>(false, error);
    result.addIssue({
      section,
      requirement,
      severity: 'BLOCKING',
      details: detail,
    });

    return result;
  }

  public static fromResult<U>(result: Result<U>): KenyanLegalResult<U> {
    if (result.isSuccess) {
      return KenyanLegalResult.legalOk<U>(result.getValue());
    }
    return new KenyanLegalResult<U>(false, result.error);
  }
}
