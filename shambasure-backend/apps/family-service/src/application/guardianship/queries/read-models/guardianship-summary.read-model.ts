// application/guardianship/queries/read-models/guardianship-summary.read-model.ts
import { GuardianType } from '@prisma/client';

export class GuardianshipSummaryReadModel {
  id: string;
  wardId: string;
  wardName: string; // Projected/Cached
  primaryGuardianName: string; // Projected/Cached
  guardianType: GuardianType;

  courtStation: string;
  establishedDate: Date;
  status: 'ACTIVE' | 'DISSOLVED' | 'PENDING';

  // Quick Indicators for UI Badges
  isS72Compliant: boolean; // Bond
  isS73Compliant: boolean; // Reports
  activeWarningsCount: number;
}
