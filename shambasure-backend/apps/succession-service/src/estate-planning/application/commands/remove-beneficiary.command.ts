import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class RemoveBeneficiaryCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly assignmentId: string,
  ) {}
}

@CommandHandler(RemoveBeneficiaryCommand)
export class RemoveBeneficiaryHandler implements ICommandHandler<RemoveBeneficiaryCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveBeneficiaryCommand): Promise<void> {
    const { willId, userId, assignmentId } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Aggregate logic handles removal from internal Map
    willModel.removeBeneficiary(assignmentId);

    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
