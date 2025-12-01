// domain/exceptions/asset-already-exists.exception.ts
export class AssetAlreadyExistsException extends Error {
  constructor(assetId: string) {
    super(`Asset with ID ${assetId} already exists`);
    this.name = 'AssetAlreadyExistsException';
  }
}
