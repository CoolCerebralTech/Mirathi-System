// application/guardianship/commands/handlers/add-co-guardian.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { AddCoGuardianCommand } from '../impl/add-co-guardian.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(AddCoGuardianCommand)
export class AddCoGuardianHandler
  extends baseCommandHandler.BaseCommandHandler<AddCoGuardianCommand, GuardianshipAggregate, void>
  implements ICommandHandler<AddCoGuardianCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: AddCoGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.addCoGuardian({
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
