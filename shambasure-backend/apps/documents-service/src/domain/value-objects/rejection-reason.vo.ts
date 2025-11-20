export class RejectionReason {
  private static readonly MAX_LENGTH = 1000;

  constructor(private readonly _value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this._value) throw new Error('Rejection reason cannot be empty');
    if (this._value.length > RejectionReason.MAX_LENGTH)
      throw new Error(`Rejection reason exceeds ${RejectionReason.MAX_LENGTH} characters`);
  }

  get value(): string {
    return this._value;
  }
  static create(value: string): RejectionReason {
    return new RejectionReason(value);
  }
}
