// application/guardianship/commands/impl/appoint-guardian.command.ts
import { GuardianType } from '@prisma/client';

import { Command } from '../base.command';

export interface AppointGuardianCommandProps {
  wardId: string;
  guardianId: string;
  type: GuardianType;
  appointmentDate: Date;

  // Legal details
  courtOrderNumber?: string;
  courtStation?: string;
  validUntil?: Date;
  guardianIdNumber?: string;
  courtCaseNumber?: string;
  interimOrderId?: string;

  // Powers
  hasPropertyManagementPowers?: boolean;
  canConsentToMedical?: boolean;
  canConsentToMarriage?: boolean;
  restrictions?: Record<string, any>;
  specialInstructions?: string;

  // Bond
  bondRequired?: boolean;
  bondAmountKES?: number;

  // Allowances
  annualAllowanceKES?: number;

  // Metadata
  correlationId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export class AppointGuardianCommand extends Command<AppointGuardianCommandProps> {
  constructor(props: AppointGuardianCommandProps) {
    super(props);
  }

  getCommandName(): string {
    return 'AppointGuardianCommand';
  }

  get wardId(): string {
    return this.props.wardId;
  }

  get guardianId(): string {
    return this.props.guardianId;
  }

  get type(): GuardianType {
    return this.props.type;
  }

  get appointmentDate(): Date {
    return this.props.appointmentDate;
  }

  // Helper method to validate command
  validate(): string[] {
    const errors: string[] = [];

    if (!this.wardId) errors.push('Ward ID is required');
    if (!this.guardianId) errors.push('Guardian ID is required');
    if (!this.type) errors.push('Guardian type is required');
    if (!this.appointmentDate) errors.push('Appointment date is required');

    // Kenyan legal requirements
    if (this.type === GuardianType.COURT_APPOINTED && !this.props.courtOrderNumber) {
      errors.push('Court order number is required for court-appointed guardians');
    }

    if (this.props.bondRequired && !this.props.bondAmountKES) {
      errors.push('Bond amount is required when bond is required');
    }

    return errors;
  }
}
