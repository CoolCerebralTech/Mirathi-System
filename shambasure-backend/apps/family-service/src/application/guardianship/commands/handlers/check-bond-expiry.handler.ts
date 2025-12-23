import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { CheckBondExpiryCommand } from '../impl/check-bond-expiry.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(CheckBondExpiryCommand)
export class CheckBondExpiryHandler
  extends BaseCommandHandler<CheckBondExpiryCommand, GuardianshipAggregate>
  implements ICommandHandler<CheckBondExpiryCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: CheckBondExpiryCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      // The aggregate's checkCompliance method handles S.72 bond expiry logic internally
      // and emits events if needed, so we trigger that here.
      // Alternatively, if you expose checkBondExpiry() on aggregate, call that.
      // Based on provided Aggregate, checkCompliance() is the method.
      guardianship.checkCompliance();
    });
  }
}
