// application/guardianship/queries/handlers/get-annual-report-status.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { GuardianReportStatus } from '../../../../domain/entities/guardian-assignment.entity';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetAnnualReportStatusQuery } from '../impl/get-annual-report-status.query';
import {
  AnnualReportHistoryItem,
  AnnualReportStatusReadModel,
} from '../read-models/annual-report-status.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetAnnualReportStatusQuery)
export class GetAnnualReportStatusHandler extends BaseQueryHandler<
  GetAnnualReportStatusQuery,
  AnnualReportStatusReadModel
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetAnnualReportStatusQuery): Promise<Result<AnnualReportStatusReadModel>> {
    try {
      this.validateQuery(query);

      const aggregate = await this.repository.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new Error(`Guardianship ${query.guardianshipId} not found`));
      }

      // Default to primary guardian for report status if not specified
      const guardian = aggregate.getPrimaryGuardian() || aggregate.getActiveGuardians()[0];

      if (!guardian) {
        return Result.fail(new Error('No active guardian found for this guardianship'));
      }

      const reporting = guardian.getReportingSchedule();

      const model = new AnnualReportStatusReadModel();
      model.guardianshipId = aggregate.id.toString();
      model.guardianId = guardian.guardianId.toString();
      model.reportingCycle = 'APPOINTMENT_ANNIVERSARY';

      if (reporting) {
        // FIX 1: Handle potential undefined date with a fallback (or use '!' if you are certain)
        model.nextReportDue = reporting.nextReportDue ?? new Date();

        model.isOverdue = guardian.isReportOverdue();
        model.history = []; // Ideally populated from Event Store or ReportingSchedule internal history

        // FIX 2: Use the Domain Enum for comparison
        if (reporting.status !== GuardianReportStatus.PENDING) {
          const currentItem = new AnnualReportHistoryItem();
          currentItem.reportDate = new Date(); // Approximate
          currentItem.status = reporting.status;
          currentItem.summary = 'Current Reporting Period';
          model.history.push(currentItem);
        }
      } else {
        // Handle cases where reporting isn't required yet
        model.nextReportDue = new Date(); // Placeholder
        model.isOverdue = false;
        model.history = [];
      }

      this.logSuccess(query, model);
      return Result.ok(model);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
