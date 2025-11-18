// estate-planning/application/queries/get-will.query.ts
export class GetWillQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
