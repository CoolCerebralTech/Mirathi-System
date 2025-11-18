// estate-planning/application/queries/get-witnesses.query.ts
export class GetWitnessesQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
  ) {}
}
