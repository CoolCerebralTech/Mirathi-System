export enum StorageProviderEnum {
  LOCAL = 'local',
  S3 = 's3',
  GCS = 'gcs',
  AZURE = 'azure',
}

export class StorageProvider {
  constructor(private readonly _value: StorageProviderEnum) {
    this.validate();
  }

  private validate(): void {
    if (!Object.values(StorageProviderEnum).includes(this._value)) {
      throw new Error('Invalid storage provider');
    }
  }

  get value(): StorageProviderEnum {
    return this._value;
  }

  isCloud(): boolean {
    return this._value !== StorageProviderEnum.LOCAL;
  }

  equals(other: StorageProvider): boolean {
    return this._value === other._value;
  }

  /** ✅ Factory method — this was missing */
  static create(value: string | StorageProviderEnum): StorageProvider {
    if (typeof value === 'string') {
      if (!Object.values(StorageProviderEnum).includes(value as StorageProviderEnum)) {
        throw new Error(`Invalid storage provider: ${value}`);
      }
      return new StorageProvider(value as StorageProviderEnum);
    }

    return new StorageProvider(value);
  }
}
