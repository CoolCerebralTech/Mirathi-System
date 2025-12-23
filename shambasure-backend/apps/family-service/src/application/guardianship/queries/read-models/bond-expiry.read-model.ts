// application/guardianship/queries/read-models/bond-expiry.read-model.ts
export class BondExpiryReadModel {
  guardianshipId: string;
  guardianId: string;
  guardianName: string;
  wardName: string;

  courtStation: string;
  caseNumber: string;

  bondProvider: string;
  bondPolicyNumber: string;
  bondAmountKES: number;

  expiryDate: Date;
  daysRemaining: number;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}
