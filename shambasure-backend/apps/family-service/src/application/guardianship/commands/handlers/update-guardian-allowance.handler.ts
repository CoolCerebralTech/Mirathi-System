import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { UpdateGuardianAllowanceCommand } from '../impl/update-guardian-allowance.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(UpdateGuardianAllowanceCommand)
export class UpdateGuardianAllowanceHandler
  extends BaseCommandHandler<UpdateGuardianAllowanceCommand, GuardianshipAggregate>
  implements ICommandHandler<UpdateGuardianAllowanceCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateGuardianAllowanceCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.updateGuardianAllowance({
        guardianId: command.guardianId,
        amountKES: command.amountKES,
        approvedBy: command.approvedBy,
      });
    });
  }
}
