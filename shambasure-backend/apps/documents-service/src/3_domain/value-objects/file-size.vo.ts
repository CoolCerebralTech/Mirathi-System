export class FileSize {
  private static readonly MAX_SIZE = 50 * 1024 * 1024; // 50MB

  constructor(private readonly _value: number) {
    this.validate();
  }

  private validate(): void {
    if (this._value <= 0) throw new Error('File size must be positive');
    if (this._value > FileSize.MAX_SIZE)
      throw new Error(`File size exceeds ${FileSize.MAX_SIZE} bytes limit`);
  }

  /** ✅ Canonical getter used by entities */
  get value(): number {
    return this._value;
  }

  /** ✅ Alias for consistent naming in models (e.g. sizeInBytes) */
  get sizeInBytes(): number {
    return this._value;
  }

  get inMB(): number {
    return +(this._value / (1024 * 1024)).toFixed(2);
  }

  get inKB(): number {
    return +(this._value / 1024).toFixed(2);
  }

  static create(value: number): FileSize {
    return new FileSize(value);
  }
}
