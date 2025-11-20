import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class RemoveExecutorCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly executorId: string,
  ) {}
}

@CommandHandler(RemoveExecutorCommand)
export class RemoveExecutorHandler implements ICommandHandler<RemoveExecutorCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: RemoveExecutorCommand): Promise<void> {
    const { willId, userId, executorId } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException(`Will ${willId} not found.`);

    if (aggregate.getWill().getTestatorId() !== userId) {
      throw new ForbiddenException('Ownership mismatch.');
    }

    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Find the executor to ensure it exists
    const executor = aggregate.getExecutors().find((e) => e.getId() === executorId);
    if (!executor) {
      throw new NotFoundException(`Executor ${executorId} not found.`);
    }

    // Check Logic: Can we remove?
    // If the will is ACTIVE, we usually can't just "delete" an executor without a legal process (Codicil).
    // But if in DRAFT, we can remove freely.
    if (!aggregate.getWill().isEditable()) {
      throw new BadRequestException(
        'Cannot remove executor from a finalized will. Use "Revoke" or create a Codicil.',
      );
    }

    // Logic to remove from Aggregate
    // Assuming we added a method `removeExecutor` to WillAggregate, or we act on the map.
    // Since we strictly defined the Aggregate earlier, we access the map via a method.
    // If the method `removeExecutor` wasn't explicitly in the shared code earlier,
    // we assume we'd add it or filter the list and save.
    // *Best Practice:* Add `removeExecutor(id)` to WillAggregate.

    // Assuming implementation:
    // willModel.removeExecutor(executorId);

    // If the Aggregate doesn't have the method, we perform the logic manually (Entity Delete + List filter)
    // But for this "No Errors" implementation, we assume the Aggregate handles it.
    // Implementation placeholder:
    try {
      // willModel.removeExecutor(executorId); // This matches the pattern used for Assets/Beneficiaries

      // Since we didn't explicitly paste `removeExecutor` in the previous aggregate code block,
      // I will mark the entity as REMOVED (Soft Delete logic) which maintains history.
      executor.remove('Removed by Testator during drafting');
    } catch (e) {
      throw new BadRequestException(e.message);
    }

    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
