// application/guardianship/commands/impl/update-guardian-allowance.command.ts
import { BaseCommand } from '../base.command';

export interface UpdateGuardianAllowanceCommandPayload {
  guardianshipId: string;
  guardianId: string;
  amountKES: number;
  approvedBy: string;
}

export class UpdateGuardianAllowanceCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly amountKES: number;
  public readonly approvedBy: string;

  constructor(
    payload: UpdateGuardianAllowanceCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.amountKES = payload.amountKES;
    this.approvedBy = payload.approvedBy;

    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (this.amountKES < 0) throw new Error('Allowance amount cannot be negative');
    if (!this.approvedBy) throw new Error('Approval authority is required for allowance changes');
  }
}
