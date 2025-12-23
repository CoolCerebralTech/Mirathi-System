import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { RenewGuardianBondCommand } from '../impl/renew-guardian-bond.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(RenewGuardianBondCommand)
export class RenewGuardianBondHandler
  extends BaseCommandHandler<RenewGuardianBondCommand, GuardianshipAggregate>
  implements ICommandHandler<RenewGuardianBondCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RenewGuardianBondCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.renewGuardianBond({
        guardianId: command.guardianId,
        newExpiryDate: command.newExpiryDate,
        newPolicyNumber: command.newPolicyNumber,
      });
    });
  }
}
