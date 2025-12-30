// src/application/guardianship/commands/handlers/update-guardian-powers.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { GuardianshipPowersVO } from '../../../../domain/value-objects/guardianship-powers.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { UpdateGuardianPowersCommand } from '../impl/update-guardian-powers.command';

@CommandHandler(UpdateGuardianPowersCommand)
export class UpdateGuardianPowersHandler extends BaseCommandHandler<
  UpdateGuardianPowersCommand,
  GuardianshipAggregate,
  Result<void>
> {
  constructor(
    @Inject(GUARDIANSHIP_REPOSITORY)
    repo: IGuardianshipRepository,
    eventBus: EventBus,
  ) {
    super(eventBus, repo);
  }

  async execute(command: UpdateGuardianPowersCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        const assignment = aggregate
          .getActiveGuardians()
          .find((g) => g.guardianId === command.guardianId);

        if (!assignment) {
          throw new AppErrors.NotFoundError('Active Guardian Assignment', command.guardianId);
        }

        // Create new VO
        const powersVO = GuardianshipPowersVO.create(command.newPowers);

        // Domain Logic: Update powers on the entity
        assignment.updatePowers(powersVO);
      });

      this.logSuccess(command, `Updated powers for guardian ${command.guardianId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
