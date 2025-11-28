import { BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';

import { Executor } from '../../domain/entities/executor.entity';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { ExecutorEligibilityPolicy } from '../../domain/policies/executor-eligibility.policy';
import { NominateExecutorDto } from '../dto/request/nominate-executor.dto';

export class NominateExecutorCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string, // Testator
    public readonly dto: NominateExecutorDto,
  ) {}
}

@CommandHandler(NominateExecutorCommand)
export class NominateExecutorHandler implements ICommandHandler<NominateExecutorCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly eligibilityPolicy: ExecutorEligibilityPolicy,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: NominateExecutorCommand): Promise<string> {
    const { willId, userId, dto } = command;

    // 1. Load Aggregate
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    // 2. Security Check
    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    // 3. Check Will Status
    if (!aggregate.getWill().isEditable()) {
      throw new BadRequestException('Cannot nominate executors for a finalized will.');
    }

    // 4. Run Policy Check on Candidate (Age, etc.)
    // Note: We assume user input implies capacity unless flagged in system
    const policyCheck = this.eligibilityPolicy.checkCandidateEligibility({
      residency: 'KENYAN', // Default assumption, logic can be expanded
      // If we had the user's DOB from the User Service, we would pass age here
    });

    if (!policyCheck.isEligible) {
      throw new BadRequestException(`Executor ineligible: ${policyCheck.errors.join(', ')}`);
    }

    // 5. Factory Creation
    const executorId = uuidv4();
    let executor: Executor;

    if (dto.userId) {
      executor = Executor.createForUser(
        executorId,
        willId,
        dto.userId,
        dto.relationship,
        dto.isPrimary,
        dto.priorityOrder,
      );
    } else {
      executor = Executor.createForExternal(
        executorId,
        willId,
        dto.fullName!, // Validated by DTO
        dto.email!, // Validated by DTO logic (email OR phone)
        dto.phone!,
        dto.relationship,
        undefined, // Address optional at nomination stage
        dto.isPrimary,
        dto.priorityOrder,
      );
    }

    // 6. Add to Aggregate
    // This triggers the "Max 4 Executors" and "Single Primary" checks inside the Aggregate
    const willModel = this.publisher.mergeObjectContext(aggregate);

    try {
      willModel.nominateExecutor(executor);
    } catch (e) {
      throw new BadRequestException(e.message); // Catch domain constraints
    }

    // 7. Save
    await this.willRepository.save(willModel);
    willModel.commit();

    return executorId;
  }
}
