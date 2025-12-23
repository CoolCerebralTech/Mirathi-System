import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { UpdateGuardianRestrictionsCommand } from '../impl/update-guardian-restrictions.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(UpdateGuardianRestrictionsCommand)
export class UpdateGuardianRestrictionsHandler
  extends BaseCommandHandler<UpdateGuardianRestrictionsCommand, GuardianshipAggregate>
  implements ICommandHandler<UpdateGuardianRestrictionsCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateGuardianRestrictionsCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.updateGuardianRestrictions({
        guardianId: command.guardianId,
        restrictions: command.restrictions,
      });
    });
  }
}
