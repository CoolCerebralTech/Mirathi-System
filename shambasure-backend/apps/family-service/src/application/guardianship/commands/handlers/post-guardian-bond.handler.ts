// application/guardianship/commands/handlers/post-guardian-bond.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { PostGuardianBondCommand } from '../impl/post-guardian-bond.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(PostGuardianBondCommand)
export class PostGuardianBondHandler
  extends baseCommandHandler.BaseCommandHandler<
    PostGuardianBondCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<PostGuardianBondCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: PostGuardianBondCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.postGuardianBond({
        guardianId: command.guardianId,
        provider: command.provider,
        policyNumber: command.policyNumber,
        amountKES: command.amountKES,
        expiryDate: command.expiryDate,
      });
    });
  }
}
