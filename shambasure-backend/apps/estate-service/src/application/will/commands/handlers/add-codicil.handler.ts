import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { Codicil } from '../../../../domain/entities/codicil.entity';
import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { ExecutionDate } from '../../../../domain/value-objects/execution-date.vo';
import { AddCodicilCommand } from '../impl/add-codicil.command';

@CommandHandler(AddCodicilCommand)
export class AddCodicilHandler implements ICommandHandler<AddCodicilCommand> {
  private readonly logger = new Logger(AddCodicilHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: AddCodicilCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Adding Codicil to Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      if (will.testatorId !== userId) {
        return Result.fail(new AppErrors.SecurityError('You can only amend your own will.'));
      }

      // 3. Pre-condition Check: Status
      // Codicils are amendments to EXECUTED wills. Drafts are edited directly.
      if (will.status === WillStatus.DRAFT) {
        return Result.fail(
          new AppErrors.ConflictError(
            'Cannot add codicil to a Draft Will. Edit the draft instead.',
          ),
        );
      }

      // 4. Create Value Objects
      const executionDateVO = ExecutionDate.create(
        data.executionDetails.date,
        data.executionDetails.witnessesPresent,
        data.executionDetails.location,
        data.executionDetails.timezone,
      );

      // 5. Determine Codicil Version
      const nextVersion = will.codicils.length + 1;

      // 6. Create Codicil Entity
      // Note: The Entity validation enforces 2 witnesses immediately.
      const codicil = Codicil.create({
        willId: will.id.toString(),
        title: data.title,
        content: data.content,
        codicilDate: data.date,
        versionNumber: nextVersion,

        executionDate: executionDateVO,
        witnesses: data.witnessIds,

        amendmentType: data.amendmentType,
        affectedClauses: data.affectedClauses || [],
        legalBasis: data.legalBasis,
        isDependent: true, // Defaulting to true as it depends on the Will
      });

      // 7. Invoke Aggregate Behavior
      will.addCodicil(codicil);

      // 8. Persistence
      await this.willRepository.save(will);

      this.logger.log(`Codicil "${data.title}" added successfully to Will ${willId}`);

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to add codicil to Will ${willId}. Error: ${errorMessage}`, stack);

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
