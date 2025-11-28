import { BadRequestException, ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class RemoveWitnessCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly witnessId: string,
  ) {}
}

@CommandHandler(RemoveWitnessCommand)
export class RemoveWitnessHandler implements ICommandHandler<RemoveWitnessCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveWitnessCommand): Promise<void> {
    const { willId, userId, witnessId } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Aggregate logic handles the check (e.g., cannot remove if already signed)
    try {
      willModel.removeWitness(witnessId);
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
