import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { RecordWardCapacityRestoredCommand } from '../impl/record-ward-capacity-restored.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(RecordWardCapacityRestoredCommand)
export class RecordWardCapacityRestoredHandler
  extends BaseCommandHandler<RecordWardCapacityRestoredCommand, GuardianshipAggregate>
  implements ICommandHandler<RecordWardCapacityRestoredCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: RecordWardCapacityRestoredCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.handleWardRegainedCapacity(command.recoveryDate);
    });
  }
}
