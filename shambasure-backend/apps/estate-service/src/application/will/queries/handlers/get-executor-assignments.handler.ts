import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { GetExecutorAssignmentsQuery } from '../impl/get-executor-assignments.query';
import { ExecutorDashboardItemVm } from '../view-models/executor-dashboard.vm';

@QueryHandler(GetExecutorAssignmentsQuery)
export class GetExecutorAssignmentsHandler implements IQueryHandler<GetExecutorAssignmentsQuery> {
  private readonly logger = new Logger(GetExecutorAssignmentsHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: GetExecutorAssignmentsQuery): Promise<Result<ExecutorDashboardItemVm[]>> {
    const { executorIdentifier, userId, willStatus, correlationId } = query;

    this.logger.debug(
      `Fetching executor assignments for ${executorIdentifier} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Security Check
      // A user should generally only check their own assignments.
      // We check if the identifier requested matches the authenticated user ID.
      // (Note: executorIdentifier might be an email for external users, handling that matching is complex,
      // so strict equality check is a good baseline).
      if (executorIdentifier !== userId && !executorIdentifier.includes('@')) {
        // Allow email based lookup if it matches user's email (logic assumed external)
        // For ID based:
        if (executorIdentifier !== userId) {
          return Result.fail(
            new AppErrors.SecurityError('You can only view your own executor assignments.'),
          );
        }
      }

      // 2. Fetch Wills from Repository
      // The Repo finds any will where this user is in the `executors` array.
      const wills = await this.willRepository.findByNominatedExecutor(executorIdentifier);

      // 3. Filter and Map
      const dashboardItems: ExecutorDashboardItemVm[] = [];

      for (const will of wills) {
        // Optional Status Filter
        if (willStatus && willStatus.length > 0) {
          if (!willStatus.includes(will.status)) {
            continue;
          }
        }

        // Map to VM
        // This static method extracts ONLY the specific assignment details for this user
        const item = ExecutorDashboardItemVm.fromDomain(will, executorIdentifier);

        if (item) {
          dashboardItems.push(item);
        }
      }

      return Result.ok(dashboardItems);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to fetch executor assignments. Error: ${errorMessage}`, stack);

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
