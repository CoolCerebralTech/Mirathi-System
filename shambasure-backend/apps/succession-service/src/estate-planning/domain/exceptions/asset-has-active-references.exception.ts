// domain/exceptions/asset-has-active-references.exception.ts
export class AssetHasActiveReferencesException extends Error {
  constructor(assetId: string, references: string[]) {
    super(`Asset ${assetId} has active references: ${references.join(', ')}`);
    this.name = 'AssetHasActiveReferencesException';
  }
}
