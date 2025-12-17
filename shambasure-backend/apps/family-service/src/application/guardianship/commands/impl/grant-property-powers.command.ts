// application/guardianship/commands/impl/grant-property-powers.command.ts
import { Command } from '../base.command';

export interface GrantPropertyPowersCommandProps {
  guardianshipId: string;
  courtOrderNumber?: string;
  restrictions?: Record<string, any>;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class GrantPropertyPowersCommand extends Command<GrantPropertyPowersCommandProps> {
  constructor(props: GrantPropertyPowersCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'GrantPropertyPowersCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get courtOrderNumber(): string | undefined {
    return this.props.courtOrderNumber;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');

    return errors;
  }
}
