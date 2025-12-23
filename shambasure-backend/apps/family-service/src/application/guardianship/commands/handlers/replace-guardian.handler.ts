import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { ReplaceGuardianCommand } from '../impl/replace-guardian.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(ReplaceGuardianCommand)
export class ReplaceGuardianHandler
  extends BaseCommandHandler<ReplaceGuardianCommand, GuardianshipAggregate>
  implements ICommandHandler<ReplaceGuardianCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: ReplaceGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.replaceGuardian({
        outgoingGuardianId: command.outgoingGuardianId,
        replacementGuardianId: command.replacementGuardianId,
        replacementEligibility: command.replacementEligibility,
        reason: command.reason,
        appointmentDate: command.appointmentDate,
        courtOrderNumber: command.courtOrderNumber,
      });
    });
  }
}
