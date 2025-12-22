// application/guardianship/commands/handlers/record-ward-capacity-restored.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { RecordWardCapacityRestoredCommand } from '../impl/record-ward-capacity-restored.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(RecordWardCapacityRestoredCommand)
export class RecordWardCapacityRestoredHandler
  extends baseCommandHandler.BaseCommandHandler<
    RecordWardCapacityRestoredCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<RecordWardCapacityRestoredCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RecordWardCapacityRestoredCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.handleWardRegainedCapacity(command.recoveryDate);
    });
  }
}
