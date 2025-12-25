// application/guardianship/queries/handlers/get-guardian-active-assignments.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetGuardianActiveAssignmentsQuery } from '../impl/get-guardian-active-assignments.query';
import { GuardianAssignmentReadModel } from '../read-models/guardian-assignment.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetGuardianActiveAssignmentsQuery)
export class GetGuardianActiveAssignmentsHandler extends BaseQueryHandler<
  GetGuardianActiveAssignmentsQuery,
  GuardianAssignmentReadModel[]
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetGuardianActiveAssignmentsQuery,
  ): Promise<Result<GuardianAssignmentReadModel[]>> {
    try {
      this.validateQuery(query);

      // Fetch all where user is a guardian
      const aggregates = await this.repository.findByGuardianId(query.guardianId, true); // true = active only

      const models = aggregates
        .map((agg) => {
          const raw = agg.toJSON();

          // Find the specific guardian entity for this user within the aggregate
          const myGuardianEntity = agg.getGuardianById(query.guardianId);
          if (!myGuardianEntity) return null; // Should not happen given repo query

          const powers = myGuardianEntity.getPowers();
          const bond = myGuardianEntity.getBond();
          const reporting = myGuardianEntity.getReportingSchedule();

          const model = new GuardianAssignmentReadModel();
          model.guardianshipId = raw.id;
          model.wardId = raw.wardInfo.wardId;
          model.wardName = 'Ward Name'; // Placeholder
          model.myRole = myGuardianEntity.type;
          model.appointmentDate = myGuardianEntity.appointmentDate;

          model.myPowers = {
            manageProperty: powers.hasPropertyManagementPowers,
            medicalConsent: powers.canConsentToMedical,
            marriageConsent: powers.canConsentToMarriage,
          };

          model.nextReportDue = reporting?.nextReportDue;
          model.bondExpiryDate = bond?.expiryDate;
          model.isBondValid = myGuardianEntity.isBondPosted() && !myGuardianEntity.isBondExpired();

          return model;
        })
        .filter(Boolean) as GuardianAssignmentReadModel[];

      this.logSuccess(query, models);
      return Result.ok(models);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
