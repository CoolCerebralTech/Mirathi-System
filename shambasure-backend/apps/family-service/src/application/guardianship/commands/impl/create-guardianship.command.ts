// application/guardianship/commands/impl/create-guardianship.command.ts
import { GuardianType } from '@prisma/client';

import {
  CustomaryLawDetails,
  GuardianEligibilityInfo,
  WardInfo,
} from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseCommand } from '../base.command';

export class CreateGuardianshipCommand extends BaseCommand {
  constructor(
    public readonly wardInfo: WardInfo,
    public readonly guardianId: string,
    public readonly guardianEligibility: GuardianEligibilityInfo,
    public readonly type: GuardianType,
    public readonly appointmentDate: Date,
    public readonly courtOrderNumber?: string,
    public readonly courtStation?: string,
    public readonly validUntil?: Date,
    public readonly hasPropertyManagementPowers?: boolean,
    public readonly canConsentToMedical?: boolean,
    public readonly canConsentToMarriage?: boolean,
    public readonly restrictions?: string[],
    public readonly specialInstructions?: string,
    public readonly bondRequired?: boolean,
    public readonly bondAmountKES?: number,
    public readonly annualAllowanceKES?: number,
    public readonly customaryLawApplies?: boolean,
    public readonly customaryDetails?: CustomaryLawDetails,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.wardInfo) {
      throw new Error('Ward information is required');
    }

    if (!this.guardianId) {
      throw new Error('Guardian ID is required');
    }

    if (!this.type) {
      throw new Error('Guardian type is required');
    }

    if (!this.appointmentDate) {
      throw new Error('Appointment date is required');
    }

    // Guardian cannot be ward
    if (this.guardianId === this.wardInfo.wardId) {
      throw new Error('A person cannot be their own guardian');
    }
  }
}
