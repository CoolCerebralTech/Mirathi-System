import { DependantEvidence } from '@prisma/client';

import { LegalDependant } from '../../entities/legal-dependant.entity';

export interface IDependancyRepository {
  // CRUD operations
  findById(id: string): Promise<LegalDependant | null>;
  save(dependant: LegalDependant): Promise<LegalDependant>;
  update(dependant: LegalDependant): Promise<LegalDependant>;
  delete(id: string): Promise<void>;

  // Query operations
  findByDeceasedId(deceasedId: string): Promise<LegalDependant[]>;
  findByDependantId(dependantId: string): Promise<LegalDependant[]>;
  findByFamilyId(familyId: string): Promise<LegalDependant[]>;
  findClaimants(deceasedId: string): Promise<LegalDependant[]>;
  findMinorDependants(deceasedId: string): Promise<LegalDependant[]>;
  findDisabledDependants(deceasedId: string): Promise<LegalDependant[]>;

  // S.29 LSA specific queries
  findByKenyanLawSection(section: string): Promise<LegalDependant[]>;
  findWithCourtProvisionOrders(): Promise<LegalDependant[]>;

  // Evidence management
  addDependantEvidence(
    dependantId: string,
    evidence: {
      evidenceType: string;
      documentId?: string;
      verifiedBy?: string;
    },
  ): Promise<DependantEvidence>;

  getDependantEvidences(dependantId: string): Promise<DependantEvidence[]>;
  verifyDependantEvidence(evidenceId: string, verifiedBy: string): Promise<void>;

  // Dependency assessment
  assessDependency(
    dependantId: string,
    assessment: {
      dependencyPercentage: number;
      assessmentMethod: string;
      monthlySupport?: number;
      ageLimit?: number;
      specialCircumstances?: string;
    },
  ): Promise<void>;

  // Court provision tracking
  recordCourtProvision(
    dependantId: string,
    provisionDetails: {
      provisionAmount: number;
      courtOrderNumber: string;
      courtOrderDate: Date;
      currency?: string;
    },
  ): Promise<void>;

  // Custodial parent management
  updateCustodialParent(dependantId: string, custodialParentId: string): Promise<void>;

  // Student dependency
  updateStudentStatus(dependantId: string, isStudent: boolean, studentUntil?: Date): Promise<void>;

  // Search
  searchDependants(criteria: {
    deceasedId?: string;
    dependantId?: string;
    dependencyLevel?: string;
    isClaimant?: boolean;
    hasCourtProvision?: boolean;
    isMinor?: boolean;
    hasDisability?: boolean;
  }): Promise<LegalDependant[]>;

  // Statistics
  getDependencyStatistics(deceasedId: string): Promise<{
    totalDependants: number;
    minorDependants: number;
    disabledDependants: number;
    studentDependants: number;
    totalProvisionAmount: number;
    claimantsCount: number;
  }>;
}
