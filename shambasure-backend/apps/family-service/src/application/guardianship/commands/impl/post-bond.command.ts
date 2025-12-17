// application/guardianship/commands/impl/post-bond.command.ts
import { Command } from '../base.command';

export interface PostBondCommandProps {
  guardianshipId: string;
  provider: string;
  policyNumber: string;
  expiryDate: Date;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class PostBondCommand extends Command<PostBondCommandProps> {
  constructor(props: PostBondCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'PostBondCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get provider(): string {
    return this.props.provider;
  }

  get policyNumber(): string {
    return this.props.policyNumber;
  }

  get expiryDate(): Date {
    return this.props.expiryDate;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.provider) errors.push('Bond provider is required');
    if (!this.policyNumber) errors.push('Bond policy number is required');
    if (!this.expiryDate) errors.push('Bond expiry date is required');

    if (this.expiryDate && this.expiryDate <= new Date()) {
      errors.push('Bond expiry date must be in the future');
    }

    return errors;
  }
}
