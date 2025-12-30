import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppErrors } from '../../../common/application.error';
import { Result } from '../../../common/result';
import { UniqueEntityID } from '../../../../domain/base/unique-entity-id';
import { WillWitness } from '../../../../domain/entities/will-witness.entity';
import { WILL_REPOSITORY } from '../../../../domain/interfaces/will.repository.interface';
import type { IWillRepository } from '../../../../domain/interfaces/will.repository.interface';
import { ExecutionDate } from '../../../../domain/value-objects/execution-date.vo';
import { WitnessEligibility } from '../../../../domain/value-objects/witness-eligibility.vo';
import { ExecuteWillCommand } from '../impl/execute-will.command';

@CommandHandler(ExecuteWillCommand)
export class ExecuteWillHandler implements ICommandHandler<ExecuteWillCommand> {
  private readonly logger = new Logger(ExecuteWillHandler.name);

  constructor(@Inject(WILL_REPOSITORY) private readonly willRepository: IWillRepository) {}

  async execute(command: ExecuteWillCommand): Promise<Result<void>> {
    const { willId, userId, data, correlationId } = command;

    this.logger.log(
      `Attempting to execute Will ${willId} for User ${userId} [CorrelationID: ${correlationId}]`,
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
          `Security Alert: User ${userId} attempted to execute Will ${willId} belonging to ${will.testatorId}`,
        );
        return Result.fail(new AppErrors.SecurityError('You can only execute your own will.'));
      }

      // 3. Prepare Domain Objects: ExecutionDate
      const executionDateVO = ExecutionDate.create(
        data.executionDate,
        data.witnesses.length, // Witnesses present count
        data.location,
        data.timezone,
      );

      // 4. Prepare Domain Objects: WillWitness Entities
      const witnessEntities = data.witnesses.map((wDto) => {
        // Create Eligibility VO
        const eligibility = WitnessEligibility.create({
          age: 18, // Assumed adult based on declarations, or we need DOB in DTO
          isCompetent: wDto.declarations.isOfSoundMind,
          relationshipToTestator: 'NONE', // Default, should be enriched if known
          isBeneficiary: !wDto.declarations.isNotBeneficiary,
          isSpouseOfBeneficiary: !wDto.declarations.isNotSpouseOfBeneficiary,
          hasCriminalRecord: false, // Default
        });

        // Create Witness Entity
        return WillWitness.create({
          willId: will.id.toString(),
          witnessIdentity: {
            type: 'EXTERNAL_INDIVIDUAL', // Default for manual entry
            externalDetails: {
              fullName: wDto.fullName,
              nationalId: wDto.nationalId,
              dateOfBirth: undefined, // Optional in Entity
            },
          },
          status: 'SIGNED', // "Execute" implies they signed during the ceremony
          eligibility: eligibility,
          signatureType: 'WET_SIGNATURE', // Default for physical execution
          signedAt: data.executionDate, // Signed at moment of execution
          executionDate: executionDateVO,
          presenceType: 'PHYSICAL',
          contactInfo: {
            email: wDto.email,
            phone: wDto.phone,
            address: wDto.physicalAddress,
          },
          declarations: {
            isNotBeneficiary: wDto.declarations.isNotBeneficiary,
            isNotSpouseOfBeneficiary: wDto.declarations.isNotSpouseOfBeneficiary,
            isOfSoundMind: wDto.declarations.isOfSoundMind,
            understandsDocument: wDto.declarations.understandsDocument,
            isActingVoluntarily: wDto.declarations.isActingVoluntarily,
            dateAcknowledged: data.executionDate,
          },
          evidenceIds: [],
        });
      });

      // 5. Invoke Aggregate Behavior
      // This runs S.11 validations (min 2 witnesses, no beneficiary conflict)
      will.execute(executionDateVO, witnessEntities);

      // 6. Persistence
      await this.willRepository.save(will);

      this.logger.log(`Will ${willId} successfully executed. Status: ${will.status}`);

      return Result.ok();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to execute Will ${willId}. Error: ${errorMessage}`, stack);

      // Return the domain error wrapped in Result
      return Result.fail(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}
