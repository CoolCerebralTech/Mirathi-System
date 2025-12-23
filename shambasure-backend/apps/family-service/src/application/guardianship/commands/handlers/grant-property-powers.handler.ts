import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GrantPropertyPowersCommand } from '../impl/grant-property-powers.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(GrantPropertyPowersCommand)
export class GrantPropertyPowersHandler
  extends BaseCommandHandler<GrantPropertyPowersCommand, GuardianshipAggregate>
  implements ICommandHandler<GrantPropertyPowersCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: GrantPropertyPowersCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.grantPropertyPowers({
        guardianId: command.guardianId,
        courtOrderNumber: command.courtOrderNumber,
        restrictions: command.restrictions,
      });
    });
  }
}
