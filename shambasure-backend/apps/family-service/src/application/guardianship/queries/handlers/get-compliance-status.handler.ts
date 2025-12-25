// application/guardianship/queries/handlers/get-compliance-status.handler.ts
import { Inject } from '@nestjs/common';
import { QueryBus, QueryHandler } from '@nestjs/cqrs';

import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { Result } from '../../../common/result';
import { GetComplianceStatusQuery } from '../impl/get-compliance-status.query';
import {
  BondComplianceStatus,
  ComplianceStatusReadModel,
  ReportComplianceStatus,
} from '../read-models/compliance-status.read-model';
import { BaseQueryHandler } from './base-query.handler';

@QueryHandler(GetComplianceStatusQuery)
export class GetComplianceStatusHandler extends BaseQueryHandler<
  GetComplianceStatusQuery,
  ComplianceStatusReadModel
> {
  constructor(
    queryBus: QueryBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    private readonly repository: IGuardianshipRepository,
  ) {
    super(queryBus);
  }

  async execute(query: GetComplianceStatusQuery): Promise<Result<ComplianceStatusReadModel>> {
    try {
      this.validateQuery(query);

      const aggregate = await this.repository.findById(query.guardianshipId);
      if (!aggregate) {
        return Result.fail(new Error(`Guardianship ${query.guardianshipId} not found`));
      }

      // Trigger a fresh check (does not persist, just calculates state)
      aggregate.checkCompliance();
      const aggStatus = aggregate.getComplianceStatus();

      const model = new ComplianceStatusReadModel();
      model.guardianshipId = aggregate.id.toString();
      model.wardId = aggregate.wardId;
      model.isFullyCompliant = aggStatus.isFullyCompliant;
      model.warnings = aggStatus.warnings;
      model.lastCheckDate = aggStatus.lastCheck || new Date();

      // Calculate a simple score (100 - 10 per warning)
      model.complianceScore = Math.max(0, 100 - aggStatus.warnings.length * 10);

      // Map per-guardian details
      model.guardianCompliance = aggregate.getActiveGuardians().map((g) => {
        const bond = g.getBond();
        const reporting = g.getReportingSchedule();

        const bondStatus: BondComplianceStatus = {
          isRequired: g.requiresBond(),
          isPosted: g.isBondPosted(),
          isValid: g.isBondPosted() && !g.isBondExpired(),
          provider: bond?.provider,
          policyNumber: bond?.policyNumber,
          amountKES: bond?.amount?.getAmount(),
          expiryDate: bond?.expiryDate,
          daysUntilExpiry: bond
            ? Math.ceil((bond.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : undefined,
        };

        const reportStatus: ReportComplianceStatus = {
          isRequired: g.requiresAnnualReport(),
          frequency: 'ANNUAL',
          nextReportDue: reporting?.nextReportDue,
          isOverdue: g.isReportOverdue(),
          daysOverdue: reporting?.nextReportDue
            ? Math.ceil((Date.now() - reporting.nextReportDue.getTime()) / (1000 * 60 * 60 * 24))
            : 0,
          status: reporting?.status || ('NOT_REQUIRED' as any),
        };

        return {
          guardianId: g.guardianId.toString(),
          guardianName: 'Guardian Name', // Placeholder
          s72Bond: bondStatus,
          s73Report: reportStatus,
        };
      });

      this.logSuccess(query, model);
      return Result.ok(model);
    } catch (error) {
      this.handleError(error, query);
    }
  }
}
