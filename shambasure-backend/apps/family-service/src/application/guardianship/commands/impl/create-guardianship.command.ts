// application/guardianship/commands/impl/create-guardianship.command.ts
import { GuardianType } from '@prisma/client';

import {
  CustomaryLawDetails,
  GuardianEligibilityInfo,
  WardInfo,
} from '../../../../domain/aggregates/guardianship.aggregate';
import { BaseCommand } from '../base.command';

/**
 * Payload interface for creating a guardianship.
 * Groups all business data into a single object.
 */
export interface CreateGuardianshipCommandPayload {
  wardInfo: WardInfo;
  guardianId: string;
  guardianEligibility: GuardianEligibilityInfo;
  type: GuardianType;
  appointmentDate: Date;

  // Optional Legal Details
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;

  // Powers
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: string[];
  specialInstructions?: string;

  // Financials & Bond
  bondRequired?: boolean;
  bondAmountKES?: number;
  annualAllowanceKES?: number;

  // Customary Law
  customaryLawApplies?: boolean;
  customaryDetails?: CustomaryLawDetails;
}

export class CreateGuardianshipCommand extends BaseCommand {
  public readonly wardInfo: WardInfo;
  public readonly guardianId: string;
  public readonly guardianEligibility: GuardianEligibilityInfo;
  public readonly type: GuardianType;
  public readonly appointmentDate: Date;
  public readonly courtOrderNumber?: string;
  public readonly courtStation?: string;
  public readonly validUntil?: Date;
  public readonly hasPropertyManagementPowers?: boolean;
  public readonly canConsentToMedical?: boolean;
  public readonly canConsentToMarriage?: boolean;
  public readonly restrictions?: string[];
  public readonly specialInstructions?: string;
  public readonly bondRequired?: boolean;
  public readonly bondAmountKES?: number;
  public readonly annualAllowanceKES?: number;
  public readonly customaryLawApplies?: boolean;
  public readonly customaryDetails?: CustomaryLawDetails;

  constructor(
    payload: CreateGuardianshipCommandPayload,
    baseProps: { userId: string; correlationId?: string; causationId?: string },
  ) {
    super(baseProps);

    // Assignment
    this.wardInfo = payload.wardInfo;
    this.guardianId = payload.guardianId;
    this.guardianEligibility = payload.guardianEligibility;
    this.type = payload.type;
    this.appointmentDate = payload.appointmentDate;
    this.courtOrderNumber = payload.courtOrderNumber;
    this.courtStation = payload.courtStation;
    this.validUntil = payload.validUntil;
    this.hasPropertyManagementPowers = payload.hasPropertyManagementPowers;
    this.canConsentToMedical = payload.canConsentToMedical;
    this.canConsentToMarriage = payload.canConsentToMarriage;
    this.restrictions = payload.restrictions;
    this.specialInstructions = payload.specialInstructions;
    this.bondRequired = payload.bondRequired;
    this.bondAmountKES = payload.bondAmountKES;
    this.annualAllowanceKES = payload.annualAllowanceKES;
    this.customaryLawApplies = payload.customaryLawApplies;
    this.customaryDetails = payload.customaryDetails;

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

    // Fail-fast validation (Domain will double-check, but good to catch early)
    if (this.guardianId === this.wardInfo.wardId) {
      throw new Error('A person cannot be their own guardian');
    }
  }
}
