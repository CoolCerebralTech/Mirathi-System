import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import type { WillRepositoryInterface } from '../../domain/interfaces/will.repository.interface';
// import { NotificationService } from '@shamba/notifications'; // Future integration

export class InviteWitnessCommand {
  constructor(
    public readonly willId: string,
    public readonly userId: string,
    public readonly witnessId: string,
  ) {}
}

@CommandHandler(InviteWitnessCommand)
export class InviteWitnessHandler implements ICommandHandler<InviteWitnessCommand> {
  constructor(
    @Inject('WillRepositoryInterface')
    private readonly willRepository: WillRepositoryInterface,
    // private readonly notifications: NotificationService
  ) {}

  async execute(command: InviteWitnessCommand): Promise<void> {
    const { willId, witnessId } = command;

    const aggregate = await this.willRepository.findById(willId);
    if (!aggregate) throw new NotFoundException('Will not found');

    const witness = aggregate.getWitnesses().find((w) => w.getId() === witnessId);
    if (!witness) throw new NotFoundException('Witness not found');

    // Logic to trigger notification event
    // Ideally, we emit a 'WitnessInvitedEvent' here, and the Notification Service listens to it.
    // For now, this placeholder acknowledges the architectural need.
  }
}
