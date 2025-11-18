// estate-planning/application/queries/get-executors.query.ts
export class GetExecutorsQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
