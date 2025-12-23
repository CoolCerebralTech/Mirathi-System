import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { RemoveGuardianCommand } from '../impl/remove-guardian.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(RemoveGuardianCommand)
export class RemoveGuardianHandler
  extends BaseCommandHandler<RemoveGuardianCommand, GuardianshipAggregate>
  implements ICommandHandler<RemoveGuardianCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RemoveGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.removeGuardian({
        guardianId: command.guardianId,
        reason: command.reason,
        terminationDate: command.terminationDate,
      });
    });
  }
}
