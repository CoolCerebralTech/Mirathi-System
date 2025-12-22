// application/guardianship/commands/impl/add-co-guardian.command.ts
import { GuardianType } from '@prisma/client';

import { GuardianEligibilityInfo } from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseCommand } from '../base.command';

export class AddCoGuardianCommand extends BaseCommand {
  constructor(
    public readonly guardianshipId: string,
    public readonly guardianId: string,
    public readonly guardianEligibility: GuardianEligibilityInfo,
    public readonly type: GuardianType,
    public readonly appointmentDate: Date,
    public readonly courtOrderNumber?: string,
    public readonly hasPropertyManagementPowers?: boolean,
    public readonly canConsentToMedical?: boolean,
    public readonly canConsentToMarriage?: boolean,
    public readonly restrictions?: string[],
    public readonly bondRequired?: boolean,
    public readonly bondAmountKES?: number,
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

    if (!this.guardianEligibility) {
      throw new Error('Guardian eligibility information is required');
    }

    if (!this.type) {
      throw new Error('Guardian type is required');
    }

    if (!this.appointmentDate) {
      throw new Error('Appointment date is required');
    }
  }
}
