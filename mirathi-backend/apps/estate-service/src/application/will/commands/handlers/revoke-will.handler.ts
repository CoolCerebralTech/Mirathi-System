import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UniqueEntityID } from 'apps/estate-service/src/domain/base/unique-entity-id';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { RevokeWillCommand } from '../impl/revoke-will.command';

@CommandHandler(RevokeWillCommand)
export class RevokeWillHandler implements ICommandHandler<RevokeWillCommand> {
  private readonly logger = new Logger(RevokeWillHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: RevokeWillCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Attempting to revoke Will ${willId} for User ${userId} via ${data.method} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check: Ownership
      if (will.testatorId !== userId) {
        this.logger.warn(
          `Security Alert: User ${userId} attempted to revoke Will ${willId} belonging to ${will.testatorId}`,
        );
        return Result.fail(new AppErrors.SecurityError('You can only revoke your own will.'));
      }

      // 3. Domain Logic: Apply Revocation
      // The aggregate handles the invariant checks (e.g., checks if already revoked)
      will.revoke(data.method, data.reason);

      // 4. Persistence
      await this.willRepository.save(will);

      this.logger.log(`Will ${willId} successfully revoked via ${data.method}.`);

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to revoke Will ${willId}. Error: ${errorMessage}`, stack);

      // Return the domain error wrapped in Result
      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
