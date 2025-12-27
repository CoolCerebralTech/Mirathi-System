import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../../application/common/application.error';
import { Result } from '../../../../application/common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WillWitness } from '../../../../domain/entities/will-witness.entity';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { WitnessEligibility } from '../../../../domain/value-objects/witness-eligibility.vo';
import { AddWitnessCommand } from '../impl/add-witness.command';

@CommandHandler(AddWitnessCommand)
export class AddWitnessHandler implements ICommandHandler<AddWitnessCommand> {
  private readonly logger = new Logger(AddWitnessHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: AddWitnessCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Adding witness to Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
    );

    try {
      // 1. Load Aggregate
      const will = await this.willRepository.findById(new UniqueEntityID(willId));

      if (!will) {
        return Result.fail(new AppErrors.NotFoundError('Will', willId));
      }

      // 2. Security Check
      if (will.testatorId !== userId) {
        return Result.fail(new AppErrors.SecurityError('You can only modify your own will.'));
      }

      // 3. Create Eligibility VO
      const eligibilityVO = WitnessEligibility.create({
        age: data.eligibilityConfirmation.isOver18 ? 18 : 0,
        isCompetent: data.eligibilityConfirmation.isMentallyCompetent,
        isBeneficiary: !data.eligibilityConfirmation.isNotBeneficiary,
        relationshipToTestator:
          data.witnessIdentity.externalDetails?.relationshipToTestator || 'NONE',
        isSpouseOfBeneficiary: false,
        hasCriminalRecord: false,
      });

      // 4. Create WillWitness Entity
      const witness = WillWitness.create({
        willId: will.id.toString(),
        witnessIdentity: data.witnessIdentity,
        status: 'PENDING',
        eligibility: eligibilityVO,

        // 🛠️ FIX: 'presenceType' is required.
        // We set 'PHYSICAL' as the default intended mode for S.11 compliance.
        presenceType: 'PHYSICAL',

        // Identity Verification
        evidenceIds: [],

        // Contact Info
        contactInfo: data.contactInfo,

        // Placeholder declarations
        declarations: {
          isNotBeneficiary: data.eligibilityConfirmation.isNotBeneficiary,
          isNotSpouseOfBeneficiary: true,
          isOfSoundMind: data.eligibilityConfirmation.isMentallyCompetent,
          understandsDocument: true,
          isActingVoluntarily: true,
        },
      });

      // 5. Invoke Aggregate Behavior
      will.addWitness(witness);

      // 6. Persistence
      await this.willRepository.save(will);

      this.logger.log(`Witness ${witness.getDisplayName()} added successfully to Will ${willId}`);

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to add witness to Will ${willId}. Error: ${errorMessage}`, stack);

      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
