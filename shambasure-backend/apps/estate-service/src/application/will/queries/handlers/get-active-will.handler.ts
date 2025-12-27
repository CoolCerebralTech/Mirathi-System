import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { GetActiveWillQuery } from '../impl/get-active-will.query';
import { WillDetailVm } from '../view-models/will-detail.vm';

@QueryHandler(GetActiveWillQuery)
export class GetActiveWillHandler implements IQueryHandler<GetActiveWillQuery> {
  private readonly logger = new Logger(GetActiveWillHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: GetActiveWillQuery): Promise<Result<WillDetailVm | null>> {
    const { testatorId, userId, correlationId } = query;

    this.logger.debug(
      `Fetching Active Will for Testator ${testatorId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Security Check
      // Only the testator (or potentially a court officer/admin) can query this.
      if (testatorId !== userId) {
        return Result.fail(
          new AppErrors.SecurityError('You do not have permission to view this will.'),
        );
      }

      // 2. Fetch from Repository
      const will = await this.willRepository.findActiveByTestatorId(testatorId);

      // 3. Handle Empty Case
      if (!will) {
        // It is not an error to not have an active will; just return null result
        return Result.ok(null);
      }

      // 4. Map to View Model
      const vm = WillDetailVm.fromDomain(will);

      return Result.ok(vm);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to fetch active will for ${testatorId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
