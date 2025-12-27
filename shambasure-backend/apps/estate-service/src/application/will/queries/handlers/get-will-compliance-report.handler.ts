import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { GetWillComplianceReportQuery } from '../impl/get-will-compliance-report.query';
import { ComplianceReportVm } from '../view-models/compliance-report.vm';

@QueryHandler(GetWillComplianceReportQuery)
export class GetWillComplianceReportHandler implements IQueryHandler<GetWillComplianceReportQuery> {
  private readonly logger = new Logger(GetWillComplianceReportHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: GetWillComplianceReportQuery): Promise<Result<ComplianceReportVm>> {
    const { willId, userId, scope, correlationId } = query;

    this.logger.debug(
      `Generating Compliance Report for Will ${willId} [Scope: ${scope}] [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Fetch Deep Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      // Only the testator can run a compliance check on their draft.
      if (will.testatorId !== userId) {
        return Result.fail(
          new AppErrors.SecurityError('You do not have permission to audit this will.'),
        );
      }

      // 3. Generate Report
      // The heavy lifting is done in the View Model factory which parses the Domain Entity
      const report = ComplianceReportVm.fromDomain(will);

      // 4. Handle Extended Scope (Placeholder)
      if (scope === 'FULL') {
        // TODO: In Phase 4 (Integration), we would inject the FamilyService here
        // to check if specific "Child" relationships defined in Family Service
        // are missing from the Will's bequests (S.26 Dependant Check).
        // For now, we return the INTERNAL analysis which is already very robust.
        this.logger.debug(
          'FULL scope requested - External Family Service check deferred to Integration Phase',
        );
      }

      return Result.ok(report);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to generate compliance report for Will ${willId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
