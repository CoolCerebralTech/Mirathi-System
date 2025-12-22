// application/guardianship/commands/handlers/update-ward-info.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { UpdateWardInfoCommand } from '../impl/update-ward-info.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(UpdateWardInfoCommand)
export class UpdateWardInfoHandler
  extends baseCommandHandler.BaseCommandHandler<UpdateWardInfoCommand, GuardianshipAggregate, void>
  implements ICommandHandler<UpdateWardInfoCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateWardInfoCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.updateWardInfo(command.wardInfo);
    });
  }
}
