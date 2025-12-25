// application/guardianship/queries/handlers/get-bond-expiry-dashboard.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetBondExpiryDashboardQuery } from '../impl/get-bond-expiry-dashboard.query';
import { BondExpiryReadModel } from '../read-models/bond-expiry.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetBondExpiryDashboardQuery)
export class GetBondExpiryDashboardHandler extends BaseQueryHandler<
  GetBondExpiryDashboardQuery,
  BondExpiryReadModel[]
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetBondExpiryDashboardQuery): Promise<Result<BondExpiryReadModel[]>> {
    try {
      this.validateQuery(query);

      const days = query.filters.expiringWithinDays || 90; // Default 90 days

      // Use the specific repository method for this domain query
      const atRiskAggregates = await this.repository.findAllWithExpiringBonds(days);

      const models: BondExpiryReadModel[] = [];

      for (const agg of atRiskAggregates) {
        const raw = agg.toJSON();

        // Find the specific guardian(s) with expiring bonds in this aggregate
        const expiringGuardians = agg.getActiveGuardians().filter((g) => {
          if (!g.isBondPosted()) return false;
          const expiry = g.getBond()!.expiryDate;
          const daysUntil = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysUntil <= days;
        });

        for (const g of expiringGuardians) {
          const bond = g.getBond()!;
          const daysRemaining = Math.ceil(
            (bond.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          );

          const model = new BondExpiryReadModel();
          model.guardianshipId = raw.id;
          model.guardianId = g.guardianId.toString();
          model.guardianName = 'Guardian Name';
          model.wardName = 'Ward Name';
          model.courtStation = raw.courtOrder?.courtStation || 'Unknown';
          model.caseNumber = raw.courtOrder?.orderNumber || 'N/A';
          model.bondProvider = bond.provider;
          model.bondPolicyNumber = bond.policyNumber;
          model.bondAmountKES = bond.amount.getAmount();
          model.expiryDate = bond.expiryDate;
          model.daysRemaining = daysRemaining;
          model.status = daysRemaining < 0 ? 'EXPIRED' : 'EXPIRING_SOON';

          models.push(model);
        }
      }

      this.logSuccess(query, models);
      return Result.ok(models);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
