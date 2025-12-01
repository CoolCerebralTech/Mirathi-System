// domain/exceptions/asset-not-owned.exception.ts
export class AssetNotOwnedException extends Error {
  constructor(assetId: string, estatePlanningId: string) {
    super(`Asset ${assetId} not owned by Estate Planning ${estatePlanningId}`);
    this.name = 'AssetNotOwnedException';
  }
}
