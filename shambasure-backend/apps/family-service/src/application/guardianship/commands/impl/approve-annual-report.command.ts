// application/guardianship/commands/impl/approve-annual-report.command.ts
import { Command } from '../base.command';

export interface ApproveAnnualReportCommandProps {
  guardianshipId: string;
  auditorId: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class ApproveAnnualReportCommand extends Command<ApproveAnnualReportCommandProps> {
  constructor(props: ApproveAnnualReportCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'ApproveAnnualReportCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get auditorId(): string {
    return this.props.auditorId;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.auditorId) errors.push('Auditor ID is required');

    return errors;
  }
}