import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { PostGuardianBondCommand } from '../impl/post-guardian-bond.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(PostGuardianBondCommand)
export class PostGuardianBondHandler
  extends BaseCommandHandler<PostGuardianBondCommand, GuardianshipAggregate>
  implements ICommandHandler<PostGuardianBondCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: PostGuardianBondCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.postGuardianBond({
        guardianId: command.guardianId,
        provider: command.provider,
        policyNumber: command.policyNumber,
        amountKES: command.amountKES,
        expiryDate: command.expiryDate,
      });
    });
  }
}
