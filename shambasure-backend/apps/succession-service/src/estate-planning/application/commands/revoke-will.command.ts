import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { RevokeWillDto } from '../dto/request/revoke-will.dto';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class RevokeWillCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly dto: RevokeWillDto,
  ) {}
}

@CommandHandler(RevokeWillCommand)
export class RevokeWillHandler implements ICommandHandler<RevokeWillCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RevokeWillCommand): Promise<void> {
    const { willId, userId, dto } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Execute Revocation logic on Entity
    willModel.getWill().revoke(userId, dto.reason, dto.method);

    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
