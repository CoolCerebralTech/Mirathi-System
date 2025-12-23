import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { UpdateWardInfoCommand } from '../impl/update-ward-info.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(UpdateWardInfoCommand)
export class UpdateWardInfoHandler
  extends BaseCommandHandler<UpdateWardInfoCommand, GuardianshipAggregate>
  implements ICommandHandler<UpdateWardInfoCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateWardInfoCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.updateWardInfo(command.wardInfo);
    });
  }
}
