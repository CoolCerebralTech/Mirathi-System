// application/guardianship/commands/impl/add-co-guardian.command.ts
import { GuardianType } from '@prisma/client';

import { GuardianEligibilityInfo } from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseCommand } from '../base.command';

export interface AddCoGuardianCommandPayload {
  guardianshipId: string;
  guardianId: string;
  guardianEligibility: GuardianEligibilityInfo;
  type: GuardianType;
  appointmentDate: Date;
  courtOrderNumber?: string;
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  bondRequired?: boolean;
  bondAmountKES?: number;
}

export class AddCoGuardianCommand extends BaseCommand {
  public readonly guardianshipId: string;
  public readonly guardianId: string;
  public readonly guardianEligibility: GuardianEligibilityInfo;
  public readonly type: GuardianType;
  public readonly appointmentDate: Date;
  public readonly courtOrderNumber?: string;
  public readonly hasPropertyManagementPowers?: boolean;
  public readonly canConsentToMedical?: boolean;
  public readonly canConsentToMarriage?: boolean;
  public readonly restrictions?: string[];
  public readonly bondRequired?: boolean;
  public readonly bondAmountKES?: number;

  constructor(
    payload: AddCoGuardianCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);
    this.guardianshipId = payload.guardianshipId;
    this.guardianId = payload.guardianId;
    this.guardianEligibility = payload.guardianEligibility;
    this.type = payload.type;
    this.appointmentDate = payload.appointmentDate;
    this.courtOrderNumber = payload.courtOrderNumber;
    this.hasPropertyManagementPowers = payload.hasPropertyManagementPowers;
    this.canConsentToMedical = payload.canConsentToMedical;
    this.canConsentToMarriage = payload.canConsentToMarriage;
    this.restrictions = payload.restrictions;
    this.bondRequired = payload.bondRequired;
    this.bondAmountKES = payload.bondAmountKES;

    this.validate();
  }

  validate(): void {
    super.validate();

    if (!this.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.guardianId) throw new Error('Guardian ID is required');
    if (!this.guardianEligibility) throw new Error('Guardian eligibility information is required');
    if (!this.type) throw new Error('Guardian type is required');
    if (!this.appointmentDate) throw new Error('Appointment date is required');
  }
}
