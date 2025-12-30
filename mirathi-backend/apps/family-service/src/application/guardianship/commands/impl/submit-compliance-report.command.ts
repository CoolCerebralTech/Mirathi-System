// src/application/guardianship/commands/impl/submit-compliance-report.command.ts
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class SubmitComplianceReportCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly complianceCheckId: string,
    public readonly method: 'E_FILING' | 'EMAIL' | 'PHYSICAL' | 'COURT_PORTAL' | 'LAWYER',
    public readonly details: string,
    public readonly userId: string,
    public readonly confirmationNumber?: string,
  ) {
    super({ userId });
  }
}
