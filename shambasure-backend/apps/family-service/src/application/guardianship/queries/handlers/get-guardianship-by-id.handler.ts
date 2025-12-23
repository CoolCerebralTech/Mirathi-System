// application/guardianship/queries/handlers/get-guardianship-by-id.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

// Assumed path
import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/base/result';
import { GetGuardianshipByIdQuery } from '../impl/get-guardianship-by-id.query';
import {
  GuardianDetailsDto,
  GuardianshipDetailsReadModel,
} from '../read-models/guardianship-details.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetGuardianshipByIdQuery)
export class GetGuardianshipByIdHandler extends BaseQueryHandler<
  GetGuardianshipByIdQuery,
  GuardianshipDetailsReadModel
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetGuardianshipByIdQuery): Promise<Result<GuardianshipDetailsReadModel>> {
    try {
      this.validateQuery(query);

      const aggregate = await this.repository.findById(query.guardianshipId);

      if (!aggregate) {
        return Result.fail(new Error(`Guardianship with ID ${query.guardianshipId} not found`));
      }

      // Map Aggregate -> Read Model
      const readModel = this.mapToReadModel(aggregate);

      this.logSuccess(query, readModel);
      return Result.ok(readModel);
    } catch (error) {
      this.handleError(error, query);
    }
  }

  private mapToReadModel(aggregate: GuardianshipAggregate): GuardianshipDetailsReadModel {
    // Extract props from aggregate (assuming public getter or using toJSON/props access)
    // Since aggregate props are usually private, we rely on public getters or toJSON()
    const raw = aggregate.toJSON();

    const model = new GuardianshipDetailsReadModel();
    model.id = raw.id;

    // Ward Info
    model.wardId = raw.wardInfo.wardId;
    // In a real app, you might fetch name from a separate service here or rely on cached info
    model.wardName = 'Ward Name Placeholder';
    model.wardDateOfBirth = new Date(raw.wardInfo.dateOfBirth);
    model.wardCurrentAge = raw.wardInfo.currentAge;
    model.wardIsDeceased = raw.wardInfo.isDeceased;
    model.wardIsIncapacitated = raw.wardInfo.isIncapacitated;

    // Meta
    model.establishedDate = new Date(raw.establishedDate);
    model.status = raw.isActive ? 'ACTIVE' : 'DISSOLVED';
    model.dissolvedDate = raw.dissolvedDate ? new Date(raw.dissolvedDate) : undefined;
    model.dissolutionReason = raw.dissolutionReason;

    // Legal
    model.courtStation = raw.courtOrder?.courtStation;
    model.courtOrderNumber = raw.courtOrder?.orderNumber;
    model.isCustomaryLaw = raw.customaryLawApplies;

    // Guardians
    model.guardians = raw.guardians.map((g: any) => {
      const dto = new GuardianDetailsDto();
      dto.guardianId = g.guardianId;
      dto.name = 'Guardian Name Placeholder'; // Ideally fetched from User Service
      dto.type = g.type;
      dto.appointmentDate = new Date(g.appointmentDate);
      dto.isActive = g.isActive;
      dto.hasPropertyManagementPowers = g.powers.hasPropertyManagementPowers;
      dto.canConsentToMedical = g.powers.canConsentToMedical;
      dto.canConsentToMarriage = g.powers.canConsentToMarriage;
      dto.restrictions = g.powers.restrictions;
      dto.bondAmountKES = g.bond?.amount?.amount; // Assuming Money VO structure
      dto.annualAllowanceKES = g.annualAllowance?.amount;
      return dto;
    });

    model.primaryGuardianId = raw.primaryGuardianId;
    model.requiresBond = aggregate.isS72Compliant() === false; // Simplification
    model.complianceWarnings = raw.complianceWarnings || [];

    return model;
  }
}
