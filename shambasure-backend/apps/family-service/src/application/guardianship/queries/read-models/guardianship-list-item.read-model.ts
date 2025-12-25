// src/application/guardianship/queries/read-models/guardianship-list-item.read-model.ts
import { GuardianshipStatus } from '../../../../domain/aggregates/guardianship.aggregate';

export class GuardianshipListItemReadModel {
  public id: string;
  public caseNumber: string;

  public wardName: string;
  public wardAge: number;

  public primaryGuardianName: string;

  public status: GuardianshipStatus;
  public riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  public nextComplianceDue: Date;
  public establishedDate: Date;

  constructor(props: Partial<GuardianshipListItemReadModel>) {
    Object.assign(this, props);
  }
}
