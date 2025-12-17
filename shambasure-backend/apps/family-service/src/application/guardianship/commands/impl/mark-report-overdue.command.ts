// application/guardianship/commands/impl/mark-report-overdue.command.ts
import { Command } from '../base.command';

export interface MarkReportOverdueCommandProps {
  guardianshipId: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class MarkReportOverdueCommand extends Command<MarkReportOverdueCommandProps> {
  constructor(props: MarkReportOverdueCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'MarkReportOverdueCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');

    return errors;
  }
}
