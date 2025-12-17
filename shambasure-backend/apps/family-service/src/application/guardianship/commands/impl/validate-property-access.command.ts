// application/guardianship/commands/impl/validate-property-access.command.ts
import { Command } from '../base.command';

export interface ValidatePropertyAccessCommandProps {
  guardianshipId: string;
  accessType: string;
  context?: Record<string, any>;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class ValidatePropertyAccessCommand extends Command<ValidatePropertyAccessCommandProps> {
  constructor(props: ValidatePropertyAccessCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'ValidatePropertyAccessCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get accessType(): string {
    return this.props.accessType;
  }

  get context(): Record<string, any> | undefined {
    return this.props.context;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.accessType) errors.push('Access type is required');

    const validAccessTypes = [
      'SELL_PROPERTY',
      'MORTGAGE_PROPERTY',
      'TRANSFER_PROPERTY',
      'MANAGE_PROPERTY',
      'INVEST_FUNDS'
    ];

    if (this.accessType && !validAccessTypes.includes(this.accessType)) {
      errors.push(`Access type must be one of: ${validAccessTypes.join(', ')}`);
    }

    return errors;
  }
}