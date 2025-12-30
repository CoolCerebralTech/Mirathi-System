import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { RecordWitnessSignatureCommand } from '../impl/record-witness-signature.command';

@CommandHandler(RecordWitnessSignatureCommand)
export class RecordWitnessSignatureHandler implements ICommandHandler<RecordWitnessSignatureCommand> {
  private readonly logger = new Logger(RecordWitnessSignatureHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: RecordWitnessSignatureCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Recording signature for Witness ${data.witnessId} on Will ${willId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check (Only Testator or the specific Witness via specific auth logic could trigger this)
      // For this phase, we assume the Testator is managing the flow or the Witness is authenticated user.
      // Strict check: Testator owns the will.
      if (will.testatorId !== userId) {
        // Note: In a real digital signing flow, the UserID might be the Witness's ID.
        // For now, we enforce that the command comes from the Testator's context
        // or we need to check if userId matches the witness's userId.
        const isWitnessUser = will.witnesses.some(
          (w) => w.witnessIdentity.userId === userId && w.id.toString() === data.witnessId,
        );

        if (!isWitnessUser && will.testatorId !== userId) {
          return Result.fail(new AppErrors.SecurityError('Permission denied to sign this will.'));
        }
      }

      // 3. Find the specific Witness Entity
      const witness = will.witnesses.find((w) => w.id.toString() === data.witnessId);

      if (!witness) {
        return Result.fail(new AppErrors.NotFoundError('WillWitness', data.witnessId));
      }

      // 4. Update Entity State
      // The entity handles validation (e.g. throws if already signed)
      witness.recordSignature(data.signatureType, data.location, data.notes);

      // 5. Persistence
      // Saving the Aggregate saves all changes to its child entities
      await this.willRepository.save(will);

      this.logger.log(`Signature recorded for Witness ${data.witnessId} successfully.`);

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to record signature for Witness ${data.witnessId}. Error: ${errorMessage}`,
        stack,
      );

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
