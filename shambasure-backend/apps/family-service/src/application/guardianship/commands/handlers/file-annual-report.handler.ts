import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import type { IGuardianshipRepository } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { GUARDIANSHIP_REPOSITORY } from '../../../../domain/interfaces/repositories/iguardianship.repository';
import { FileAnnualReportCommand } from '../impl/file-annual-report.command';
import { BaseCommandHandler } from './base-command.handler';

@CommandHandler(FileAnnualReportCommand)
export class FileAnnualReportHandler
  extends BaseCommandHandler<FileAnnualReportCommand, GuardianshipAggregate>
  implements ICommandHandler<FileAnnualReportCommand>
{
  constructor(
    protected readonly eventBus: EventBus,
    @Inject(GUARDIANSHIP_REPOSITORY)
    protected readonly repository: IGuardianshipRepository,
  ) {
    super(eventBus, repository);
  }

  async execute(command: FileAnnualReportCommand): Promise<void> {
    await this.run(command, command.guardianshipId, (guardianship) => {
      guardianship.fileAnnualReport({
        guardianId: command.guardianId,
        reportDate: command.reportDate,
        summary: command.summary,
        financialStatement: command.financialStatement,
        approvedBy: command.approvedBy,
      });
    });
  }
}
