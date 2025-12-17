/**
 * A generic Result envelope for Domain Operations.
 * Represents the outcome of an operation (Success or Failure).
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error: Error | null;
  private readonly _value: T | null;

  // Changed to 'protected' so subclasses (like KenyanLegalResult) can use 'super()'
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

    Object.freeze(this); // specific for production: make the instance immutable
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot retrieve value from failed result. Error: ${this.error?.message}`);
    }
    // We cast here because we checked isSuccess, but T could technically be null.
    return this._value as T;
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
 * Adds support for specific Compliance Warnings and Violations.
 */
export class KenyanLegalResult<T> extends Result<T> {
  // Using readonly arrays to encourage immutability, but allowing internal mutation via methods
  private _complianceWarnings: string[] = [];
  private _complianceViolations: string[] = [];

  // Expose as public readonly to preventing direct array manipulation from outside
  public get complianceWarnings(): ReadonlyArray<string> {
    return this._complianceWarnings;
  }

  public get complianceViolations(): ReadonlyArray<string> {
    return this._complianceViolations;
  }

  /**
   * Override constructor to initialize generic Result parts
   */
  protected constructor(isSuccess: boolean, error: Error | null = null, value: T | null = null) {
    super(isSuccess, error, value);
  }

  public addWarning(section: string, warning: string): void {
    this._complianceWarnings.push(`[${section}] WARNING: ${warning}`);
  }

  public addViolation(section: string, violation: string): void {
    this._complianceViolations.push(`[${section}] VIOLATION: ${violation}`);
  }

  public hasComplianceIssues(): boolean {
    return this._complianceViolations.length > 0;
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
    const message = `Legal Compliance Violation: ${section} - ${requirement} ${detail ? `(${detail})` : ''}`;
    const error = new Error(message);
    error.name = 'LegalComplianceError';

    const result = new KenyanLegalResult<U>(false, error);
    result.addViolation(section, requirement);

    return result;
  }

  /**
   * Creates a result from an existing generic Result,
   * useful when converting a standard Domain failure to a Legal result.
   */
  public static fromResult<U>(result: Result<U>): KenyanLegalResult<U> {
    if (result.isSuccess) {
      return KenyanLegalResult.legalOk<U>(result.getValue());
    }
    return new KenyanLegalResult<U>(false, result.error);
  }
}
