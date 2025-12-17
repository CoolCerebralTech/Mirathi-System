// application/guardianship/commands/impl/update-special-instructions.command.ts
import { Command } from '../base.command';

export interface UpdateSpecialInstructionsCommandProps {
  guardianshipId: string;
  instructions: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class UpdateSpecialInstructionsCommand extends Command<UpdateSpecialInstructionsCommandProps> {
  constructor(props: UpdateSpecialInstructionsCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'UpdateSpecialInstructionsCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get instructions(): string {
    return this.props.instructions;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.instructions || this.instructions.trim().length === 0) {
      errors.push('Instructions are required');
    }

    return errors;
  }
}