// application/guardianship/commands/impl/update-restrictions.command.ts
import { Command } from '../base.command';

export interface UpdateRestrictionsCommandProps {
  guardianshipId: string;
  restrictions: Record<string, any>;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class UpdateRestrictionsCommand extends Command<UpdateRestrictionsCommandProps> {
  constructor(props: UpdateRestrictionsCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'UpdateRestrictionsCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get restrictions(): Record<string, any> {
    return this.props.restrictions;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.restrictions || typeof this.restrictions !== 'object') {
      errors.push('Valid restrictions object is required');
    }

    return errors;
  }
}