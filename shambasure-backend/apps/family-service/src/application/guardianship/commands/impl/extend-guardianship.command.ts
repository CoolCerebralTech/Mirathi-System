// application/guardianship/commands/impl/extend-guardianship.command.ts
import { Command } from '../base.command';

export interface ExtendGuardianshipCommandProps {
  guardianshipId: string;
  newValidUntil: Date;
  courtOrderNumber?: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class ExtendGuardianshipCommand extends Command<ExtendGuardianshipCommandProps> {
  constructor(props: ExtendGuardianshipCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'ExtendGuardianshipCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get newValidUntil(): Date {
    return this.props.newValidUntil;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.newValidUntil) errors.push('New valid until date is required');

    if (this.newValidUntil && this.newValidUntil <= new Date()) {
      errors.push('New term must be in the future');
    }

    return errors;
  }
}