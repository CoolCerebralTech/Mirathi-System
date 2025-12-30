// src/application/guardianship/queries/read-models/guardianship-details.read-model.ts
import { GuardianshipStatus } from '../../../../domain/aggregates/guardianship.aggregate';

export interface GuardianSummary {
  guardianId: string;
  name: string;
  role: string;
  isPrimary: boolean;
  status: string;
  contactPhone: string;
  relationshipToWard: string; // e.g., "Uncle"
}

export class GuardianshipDetailsReadModel {
  // Core Info
  public id: string;
  public caseNumber: string;
  public status: GuardianshipStatus;

  // Ward Info
  public ward: {
    id: string;
    name: string;
    age: number;
    dateOfBirth: Date;
    gender: string;
    photoUrl?: string;
  };

  // Legal Framework
  public legal: {
    type: string; // Testamentary vs Court
    jurisdiction: string;
    courtStation?: string;
    judgeName?: string;
    orderDate?: Date;
  };

  // People
  public guardians: GuardianSummary[];

  // Operational State
  public compliance: {
    score: number;
    lastReportDate?: Date;
    nextReportDue: Date;
    isBonded: boolean;
  };

  constructor(props: Partial<GuardianshipDetailsReadModel>) {
    Object.assign(this, props);
  }
}
