// application/guardianship/commands/impl/check-compliance.command.ts
import { BaseCommand } from '../base.command';

/**
 * Manual trigger to check compliance status (S.72 & S.73)
 */
export class CheckComplianceCommand extends BaseCommand {
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
