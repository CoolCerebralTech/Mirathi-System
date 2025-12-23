// application/guardianship/commands/impl/dissolve-guardianship.command.ts
import { BaseCommand } from '../base.command';

export interface DissolveGuardianshipCommandPayload {
  guardianshipId: string;
  reason: string;
  dissolvedDate: Date;
  courtOrderNumber?: string;
}

export class DissolveGuardianshipCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly reason: string;
  public readonly dissolvedDate: Date;
  public readonly courtOrderNumber?: string;

  constructor(
    payload: DissolveGuardianshipCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.reason = payload.reason;
    this.dissolvedDate = payload.dissolvedDate;
    this.courtOrderNumber = payload.courtOrderNumber;

    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.reason || this.reason.trim().length === 0)
      throw new Error('Dissolution reason is required');
    if (!this.dissolvedDate) throw new Error('Dissolution date is required');
  }
}
