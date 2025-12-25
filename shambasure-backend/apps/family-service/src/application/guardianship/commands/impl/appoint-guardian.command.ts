// src/application/guardianship/commands/impl/appoint-guardian.command.ts
import {
  GuardianAppointmentSource,
  GuardianRole,
} from '../../../../domain/entities/guardian-assignment.entity';
import { BaseCommand } from '../../../common/base/base.command';
import { ICommand } from '../../../common/interfaces/use-case.interface';

export interface GuardianContactDto {
  primaryPhone: string;
  email?: string;
  physicalAddress: string;
  postalAddress?: string;
}

export interface GuardianPowersDto {
  canManageProperty: boolean;
  canMakeMedicalDecisions: boolean;
  canChooseEducation: boolean;
  canTravelInternationally: boolean;
  spendingLimitPerTransaction?: number;
}

export interface AppointGuardianDto {
  guardianshipId: string;

  // Guardian Identity (Links to Family Service)
  guardianMemberId: string;
  guardianName: string;
  relationshipToWard: string;

  // Role Configuration
  role: GuardianRole;
  isPrimary: boolean;
  appointmentSource: GuardianAppointmentSource;
  appointmentDate: Date;

  // Contact & Permissions
  contactInfo: GuardianContactDto;
  initialPowers: GuardianPowersDto;

  // Optional Metadata
  courtOrderReference?: string; // If specific to this appointment
  notes?: string;
}

export class AppointGuardianCommand extends BaseCommand implements ICommand {
  public readonly payload: AppointGuardianDto;

  constructor(
    props: AppointGuardianDto & {
      userId: string;
      correlationId?: string;
    },
  ) {
    super({
      userId: props.userId,
      correlationId: props.correlationId,
    });
    this.payload = props;
    this.validatePayload();
  }

  private validatePayload(): void {
    if (!this.payload.guardianshipId) throw new Error('Guardianship ID is required');
    if (!this.payload.guardianMemberId) throw new Error('Guardian Member ID is required');

    // Validate Appointment Date
    if (new Date(this.payload.appointmentDate) > new Date()) {
      throw new Error('Appointment date cannot be in the future');
    }

    // Role Validation
    if (
      this.payload.role === GuardianRole.PROPERTY_MANAGER &&
      !this.payload.initialPowers.canManageProperty
    ) {
      throw new Error('Property Manager role must have property management powers');
    }
  }
}
