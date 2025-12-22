// application/guardianship/commands/handlers/dissolve-guardianship.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { DissolveGuardianshipCommand } from '../impl/dissolve-guardianship.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(DissolveGuardianshipCommand)
export class DissolveGuardianshipHandler
  extends baseCommandHandler.BaseCommandHandler<
    DissolveGuardianshipCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<DissolveGuardianshipCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: DissolveGuardianshipCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.dissolveGuardianship({
        reason: command.reason,
        dissolvedDate: command.dissolvedDate,
        courtOrderNumber: command.courtOrderNumber,
      });
    });
  }
}
