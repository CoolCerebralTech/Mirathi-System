import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { TestatorCapacityDeclaration } from '../../../../domain/value-objects/testator-capacity-declaration.vo';
import { UpdateCapacityDeclarationCommand } from '../impl/update-capacity-declaration.command';

@CommandHandler(UpdateCapacityDeclarationCommand)
export class UpdateCapacityDeclarationHandler implements ICommandHandler<UpdateCapacityDeclarationCommand> {
  private readonly logger = new Logger(UpdateCapacityDeclarationHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: UpdateCapacityDeclarationCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Updating capacity declaration for Will ${willId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      if (will.testatorId !== userId) {
        return Result.fail(
          new AppErrors.SecurityError('You can only update capacity for your own will.'),
        );
      }

      // 3. Create Value Object
      // The Value Object factory validates consistency (e.g., Medical Cert requires Doctor Name)
      const capacityVO = TestatorCapacityDeclaration.create({
        status: data.status,
        declarationDate: data.date,
        assessedBy: data.assessedBy,
        assessmentNotes: data.notes,
        supportingDocumentIds: data.documentIds,
        isVoluntarilyMade: data.declarations.isVoluntarilyMade,
        isFreeFromUndueInfluence: data.declarations.isFreeFromUndueInfluence,
      });

      // 4. Invoke Aggregate Behavior
      // Validates that Will is in DRAFT status
      will.updateCapacityDeclaration(capacityVO);

      // 5. Persistence
      await this.willRepository.save(will);

      this.logger.log(
        `Capacity declaration updated. Status: ${data.status}, Risk Level: ${capacityVO.getRiskLevel()}`,
      );

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to update capacity declaration for Will ${willId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
