// application/guardianship/commands/impl/renew-guardian-bond.command.ts
import { BaseCommand } from '../base.command';

export interface RenewGuardianBondCommandPayload {
  guardianshipId: string;
  guardianId: string;
  newExpiryDate: Date;
  newPolicyNumber?: string;
}

export class RenewGuardianBondCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly newExpiryDate: Date;
  public readonly newPolicyNumber?: string;

  constructor(
    payload: RenewGuardianBondCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.newExpiryDate = payload.newExpiryDate;
    this.newPolicyNumber = payload.newPolicyNumber;

    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (!this.newExpiryDate || this.newExpiryDate <= new Date())
      throw new Error('New expiry date must be in the future');
  }
}
