import { BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { Witness } from '../../domain/entities/witness.entity';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { WitnessEligibilityPolicy } from '../../domain/policies/witness-eligibility.policy';
import { AddWitnessDto } from '../dto/request/add-witness.dto';

export class AddWitnessCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // Testator
    public readonly dto: AddWitnessDto,
  ) {}
}

@CommandHandler(AddWitnessCommand)
export class AddWitnessHandler implements ICommandHandler<AddWitnessCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly witnessPolicy: WitnessEligibilityPolicy,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AddWitnessCommand): Promise<string> {
    const { willId, userId, dto } = command;

    // 1. Load Aggregate
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    // 2. Security Check
    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    // 3. Check Will Status
    // Witnesses can only be added in DRAFT or PENDING_WITNESS states
    if (!aggregate.getWill().canAddWitnesses()) {
      throw new BadRequestException('Cannot add witnesses to a finalized or active will.');
    }

    // 4. Factory Creation (Internal or External)
    const witnessId = uuidv4();
    let witness: Witness;

    if (dto.userId) {
      witness = Witness.createForUser(
        witnessId,
        willId,
        dto.userId,
        dto.fullName!, // Validated by DTO
        dto.email,
        dto.phone,
        dto.idNumber,
      );
    } else {
      witness = Witness.createForExternal(
        witnessId,
        willId,
        dto.fullName!,
        dto.email!,
        dto.phone!,
        dto.idNumber,
      );
    }

    // 5. CRITICAL POLICY CHECK: Conflict of Interest (Section 13)
    // Ensure the witness is not also a beneficiary
    const conflictCheck = this.witnessPolicy.checkConflictOfInterest(
      witness,
      aggregate.getBeneficiaries(),
    );

    if (!conflictCheck.isValid) {
      throw new BadRequestException({
        message: 'Witness verification failed.',
        errors: conflictCheck.errors,
      });
    }

    // 6. Add to Aggregate
    const willModel = this.publisher.mergeObjectContext(aggregate);

    try {
      willModel.addWitness(witness);
    } catch (e) {
      throw new BadRequestException(e.message); // Catch duplicate witness errors
    }

    // 7. Save
    await this.willRepository.save(willModel);
    willModel.commit();

    return witnessId;
  }
}
