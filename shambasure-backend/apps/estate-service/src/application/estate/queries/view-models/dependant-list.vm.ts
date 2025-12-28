import {
  DependantRelationship,
  DependantStatus,
} from '../../../../domain/entities/legal-dependant.entity';
import { MoneyVM } from './estate-dashboard.vm';

export class DependantItemVM {
  id: string;
  name: string;
  relationship: DependantRelationship;
  status: DependantStatus;

  // Risk Factors
  isMinor: boolean;
  age?: number;
  isIncapacitated: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // Financials
  monthlyMaintenanceNeeds: MoneyVM;
  proposedAllocation?: MoneyVM;

  // Evidence
  evidenceCount: number;
  hasSufficientEvidence: boolean;
}

export class DependantListVM {
  items: DependantItemVM[];
  totalMonthlyNeeds: MoneyVM;
  highRiskCount: number; // For "Court Supervision" alerts
}
