import { GuardianAppointmentSource, GuardianType } from '@prisma/client';

export class GuardianAssignedEvent {
  constructor(
    public readonly familyId: string,
    public readonly guardianDetails: {
      guardianId: string;
      wardId: string;
      type: GuardianType;
      appointedBy: GuardianAppointmentSource;
      appointmentDate: Date;
      validUntil?: Date;

      // Kenyan Court / Legal Fields
      courtOrderNumber?: string;
      courtName?: string;
      caseNumber?: string;
      issuingJudge?: string;
      courtStation?: string;

      // Conditions & Meta
      conditions?: string[];
      reportingRequirements?: string[];
      isTemporary?: boolean;
      notes?: string;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
