// src/application/guardianship/commands/impl/request-report-amendment.command.ts
import { CourtFeedback } from '../../../../domain/entities/compliance-check.entity';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export class RequestReportAmendmentCommand extends BaseCommand implements ICommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly complianceCheckId: string,
    public readonly feedback: CourtFeedback,
    public readonly newDeadline: Date | undefined,
    public readonly userId: string,
  ) {
    super({ userId });

    if (!feedback || !feedback.comments) {
      throw new Error('Feedback comments are required for amendment requests');
    }
  }
}
