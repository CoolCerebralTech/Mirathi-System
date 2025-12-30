// src/application/guardianship/commands/handlers/post-bond.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
// VO Imports
import {
  BondStatus,
  GuardianshipBondVO,
} from '../../../../domain/value-objects/guardianship-bond.vo';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { PostBondCommand } from '../impl/post-bond.command';

@CommandHandler(PostBondCommand)
export class PostBondHandler extends BaseCommandHandler<
  PostBondCommand,
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

  async execute(command: PostBondCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // 1. Find the active guardian
        const assignment = aggregate
          .getActiveGuardians()
          .find((g) => g.guardianId === command.guardianId);

        if (!assignment) {
          throw new AppErrors.NotFoundError('Active Guardian Assignment', command.guardianId);
        }

        // 2. Create Bond VO
        const bondVO = GuardianshipBondVO.create({
          status: BondStatus.POSTED,
          amount: command.bondDetails.amount,
          suretyCompany: command.bondDetails.suretyCompany,
          bondReference: command.bondDetails.bondReference,
          postedDate: new Date(), // Set strictly at time of posting
          courtOrderReference: command.bondDetails.courtOrderReference,
          digitalVerificationUrl: command.bondDetails.digitalVerificationUrl,
          // verifiedByCourtOfficer can be set later via a review command
        });

        // 3. Update Bond on Entity
        // This will trigger GuardianBondUpdatedEvent
        assignment.updateBond(bondVO);

        // Note: If property management was blocked pending bond,
        // the Aggregate might need to re-evaluate risk here,
        // but the event sourcing handles the fact change.
      });

      this.logSuccess(
        command,
        `Posted bond ${command.bondDetails.bondReference} for guardian ${command.guardianId}`,
      );
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
