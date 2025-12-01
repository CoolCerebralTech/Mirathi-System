// domain/exceptions/asset-not-found.exception.ts
export class AssetNotFoundException extends Error {
  constructor(assetId: string) {
    super(`Asset with ID ${assetId} not found`);
    this.name = 'AssetNotFoundException';
  }
}
