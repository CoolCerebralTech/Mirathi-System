// application/guardianship/commands/impl/replace-guardian.command.ts
import { GuardianEligibilityInfo } from '../../../../domain/aggregates/guardianship.aggregate';
import { TerminationReason } from '../../../../domain/entities/guardian.entity';
import { BaseCommand } from '../base.command';

export class ReplaceGuardianCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly outgoingGuardianId: string,
    public readonly replacementGuardianId: string,
    public readonly replacementEligibility: GuardianEligibilityInfo,
    public readonly reason: TerminationReason,
    public readonly appointmentDate: Date,
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

    if (!this.outgoingGuardianId) {
      throw new Error('Outgoing guardian ID is required');
    }

    if (!this.replacementGuardianId) {
      throw new Error('Replacement guardian ID is required');
    }

    if (!this.replacementEligibility) {
      throw new Error('Replacement guardian eligibility is required');
    }

    if (!this.reason) {
      throw new Error('Termination reason is required');
    }

    if (!this.appointmentDate) {
      throw new Error('Appointment date is required');
    }

    if (this.outgoingGuardianId === this.replacementGuardianId) {
      throw new Error('Outgoing and replacement guardian cannot be the same person');
    }
  }
}
