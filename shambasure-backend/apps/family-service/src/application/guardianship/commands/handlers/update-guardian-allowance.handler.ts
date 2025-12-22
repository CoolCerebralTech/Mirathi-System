// application/guardianship/commands/handlers/update-guardian-allowance.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { UpdateGuardianAllowanceCommand } from '../impl/update-guardian-allowance.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(UpdateGuardianAllowanceCommand)
export class UpdateGuardianAllowanceHandler
  extends baseCommandHandler.BaseCommandHandler<
    UpdateGuardianAllowanceCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<UpdateGuardianAllowanceCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateGuardianAllowanceCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.updateGuardianAllowance({
        guardianId: command.guardianId,
        amountKES: command.amountKES,
        approvedBy: command.approvedBy,
      });
    });
  }
}
