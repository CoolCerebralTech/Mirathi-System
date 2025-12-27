import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { Result } from '../../../../application/common/result';
import { Will } from '../../../../domain/aggregates/will.aggregate';
import { WillType } from '../../../../domain/enums/will-type.enum';
import {
  DuplicateActiveWillError,
  WILL_REPOSITORY,
} from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { TestatorCapacityDeclaration } from '../../../../domain/value-objects/testator-capacity-declaration.vo';
import { CreateDraftWillCommand } from '../impl/create-draft-will.command';

@CommandHandler(CreateDraftWillCommand)
export class CreateDraftWillHandler implements ICommandHandler<CreateDraftWillCommand> {
  private readonly logger = new Logger(CreateDraftWillHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: CreateDraftWillCommand): Promise<Result<string>> {
    const { userId, correlationId } = command;
    const { type, initialCapacityDeclaration } = command.data;

    this.logger.log(
      `Attempting to create draft will for Testator: ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Validation: Check for existing Active Will
      const hasActive = await this.willRepository.hasActiveWill(userId);
      if (hasActive) {
        this.logger.warn(`Creation blocked: Testator ${userId} already has an Active Will`);
        return Result.fail(new DuplicateActiveWillError(userId));
      }

      // 2. Prepare Domain Objects
      let capacityVO: TestatorCapacityDeclaration | undefined;

      if (initialCapacityDeclaration) {
        // Map raw DTO data to Value Object
        capacityVO = TestatorCapacityDeclaration.create({
          status: initialCapacityDeclaration.status,
          declarationDate: initialCapacityDeclaration.date,
          assessedBy: initialCapacityDeclaration.assessedBy,
          assessmentNotes: initialCapacityDeclaration.notes,
          supportingDocumentIds: initialCapacityDeclaration.documentIds,
          isVoluntarilyMade: true,
          isFreeFromUndueInfluence: true,
        });
      }

      // 3. Factory: Create the Aggregate Root
      const will = Will.createDraft(userId, type ?? WillType.STANDARD, capacityVO);

      // 4. Persistence
      await this.willRepository.save(will);

      this.logger.log(`Draft Will created successfully. ID: ${will.id.toString()}`);

      return Result.ok(will.id.toString());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to create draft will for ${userId}. Error: ${errorMessage}`, stack);

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
