// application/guardianship/commands/impl/file-annual-report.command.ts
import { Command } from '../base.command';

export interface FileAnnualReportCommandProps {
  guardianshipId: string;
  reportDate: Date;
  summary: string;
  metadata?: Record<string, any>;
  approvedBy?: string;

  correlationId?: string;
  timestamp?: Date;
}

export class FileAnnualReportCommand extends Command<FileAnnualReportCommandProps> {
  constructor(props: FileAnnualReportCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'FileAnnualReportCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get reportDate(): Date {
    return this.props.reportDate;
  }

  get summary(): string {
    return this.props.summary;
  }

  get approvedBy(): string | undefined {
    return this.props.approvedBy;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.reportDate) errors.push('Report date is required');
    if (!this.summary || this.summary.trim().length === 0) {
      errors.push('Report summary is required');
    }

    if (this.reportDate && this.reportDate > new Date()) {
      errors.push('Report date cannot be in the future');
    }

    return errors;
  }
}
