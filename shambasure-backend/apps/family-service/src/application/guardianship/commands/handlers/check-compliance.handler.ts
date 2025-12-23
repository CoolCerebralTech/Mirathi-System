import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { CheckComplianceCommand } from '../impl/check-compliance.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(CheckComplianceCommand)
export class CheckComplianceHandler
  extends BaseCommandHandler<CheckComplianceCommand, GuardianshipAggregate>
  implements ICommandHandler<CheckComplianceCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: CheckComplianceCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.checkCompliance();
    });
  }
}
