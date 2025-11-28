import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SignWillDto } from '../dto/request/sign-will.dto';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';

export class SignWillCommand {
  constructor(
    public readonly userId: string, // The logged-in user doing the signing
    public readonly dto: SignWillDto,
  ) {}
}

@CommandHandler(SignWillCommand)
export class SignWillHandler implements ICommandHandler<SignWillCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: SignWillCommand): Promise<void> {
    const { userId, dto } = command;

    // 1. Load Will Aggregate
    const aggregate = await this.willRepository.findById(dto.willId);
    if (!aggregate) throw new NotFoundException(`Will ${dto.willId} not found.`);

    // 2. Identify Signer in the Aggregate
    const witnesses = aggregate.getWitnesses();
    const targetWitness = witnesses.find(
      (w) => w.getWitnessInfo().userId === userId || w.getId() === dto.signerId, // For external flows where signerId is the WitnessEntityID
    );

    if (!targetWitness) {
      throw new ForbiddenException('User is not listed as a witness for this will.');
    }

    // 3. Perform Signing
    // We operate on the Witness Entity within the Aggregate context?
    // Actually, the Aggregate holds references. We can modify the witness entity.
    // However, for persistence, we need to ensure the Witness is saved.
    // Since WillRepository saves the whole aggregate structure (via Mappers), saving the Aggregate saves the witness update.

    const willModel = this.publisher.mergeObjectContext(aggregate);

    // Find the mutable witness object in the merged model (Aggregate logic)
    // We can call a method on the Aggregate to handle this orchestration safely
    // But since we didn't expose "SignWitness" on WillAggregate, we modify the entity directly if accessible
    // Best practice: Add method to Aggregate or update Entity and rely on Repo to persist children.

    if (targetWitness.hasSigned()) {
      throw new BadRequestException('Witness has already signed.');
    }

    targetWitness.sign(dto.signatureData);

    // 4. Check if this completes the witnessing requirements
    // If all witnesses signed, we might auto-transition Will to 'WITNESSED' status
    const signedCount = witnesses.filter((w) => w.hasSigned()).length;
    // Note: targetWitness just signed, so count is updated in memory

    if (
      signedCount >= aggregate.getWill().getRequiresWitnesses() &&
      aggregate.getWill().isDraft()
    ) {
      // Optional: Auto-transition to Witnessed state?
      // Usually better to let Testator do this manually to review,
      // OR call willModel.getWill().markAsWitnessed() if logic dictates.
    }

    // 5. Save
    await this.willRepository.save(willModel);
    willModel.commit();
  }
}
