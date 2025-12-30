// src/application/guardianship/queries/handlers/get-ward-compliance-history.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import { ComplianceCheckEntity } from '../../../../domain/entities/compliance-check.entity';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseQueryHandler } from '../../../common/base/base.query-handler';
import { Result } from '../../../common/result';
import { GetWardComplianceHistoryQuery } from '../impl/get-ward-compliance-history.query';
import {
  ComplianceTimelineReadModel,
  TimelineEventItem,
} from '../read-models/compliance-timeline.read-model';

@QueryHandler(GetWardComplianceHistoryQuery)
export class GetWardComplianceHistoryHandler extends BaseQueryHandler<
  GetWardComplianceHistoryQuery,
  ComplianceTimelineReadModel
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly guardianshipRepo: IGuardianshipRepository,
    queryBus: QueryBus,
  ) {
    super(queryBus);
  }

  async execute(
    query: GetWardComplianceHistoryQuery,
  ): Promise<Result<ComplianceTimelineReadModel>> {
    try {
      const aggregate = await this.guardianshipRepo.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new AppErrors.NotFoundError('Guardianship', query.guardianshipId));
      }

      const props = (aggregate as any).props;
      const checks: ComplianceCheckEntity[] = props.complianceChecks;

      // Filter by year if requested
      const filteredChecks = query.options.year
        ? checks.filter((c: any) => c.props.year === query.options.year)
        : checks;

      const events: TimelineEventItem[] = [];

      // Flatten Checks into Events
      filteredChecks.forEach((check: any) => {
        const cProps = check.props;

        // 1. Due Date Event
        events.push({
          id: `${check.id}-due`,
          date: cProps.dueDate,
          type: 'DUE',
          title: `Report Due: ${cProps.reportTitle}`,
          description: `Deadline for ${cProps.year} ${cProps.reportingPeriod}`,
          statusColor: new Date() > cProps.dueDate && cProps.status === 'DRAFT' ? 'red' : 'gray',
          icon: 'calendar-clock',
        });

        // 2. Submission Event
        if (cProps.submissionDate) {
          events.push({
            id: `${check.id}-sub`,
            date: cProps.submissionDate,
            type: 'SUBMITTED',
            title: 'Report Submitted',
            description: `Via ${cProps.submissionMethods[0]?.method || 'System'}`,
            statusColor: 'blue',
            icon: 'file-check',
            actor: cProps.submittedBy,
            referenceId: cProps.submissionMethods[0]?.confirmationNumber,
          });
        }

        // 3. Review/Acceptance Event
        if (cProps.acceptedDate) {
          events.push({
            id: `${check.id}-acc`,
            date: cProps.acceptedDate,
            type: 'ACCEPTED',
            title: 'Report Accepted by Court',
            description: 'Compliance requirement satisfied',
            statusColor: 'green',
            icon: 'gavel',
            actor: cProps.reviewedBy,
          });
        }
      });

      // Sort descending (newest first)
      events.sort((a, b) => b.date.getTime() - a.date.getTime());

      const readModel = new ComplianceTimelineReadModel({
        guardianshipId: aggregate.id.toString(),
        wardName: props.wardFullName,
        summary: {
          totalReports: checks.length,
          onTimeRate: 85, // Todo: Calculate real rate
          nextDueDate: aggregate.getNextComplianceDue(),
          status: props.status === 'ACTIVE' ? 'COMPLIANT' : 'AT_RISK',
        },
        events,
      });

      this.logSuccess(query, readModel);
      return Result.ok(readModel);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
