// application/guardianship/commands/impl/check-bond-expiry.command.ts
import { BaseCommand } from '../base.command';

/**
 * Manual trigger to check bond expiry for all guardians in a guardianship
 * Typically automated, but can be triggered manually for audits
 */
export class CheckBondExpiryCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
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
  }
}
