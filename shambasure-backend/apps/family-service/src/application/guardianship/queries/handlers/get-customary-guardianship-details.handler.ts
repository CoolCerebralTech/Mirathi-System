// application/guardianship/queries/handlers/get-customary-guardianship-details.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GetCustomaryGuardianshipDetailsQuery } from '../impl/get-customary-guardianship-details.query';
import {
  CustomaryGuardianshipReadModel,
  ElderApprovalDto,
} from '../read-models/customary-guardianship.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetCustomaryGuardianshipDetailsQuery)
export class GetCustomaryGuardianshipDetailsHandler extends BaseQueryHandler<
  GetCustomaryGuardianshipDetailsQuery,
  CustomaryGuardianshipReadModel
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetCustomaryGuardianshipDetailsQuery,
  ): Promise<Result<CustomaryGuardianshipReadModel>> {
    try {
      this.validateQuery(query);

      const aggregate = await this.repository.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new Error(`Guardianship ${query.guardianshipId} not found`));
      }

      if (!aggregate.isCustomaryLawGuardianship()) {
        return Result.fail(new Error('This guardianship is not governed by customary law'));
      }

      const details = aggregate.getCustomaryLawDetails();
      if (!details) {
        return Result.fail(new Error('Customary details are missing'));
      }

      const model = new CustomaryGuardianshipReadModel();
      model.guardianshipId = aggregate.id.toString();
      model.ethnicGroup = details.ethnicGroup;
      model.customaryAuthority = details.customaryAuthority;
      model.ceremonyDate = details.ceremonyDate;
      model.witnesses = details.witnessNames || [];
      model.specialConditions = details.specialConditions || {};

      model.elderApprovals = (details.elderApprovalRecords || []).map((r) => {
        const dto = new ElderApprovalDto();
        dto.elderName = r.elderName;
        dto.role = r.role;
        dto.approvalDate = r.approvalDate;
        return dto;
      });

      model.hasConflictWithStatutoryLaw = false; // Placeholder logic

      this.logSuccess(query, model);
      return Result.ok(model);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
