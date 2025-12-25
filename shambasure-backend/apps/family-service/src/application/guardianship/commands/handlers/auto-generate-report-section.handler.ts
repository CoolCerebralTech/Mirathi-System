// src/application/guardianship/commands/handlers/auto-generate-report-section.handler.ts
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import {
  GUARDIANSHIP_REPOSITORY,
  type IGuardianshipRepository,
} from '../../../../domain/interfaces/iguardianship.repository';
import { AppErrors } from '../../../common/application.error';
import { BaseCommandHandler } from '../../../common/base/base.command-handler';
import { Result } from '../../../common/result';
import { AutoGenerateReportSectionCommand } from '../impl/auto-generate-report-section.command';

@CommandHandler(AutoGenerateReportSectionCommand)
export class AutoGenerateReportSectionHandler extends BaseCommandHandler<
  AutoGenerateReportSectionCommand,
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

  async execute(command: AutoGenerateReportSectionCommand): Promise<Result<void>> {
    try {
      await this.run(command, command.guardianshipId, (aggregate) => {
        // 1. Locate the specific compliance check
        // Accessing via private props cast (or public getter if available)
        const check = aggregate.props.complianceChecks.find(
          (c: any) => c.id.toString() === command.complianceCheckId,
        );

        if (!check) {
          throw new AppErrors.NotFoundError('Compliance Check', command.complianceCheckId);
        }

        // 2. Trigger AI Generation Logic
        // The Entity encapsulates the "Simulation" or logic to populate content
        check.autoGenerateSection(command.sectionId, command.dataSource);
      });

      this.logSuccess(command, `AI generated section ${command.sectionId}`);
      return Result.ok();
    } catch (error) {
      return Result.fail(error as Error);
    }
  }
}
