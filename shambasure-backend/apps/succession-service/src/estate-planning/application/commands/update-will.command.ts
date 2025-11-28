import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
import { UpdateWillDto } from '../dto/request/update-will.dto';

export class UpdateWillCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly dto: UpdateWillDto,
  ) {}
}

@CommandHandler(UpdateWillCommand)
export class UpdateWillHandler implements ICommandHandler<UpdateWillCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: UpdateWillCommand): Promise<void> {
    const { willId, userId, dto } = command;

    // 1. Load
    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) {
      throw new NotFoundException(`Will ${willId} not found.`);
    }

    // 2. Security
    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('You can only edit your own will.');
    }

    // 3. Merge Context
    const willModel = this.publisher.mergeObjectContext(aggregate);

    // 4. Update
    // The Aggregate/Entity logic ensures this fails if status is not Editable (e.g. Active)
    willModel.updateWillDetails(
      dto.title || aggregate.getWill().getTitle(),
      dto.funeralWishes,
      dto.burialLocation,
      dto.residuaryClause,
      dto.digitalAssetInstructions,
      dto.specialInstructions,
    );

    // 5. Save
    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
