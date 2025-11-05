export class DocumentChecksum {
  constructor(private readonly _value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this._value) throw new Error('Checksum cannot be empty');
    if (!/^[a-f0-9]{64}$/i.test(this._value))
      throw new Error('Checksum must be a valid SHA-256 hash');
  }

  get value(): string {
    return this._value;
  }
  equals(other: DocumentChecksum): boolean {
    return this._value === other._value;
  }
  static create(value: string): DocumentChecksum {
    return new DocumentChecksum(value);
  }
}
