import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { RecordWardDeathCommand } from '../impl/record-ward-death.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(RecordWardDeathCommand)
export class RecordWardDeathHandler
  extends BaseCommandHandler<RecordWardDeathCommand, GuardianshipAggregate>
  implements ICommandHandler<RecordWardDeathCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RecordWardDeathCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.handleWardDeath(command.deathDate);
    });
  }
}
