import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { DissolveGuardianshipCommand } from '../impl/dissolve-guardianship.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(DissolveGuardianshipCommand)
export class DissolveGuardianshipHandler
  extends BaseCommandHandler<DissolveGuardianshipCommand, GuardianshipAggregate>
  implements ICommandHandler<DissolveGuardianshipCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: DissolveGuardianshipCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.dissolveGuardianship({
        reason: command.reason,
        dissolvedDate: command.dissolvedDate,
        courtOrderNumber: command.courtOrderNumber,
      });
    });
  }
}
