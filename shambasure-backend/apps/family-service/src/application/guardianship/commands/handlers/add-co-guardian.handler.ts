import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { AddCoGuardianCommand } from '../impl/add-co-guardian.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(AddCoGuardianCommand)
export class AddCoGuardianHandler
  extends BaseCommandHandler<AddCoGuardianCommand, GuardianshipAggregate>
  implements ICommandHandler<AddCoGuardianCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: AddCoGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.addCoGuardian({
        guardianId: command.guardianId,
        guardianEligibility: command.guardianEligibility,
        type: command.type,
        appointmentDate: command.appointmentDate,
        courtOrderNumber: command.courtOrderNumber,
        hasPropertyManagementPowers: command.hasPropertyManagementPowers,
        canConsentToMedical: command.canConsentToMedical,
        canConsentToMarriage: command.canConsentToMarriage,
        restrictions: command.restrictions,
        bondRequired: command.bondRequired,
        bondAmountKES: command.bondAmountKES,
      });
    });
  }
}
