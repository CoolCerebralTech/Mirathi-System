import { Guardian } from '../../entities/guardian.entity';

export interface IGuardianshipRepository {
  // CRUD operations
  findById(id: string): Promise<Guardian | null>;
  save(guardian: Guardian): Promise<Guardian>;
  update(guardian: Guardian): Promise<Guardian>;
  delete(id: string): Promise<void>;

  // Query operations
  findByWardId(wardId: string): Promise<Guardian[]>;
  findByGuardianId(guardianId: string): Promise<Guardian[]>;
  findByFamilyId(familyId: string): Promise<Guardian[]>;
  findActiveGuardianships(familyId: string): Promise<Guardian[]>;
  findTerminatedGuardianships(familyId: string): Promise<Guardian[]>;

  // Kenyan LSA S.70-73 specific queries
  findTestamentaryGuardianships(familyId: string): Promise<Guardian[]>;
  findCourtAppointedGuardianships(familyId: string): Promise<Guardian[]>;
  findGuardiansWithBondRequirements(): Promise<Guardian[]>;
  findGuardiansWithOverdueReports(): Promise<Guardian[]>;

  // Court order tracking
  findByCourtOrderNumber(courtOrderNumber: string): Promise<Guardian | null>;

  // Bond management
  updateBondDetails(
    guardianshipId: string,
    bondDetails: {
      bondProvided: boolean;
      bondAmountKES?: number;
      bondProvider?: string;
      bondPolicyNumber?: string;
      bondExpiry?: Date;
    },
  ): Promise<void>;

  // Reporting S.73 LSA
  recordAnnualReport(
    guardianshipId: string,
    reportDetails: {
      reportDate: Date;
      reportContent: string;
      nextReportDue: Date;
    },
  ): Promise<void>;

  // Termination
  terminateGuardianship(
    guardianshipId: string,
    terminationDetails: {
      terminationDate: Date;
      terminationReason: string;
      courtOrderReference?: string;
    },
  ): Promise<void>;

  // Search
  searchGuardianships(criteria: {
    familyId?: string;
    wardId?: string;
    guardianId?: string;
    type?: string;
    isActive?: boolean;
    requiresBond?: boolean;
    reportStatus?: string;
  }): Promise<Guardian[]>;

  // Validation
  validateGuardianEligibility(
    guardianId: string,
    wardId: string,
  ): Promise<{
    eligible: boolean;
    reasons: string[];
  }>;
}
