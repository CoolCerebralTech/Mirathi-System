// application/guardianship/commands/impl/check-compliance.command.ts
import { BaseCommand } from '../base.command';

export interface CheckComplianceCommandPayload {
  guardianshipId: string;
}

/**
 * Manual trigger to check compliance status (S.72 & S.73)
 */
export class CheckComplianceCommand extends BaseCommand {
  public readonly guardianshipId: string;

  constructor(
    payload: CheckComplianceCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
  }
}
