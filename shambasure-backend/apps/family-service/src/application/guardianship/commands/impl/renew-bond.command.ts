// application/guardianship/commands/impl/renew-bond.command.ts
import { Command } from '../base.command';

export interface RenewBondCommandProps {
  guardianshipId: string;
  newExpiryDate: Date;
  provider?: string;
  policyNumber?: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class RenewBondCommand extends Command<RenewBondCommandProps> {
  constructor(props: RenewBondCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'RenewBondCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get newExpiryDate(): Date {
    return this.props.newExpiryDate;
  }

  get provider(): string | undefined {
    return this.props.provider;
  }

  get policyNumber(): string | undefined {
    return this.props.policyNumber;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (!this.newExpiryDate) errors.push('New expiry date is required');

    if (this.newExpiryDate && this.newExpiryDate <= new Date()) {
      errors.push('New bond expiry must be in the future');
    }

    return errors;
  }
}
