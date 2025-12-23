// application/guardianship/commands/impl/record-ward-death.command.ts
import { BaseCommand } from '../base.command';

export interface RecordWardDeathCommandPayload {
  guardianshipId: string;
  deathDate: Date;
  deathCertificateNumber?: string;
}

export class RecordWardDeathCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly deathDate: Date;
  public readonly deathCertificateNumber?: string;

  constructor(
    payload: RecordWardDeathCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.deathDate = payload.deathDate;
    this.deathCertificateNumber = payload.deathCertificateNumber;

    this.validate();
  }

  validate(): void {
    super.validate();
    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.deathDate) throw new Error('Death date is required');
    if (this.deathDate > new Date()) throw new Error('Death date cannot be in the future');
  }
}
