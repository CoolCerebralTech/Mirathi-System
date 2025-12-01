// queries/assets/get-estate-assets-summary.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetEstateAssetsSummaryQuery implements IQuery {
  constructor(public readonly estatePlanningId: string) {}
}
