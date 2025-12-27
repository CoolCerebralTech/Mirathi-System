import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { GetWillByIdQuery } from '../impl/get-will-by-id.query';
import { WillDetailVm } from '../view-models/will-detail.vm';

@QueryHandler(GetWillByIdQuery)
export class GetWillByIdHandler implements IQueryHandler<GetWillByIdQuery> {
  private readonly logger = new Logger(GetWillByIdHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(query: GetWillByIdQuery): Promise<Result<WillDetailVm>> {
    const { willId, userId, correlationId } = query;

    this.logger.debug(
      `Fetching Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Fetch from Repository
      // The repository performs "Deep Hydration" (loads children like bequests/executors)
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security / Access Control Check
      // For Phase 1, strictly enforce that the user is the Testator.
      // In later phases (Probate), Executors or Court Officers might need access.
      const isTestator = will.testatorId === userId;

      // Optional: Check if user is an assigned executor (if your business logic allows executors to see the will before death)
      // Usually, executors only see the will AFTER death/execution.
      // const isExecutor = will.executors.some(e => e.executorIdentity.userId === userId);

      if (!isTestator) {
        this.logger.warn(
          `Unauthorized access attempt: User ${userId} tried to view Will ${willId} owned by ${will.testatorId}`,
        );
        return Result.fail(
          new AppErrors.SecurityError('You do not have permission to view this will.'),
        );
      }

      // 3. Map to View Model
      const vm = WillDetailVm.fromDomain(will);

      // 4. Handle "includeDetails" optimization (Optional)
      // If the client requested a lightweight version, we could strip children arrays here.
      // For now, we return the full object as defined by the VM.
      if (query.includeDetails === false) {
        vm.bequests = [];
        vm.witnesses = [];
        vm.executors = [];
        vm.codicils = [];
        vm.disinheritanceRecords = [];
      }

      return Result.ok(vm);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to fetch Will ${willId}. Error: ${errorMessage}`, stack);

      return Result.fail(new AppErrors.UnexpectedError(error));
    }
  }
}
