// src/application/guardianship/commands/impl/review-compliance-report.command.ts
import { CourtFeedback } from '../../../../domain/entities/compliance-check.entity';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class ReviewComplianceReportCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly complianceCheckId: string,
    public readonly outcome: 'ACCEPT', // We separate Amendment to a different command for clarity
    public readonly userId: string, // Reviewer ID
    public readonly feedback?: CourtFeedback, // Optional formal court feedback
  ) {
    super({ userId });
  }
}
