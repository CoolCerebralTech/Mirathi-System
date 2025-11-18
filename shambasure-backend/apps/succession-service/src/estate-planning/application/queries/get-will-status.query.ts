// estate-planning/application/queries/get-will-status.query.ts
export class GetWillStatusQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
