// application/guardianship/commands/impl/record-ward-death.command.ts
import { BaseCommand } from '../base.command';

export class RecordWardDeathCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly deathDate: Date,
    public readonly deathCertificateNumber?: string,
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

    if (!this.deathDate) {
      throw new Error('Death date is required');
    }

    if (this.deathDate > new Date()) {
      throw new Error('Death date cannot be in the future');
    }
  }
}
