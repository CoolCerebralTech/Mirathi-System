// application/guardianship/commands/handlers/update-guardian-restrictions.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { UpdateGuardianRestrictionsCommand } from '../impl/update-guardian-restrictions.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(UpdateGuardianRestrictionsCommand)
export class UpdateGuardianRestrictionsHandler
  extends baseCommandHandler.BaseCommandHandler<
    UpdateGuardianRestrictionsCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<UpdateGuardianRestrictionsCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: UpdateGuardianRestrictionsCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (_aggregate) => {
      // Note: Similar issue - aggregate doesn't have updateGuardianRestrictions method
      // We need to add it to aggregate or handle differently
      throw new Error('Update guardian restrictions functionality not implemented on aggregate');
    });
  }
}
