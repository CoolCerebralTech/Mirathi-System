// application/guardianship/commands/handlers/renew-guardian-bond.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { RenewGuardianBondCommand } from '../impl/renew-guardian-bond.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(RenewGuardianBondCommand)
export class RenewGuardianBondHandler
  extends baseCommandHandler.BaseCommandHandler<
    RenewGuardianBondCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<RenewGuardianBondCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RenewGuardianBondCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      // Note: Guardian entity has renewBond() method, but aggregate doesn't expose it
      // We need to get the guardian and call renewBond
      const guardian = aggregate.getGuardianById(command.guardianId);
      if (!guardian) {
        throw new Error(`Guardian ${command.guardianId} not found`);
      }

      // Since Guardian entity's renewBond is private to the aggregate,
      // we need to add a method on aggregate to handle this
      // For now, I'll skip implementation - we need to update aggregate
      throw new Error('Renew bond functionality not implemented on aggregate');
    });
  }
}
