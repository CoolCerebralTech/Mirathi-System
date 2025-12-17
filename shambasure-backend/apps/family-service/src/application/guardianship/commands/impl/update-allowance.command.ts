// application/guardianship/commands/impl/update-allowance.command.ts
import { Command } from '../base.command';

export interface UpdateAllowanceCommandProps {
  guardianshipId: string;
  amount: number;
  approvedBy: string;

  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class UpdateAllowanceCommand extends Command<UpdateAllowanceCommandProps> {
  constructor(props: UpdateAllowanceCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'UpdateAllowanceCommand';
  }

  get guardianshipId(): string {
    return this.props.guardianshipId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get approvedBy(): string {
    return this.props.approvedBy;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.guardianshipId) errors.push('Guardianship ID is required');
    if (this.amount < 0) errors.push('Allowance amount cannot be negative');
    if (!this.approvedBy) errors.push('Approver ID is required');

    return errors;
  }
}
