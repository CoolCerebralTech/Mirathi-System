// application/guardianship/commands/handlers/grant-property-powers.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { GrantPropertyPowersCommand } from '../impl/grant-property-powers.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(GrantPropertyPowersCommand)
export class GrantPropertyPowersHandler
  extends baseCommandHandler.BaseCommandHandler<
    GrantPropertyPowersCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<GrantPropertyPowersCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: GrantPropertyPowersCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.grantPropertyPowers({
        guardianId: command.guardianId,
        courtOrderNumber: command.courtOrderNumber,
        restrictions: command.restrictions,
      });
    });
  }
}
