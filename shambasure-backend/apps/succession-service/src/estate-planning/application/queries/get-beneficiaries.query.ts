// estate-planning/application/queries/get-beneficiaries.query.ts
import { DistributionStatus } from '@prisma/client';

export class GetBeneficiariesQuery {
  constructor(
    public readonly willId: string,
    public readonly testatorId: string,
    public readonly assetId?: string,
    public readonly distributionStatus?: DistributionStatus,
  ) {}
}
