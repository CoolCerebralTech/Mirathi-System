// application/guardianship/commands/handlers/record-ward-death.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { RecordWardDeathCommand } from '../impl/record-ward-death.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(RecordWardDeathCommand)
export class RecordWardDeathHandler
  extends baseCommandHandler.BaseCommandHandler<RecordWardDeathCommand, GuardianshipAggregate, void>
  implements ICommandHandler<RecordWardDeathCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RecordWardDeathCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.handleWardDeath(command.deathDate);
    });
  }
}
