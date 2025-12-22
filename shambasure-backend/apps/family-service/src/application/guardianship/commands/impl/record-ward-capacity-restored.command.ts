// application/guardianship/commands/impl/record-ward-capacity-restored.command.ts
import { BaseCommand } from '../base.command';

export class RecordWardCapacityRestoredCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly recoveryDate: Date,
    public readonly medicalCertificateNumber?: string,
    public readonly courtOrderNumber?: string,
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

    if (!this.recoveryDate) {
      throw new Error('Recovery date is required');
    }

    if (this.recoveryDate > new Date()) {
      throw new Error('Recovery date cannot be in the future');
    }
  }
}
