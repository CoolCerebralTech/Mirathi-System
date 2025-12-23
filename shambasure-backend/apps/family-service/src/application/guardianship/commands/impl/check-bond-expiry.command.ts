// application/guardianship/commands/impl/check-bond-expiry.command.ts
import { BaseCommand } from '../base.command';

export interface CheckBondExpiryCommandPayload {
  guardianshipId: string;
}

/**
 * Manual trigger to check bond expiry for all guardians in a guardianship
 */
export class CheckBondExpiryCommand extends BaseCommand {
  public readonly guardianshipId: string;

  constructor(
    payload: CheckBondExpiryCommandPayload,
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
