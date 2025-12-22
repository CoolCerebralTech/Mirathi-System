// application/guardianship/commands/handlers/remove-guardian.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { RemoveGuardianCommand } from '../impl/remove-guardian.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(RemoveGuardianCommand)
export class RemoveGuardianHandler
  extends baseCommandHandler.BaseCommandHandler<RemoveGuardianCommand, GuardianshipAggregate, void>
  implements ICommandHandler<RemoveGuardianCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RemoveGuardianCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.removeGuardian({
        guardianId: command.guardianId,
        reason: command.reason,
        terminationDate: command.terminationDate,
      });
    });
  }
}
