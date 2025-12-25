// application/guardianship/queries/handlers/get-ward-guardianships.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetWardGuardianshipsQuery } from '../impl/get-ward-guardianships.query';
import { GuardianshipSummaryReadModel } from '../read-models/guardianship-summary.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetWardGuardianshipsQuery)
export class GetWardGuardianshipsHandler extends BaseQueryHandler<
  GetWardGuardianshipsQuery,
  GuardianshipSummaryReadModel[]
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetWardGuardianshipsQuery): Promise<Result<GuardianshipSummaryReadModel[]>> {
    try {
      this.validateQuery(query);

      const aggregates = await this.repository.findAllByWardId(query.wardId);

      const filtered = query.includeDissolved ? aggregates : aggregates.filter((a) => a.isActive);

      const models = filtered.map((agg) => {
        const raw = agg.toJSON();
        const compliance = agg.getComplianceStatus();

        const model = new GuardianshipSummaryReadModel();
        model.id = raw.id;
        model.wardId = raw.wardInfo.wardId;
        model.wardName = 'Ward Name';
        model.primaryGuardianName = 'Primary Guardian';
        model.guardianType = raw.guardians[0]?.type; // Simplified
        model.courtStation = raw.courtOrder?.courtStation;
        model.establishedDate = new Date(raw.establishedDate);
        model.status = raw.isActive ? 'ACTIVE' : 'DISSOLVED';
        model.isS72Compliant = compliance.s72Compliant;
        model.isS73Compliant = compliance.s73Compliant;
        model.activeWarningsCount = compliance.warnings.length;

        return model;
      });

      this.logSuccess(query, models);
      return Result.ok(models);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
