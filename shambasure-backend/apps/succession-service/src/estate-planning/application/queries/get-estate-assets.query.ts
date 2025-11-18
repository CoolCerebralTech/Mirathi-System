// estate-planning/application/queries/get-estate-assets.query.ts
export class GetEstateAssetsQuery {
  constructor(
    public readonly testatorId: string,
    public readonly willId?: string,
    public readonly includeStandalone: boolean = true,
  ) {}
}
