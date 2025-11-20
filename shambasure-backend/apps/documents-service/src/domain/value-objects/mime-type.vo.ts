export class MimeType {
  private static readonly ALLOWED_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]);

  constructor(private readonly _value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this._value) {
      throw new Error('MIME type cannot be empty');
    }
    if (!MimeType.ALLOWED_TYPES.has(this._value.toLowerCase())) {
      throw new Error(`MIME type ${this._value} is not allowed`);
    }
  }

  get value(): string {
    return this._value;
  }
  isImage(): boolean {
    return this._value.startsWith('image/');
  }
  isPdf(): boolean {
    return this._value === 'application/pdf';
  }
  equals(other: MimeType): boolean {
    return this._value === other._value;
  }
  static create(value: string): MimeType {
    return new MimeType(value);
  }
}
