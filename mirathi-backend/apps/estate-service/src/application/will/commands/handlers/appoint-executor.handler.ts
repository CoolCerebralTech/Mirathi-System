import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WillExecutor } from '../../../../domain/entities/executor-nomination.entity';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { ExecutorPriority } from '../../../../domain/value-objects/executor-priority.vo';
import { AppointExecutorCommand } from '../impl/appoint-executor.command';

@CommandHandler(AppointExecutorCommand)
export class AppointExecutorHandler implements ICommandHandler<AppointExecutorCommand> {
  private readonly logger = new Logger(AppointExecutorHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: AppointExecutorCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Appointing executor to Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate (Using your fix)
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      if (will.testatorId !== userId) {
        return Result.fail(new AppErrors.SecurityError('You can only modify your own will.'));
      }

      // 3. Create Executor Priority Value Object
      let priorityVO: ExecutorPriority;

      switch (data.priority) {
        case 'PRIMARY':
          priorityVO = ExecutorPriority.primary();
          break;
        case 'SUBSTITUTE':
          priorityVO = ExecutorPriority.substitute(false); // Chain logic handled in complex flows
          break;
        case 'CO_EXECUTOR':
          priorityVO = ExecutorPriority.coExecutor(data.order || 1);
          break;
        default:
          priorityVO = ExecutorPriority.primary();
      }

      // 4. Create WillExecutor Entity
      const executor = WillExecutor.create({
        willId: will.id.toString(),
        executorIdentity: data.executorIdentity,
        priority: priorityVO,
        appointmentType: 'TESTAMENTARY',
        appointmentDate: new Date(),

        // Qualification: Default to true for draft;
        // real check happens via external service or probate readiness check.
        isQualified: true,
        qualificationReasons: [],

        // Default flags (assume standard adult unless specified in richer DTO)
        isMinor: false,
        isMentallyIncapacitated: false,
        hasCriminalRecord: false,
        isBankrupt: false,

        // Optional props
        powers: data.powers,
        compensation: data.compensation,
      });

      // 5. Invoke Aggregate Behavior (Validates unique primary, status check)
      will.addExecutor(executor);

      // 6. Persistence
      await this.willRepository.save(will);

      this.logger.log(
        `Executor ${executor.getDisplayName()} appointed successfully to Will ${willId}`,
      );

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to appoint executor for Will ${willId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
