// application/guardianship/commands/impl/terminate-guardianship.command.ts
import { Command } from '../base.command';

export interface TerminateGuardianshipCommandProps {
  guardianshipId: string;
  reason: string;
  terminationDate: Date;
  courtOrderNumber?: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class TerminateGuardianshipCommand extends Command<TerminateGuardianshipCommandProps> {
  constructor(props: TerminateGuardianshipCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'TerminateGuardianshipCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get reason(): string {
    return this.props.reason;
  }

  get terminationDate(): Date {
    return this.props.terminationDate;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.reason || this.reason.trim().length === 0) {
      errors.push('Termination reason is required');
    }
    if (!this.terminationDate) errors.push('Termination date is required');

    if (this.terminationDate && this.terminationDate > new Date()) {
      errors.push('Termination date cannot be in the future');
    }

    return errors;
  }
}