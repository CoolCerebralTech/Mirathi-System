// src/application/guardianship/commands/impl/auto-generate-report-section.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class AutoGenerateReportSectionCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly complianceCheckId: string,
    public readonly sectionId: string,
    public readonly dataSource: string, // e.g., 'SCHOOL_API', 'MEDICAL_RECORDS', 'TRANSACTION_HISTORY'
    public readonly userId: string,
  ) {
    super({ userId });
  }
}
