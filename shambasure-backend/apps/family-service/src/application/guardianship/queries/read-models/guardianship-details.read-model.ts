// application/guardianship/queries/read-models/guardianship-details.read-model.ts
import { GuardianType } from '@prisma/client';

export class GuardianDetailsDto {
  guardianId: string;
  name: string; // Fetched from User/Person Service
  type: GuardianType;
  appointmentDate: Date;
  isActive: boolean;

  // Powers
  hasPropertyManagementPowers: boolean;
  canConsentToMedical: boolean;
  canConsentToMarriage: boolean;
  restrictions: string[];

  // Financials
  bondAmountKES?: number;
  annualAllowanceKES?: number;
}

export class GuardianshipDetailsReadModel {
  id: string;

  // Ward Info
  wardId: string;
  wardName: string; // Fetched from Family Service
  wardDateOfBirth: Date;
  wardCurrentAge: number;
  wardIsDeceased: boolean;
  wardIsIncapacitated: boolean;

  // Meta
  establishedDate: Date;
  status: 'ACTIVE' | 'DISSOLVED';
  dissolvedDate?: Date;
  dissolutionReason?: string;

  // Legal
  courtStation?: string;
  courtOrderNumber?: string;

  // Composition
  guardians: GuardianDetailsDto[];
  primaryGuardianId?: string;

  // Flags
  isCustomaryLaw: boolean;
  requiresBond: boolean;
  complianceWarnings: string[];
}
