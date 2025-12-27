import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { GetTestatorHistoryQuery } from '../impl/get-testator-history.query';
import { WillSummaryVm } from '../view-models/will-summary.vm';

@QueryHandler(GetTestatorHistoryQuery)
export class GetTestatorHistoryHandler implements IQueryHandler<GetTestatorHistoryQuery> {
  private readonly logger = new Logger(GetTestatorHistoryHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: GetTestatorHistoryQuery): Promise<Result<WillSummaryVm[]>> {
    const { testatorId, userId, correlationId } = query;

    this.logger.debug(
      `Fetching Will History for Testator ${testatorId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Security Check
      if (testatorId !== userId) {
        return Result.fail(new AppErrors.SecurityError('You can only view your own will history.'));
      }

      // 2. Fetch from Repository
      // This retrieves all versions: DRAFT, ACTIVE, REVOKED
      const history = await this.willRepository.getTestatorHistory(testatorId);

      // 3. Map to Summary View Models
      // We use the lighter Summary VM to avoid sending massive payloads for simple lists
      const vms = history.map((will) => WillSummaryVm.fromDomain(will));

      return Result.ok(vms);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to fetch history for ${testatorId}. Error: ${errorMessage}`, stack);

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
