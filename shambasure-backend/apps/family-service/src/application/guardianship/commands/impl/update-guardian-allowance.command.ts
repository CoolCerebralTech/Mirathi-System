// application/guardianship/commands/impl/update-guardian-allowance.command.ts
import { BaseCommand } from '../base.command';

export class UpdateGuardianAllowanceCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly amountKES: number,
    public readonly approvedBy: string,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) {
      throw new Error('Guardianship ID is required');
    }

    if (!this.guardianId) {
      throw new Error('Guardian ID is required');
    }

    if (this.amountKES < 0) {
      throw new Error('Allowance amount cannot be negative');
    }

    if (!this.approvedBy) {
      throw new Error('Approval authority is required for allowance changes');
    }
  }
}
