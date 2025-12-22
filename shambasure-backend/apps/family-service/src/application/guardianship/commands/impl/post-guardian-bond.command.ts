// application/guardianship/commands/impl/post-guardian-bond.command.ts
import { BaseCommand } from '../base.command';

export class PostGuardianBondCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly provider: string,
    public readonly policyNumber: string,
    public readonly amountKES: number,
    public readonly expiryDate: Date,
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

    if (!this.provider) {
      throw new Error('Bond provider is required');
    }

    if (!this.policyNumber) {
      throw new Error('Policy number is required');
    }

    if (this.amountKES <= 0) {
      throw new Error('Bond amount must be positive');
    }

    if (!this.expiryDate || this.expiryDate <= new Date()) {
      throw new Error('Expiry date must be in the future');
    }
  }
}
