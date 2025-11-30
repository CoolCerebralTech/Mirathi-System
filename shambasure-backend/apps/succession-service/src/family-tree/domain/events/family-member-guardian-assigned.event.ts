import { GuardianAppointmentSource, GuardianType } from '@prisma/client';

export class FamilyMemberGuardianAssignedEvent {
  constructor(
    public readonly familyMemberId: string,
    public readonly familyId: string,
    public readonly guardianDetails: {
      guardianType: GuardianType;
      appointedBy: GuardianAppointmentSource;
      appointmentDate: Date;
      validUntil?: Date;
      courtOrderNumber?: string;

      // Additional context passed from Aggregate
      courtName?: string;
      caseNumber?: string;
      issuingJudge?: string;
      courtStation?: string;
      conditions?: string[];
      notes?: string;
    },
    public readonly timestamp: Date = new Date(),
  ) {}
}
