// application/guardianship/commands/handlers/replace-guardian.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { ReplaceGuardianCommand } from '../impl/replace-guardian.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(ReplaceGuardianCommand)
export class ReplaceGuardianHandler
  extends baseCommandHandler.BaseCommandHandler<ReplaceGuardianCommand, GuardianshipAggregate, void>
  implements ICommandHandler<ReplaceGuardianCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: ReplaceGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.replaceGuardian({
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
