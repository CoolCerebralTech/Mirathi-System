// application/guardianship/queries/read-models/guardian-assignment.read-model.ts
import { GuardianType } from '@prisma/client';

export class GuardianAssignmentReadModel {
  guardianshipId: string;
  wardId: string;
  wardName: string;

  myRole: GuardianType;
  appointmentDate: Date;

  // What can I do?
  myPowers: {
    manageProperty: boolean;
    medicalConsent: boolean;
    marriageConsent: boolean;
  };

  // My specific obligations
  nextReportDue?: Date;
  bondExpiryDate?: Date;
  isBondValid: boolean;
}
