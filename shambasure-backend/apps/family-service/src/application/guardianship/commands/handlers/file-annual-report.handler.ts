// application/guardianship/commands/handlers/file-annual-report.handler.ts
import { Injectable } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { GuardianshipAggregate } from '../../../../domain/aggregates/guardianship.aggregate';
import { FileAnnualReportCommand } from '../impl/file-annual-report.command';
import * as baseCommandHandler from './base-command.handler';

@Injectable()
@CommandHandler(FileAnnualReportCommand)
export class FileAnnualReportHandler
  extends baseCommandHandler.BaseCommandHandler<
    FileAnnualReportCommand,
    GuardianshipAggregate,
    void
  >
  implements ICommandHandler<FileAnnualReportCommand, void>
{
  constructor(
    protected readonly eventBus: EventBus,
    protected readonly repository: baseCommandHandler.AggregateRepository<GuardianshipAggregate>,
  ) {
    super(eventBus, repository);
  }

  async execute(command: FileAnnualReportCommand): Promise<void> {
    await this.run(command, command.guardianshipId, async (aggregate) => {
      aggregate.fileAnnualReport({
        guardianId: command.guardianId,
        reportDate: command.reportDate,
        summary: command.summary,
        financialStatement: command.financialStatement,
        approvedBy: command.approvedBy,
      });
    });
  }
}
