// application/guardianship/queries/handlers/get-guardianship-summary.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetGuardianshipSummaryQuery } from '../impl/get-guardianship-summary.query';
import { GuardianshipSummaryReadModel } from '../read-models/guardianship-summary.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetGuardianshipSummaryQuery)
export class GetGuardianshipSummaryHandler extends BaseQueryHandler<
  GetGuardianshipSummaryQuery,
  GuardianshipSummaryReadModel
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetGuardianshipSummaryQuery): Promise<Result<GuardianshipSummaryReadModel>> {
    try {
      this.validateQuery(query);

      // In a real CQRS setup with SQL read DB, you'd use a raw query here.
      // Since we are using the Domain Repo, we fetch the aggregate and project it.
      // Or call a specific lightweight repo method if available (getGuardianshipSummary).

      // Option A: Use Repo Projection (Preferred if implemented)
      // const summary = await this.repository.getGuardianshipSummary(query.guardianshipId);

      // Option B: Map from Aggregate (Fallback)
      const aggregate = await this.repository.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new Error(`Guardianship ${query.guardianshipId} not found`));
      }

      const raw = aggregate.toJSON();
      const compliance = aggregate.getComplianceStatus();

      const model = new GuardianshipSummaryReadModel();
      model.id = raw.id;
      model.wardId = raw.wardInfo.wardId;
      model.wardName = 'Ward Name'; // Placeholder
      model.primaryGuardianName = 'Primary Guardian'; // Placeholder
      model.guardianType = raw.guardians.find(
        (g: any) => g.guardianId === raw.primaryGuardianId,
      )?.type;
      model.courtStation = raw.courtOrder?.courtStation;
      model.establishedDate = new Date(raw.establishedDate);
      model.status = raw.isActive ? 'ACTIVE' : raw.dissolvedDate ? 'DISSOLVED' : 'PENDING';
      model.isS72Compliant = compliance.s72Compliant;
      model.isS73Compliant = compliance.s73Compliant;
      model.activeWarningsCount = compliance.warnings.length;

      this.logSuccess(query, model);
      return Result.ok(model);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
