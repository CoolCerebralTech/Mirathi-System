// src/application/guardianship/queries/handlers/get-guardianship-by-id.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetGuardianshipByIdQuery } from '../impl/get-guardianship-by-id.query';
import { GuardianshipDetailsReadModel } from '../read-models/guardianship-details.read-model';

@QueryHandler(GetGuardianshipByIdQuery)
export class GetGuardianshipByIdHandler extends BaseQueryHandler<
  GetGuardianshipByIdQuery,
  GuardianshipDetailsReadModel
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(query: GetGuardianshipByIdQuery): Promise<Result<GuardianshipDetailsReadModel>> {
    try {
      const aggregate = await this.guardianshipRepo.findById(query.guardianshipId);

      if (!aggregate) {
        return Result.fail(new AppErrors.NotFoundError('Guardianship', query.guardianshipId));
      }

      // Map Domain Aggregate to Read Model
      const props = (aggregate as any).props; // Accessing props for mapping

      const readModel = new GuardianshipDetailsReadModel({
        id: aggregate.id.toString(),
        caseNumber: props.caseNumber || 'PENDING',
        status: props.status,
        ward: {
          id: props.wardReference.memberId,
          name: props.wardFullName,
          dateOfBirth: props.wardDateOfBirth,
          age: props.wardReference.getAge(),
          gender: props.wardReference.gender,
        },
        legal: {
          type: props.guardianshipType.value,
          jurisdiction: props.jurisdiction,
          courtStation: props.courtOrder?.getValue().courtStation,
          judgeName: props.courtOrder?.getValue().judgeName,
          orderDate: props.courtOrder?.getValue().orderDate,
        },
        guardians: aggregate.getActiveGuardians().map((g) => ({
          guardianId: g.guardianId,
          name: (g as any).props.guardianName,
          role: (g as any).props.role,
          isPrimary: (g as any).props.isPrimary,
          status: (g as any).props.status,
          contactPhone: (g as any).props.contactInfo.getFormattedPhone('LOCAL'),
          relationshipToWard: 'TBD', // This would ideally come from Family Service linkage
        })),
        compliance: {
          score: aggregate.getComplianceSummary().submittedChecks > 0 ? 100 : 0, // Simplified logic
          nextReportDue: aggregate.getNextComplianceDue() || new Date(),
          isBonded: props.bondStatus === 'POSTED',
          lastReportDate: undefined, // Would be calculated from history
        },
      });

      this.logSuccess(query, readModel);
      return Result.ok(readModel);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
