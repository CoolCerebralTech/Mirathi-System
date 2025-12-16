// domain/interfaces/repositories/ifamily-member.repository.ts
import { FamilyMember } from '../../entities/family-member.entity';

export interface FamilyMemberQueryCriteria {
  familyId?: string;
  isDeceased?: boolean;
  isMinor?: boolean;
  hasDisability?: boolean;
  isMissing?: boolean;
  isArchived?: boolean;
  isActive?: boolean;
  isEligibleForInheritance?: boolean;
  isPotentialDependant?: boolean;
  isIdentityVerified?: boolean;
  gender?: string;
  religion?: string;
  ethnicity?: string;
  polygamousHouseId?: string;
}

export interface IFamilyMemberRepository {
  /**
   * Core CRUD Operations
   */
  create(familyMember: FamilyMember): Promise<FamilyMember>;
  findById(id: string): Promise<FamilyMember | null>;
  update(familyMember: FamilyMember): Promise<FamilyMember>;
  delete(id: string): Promise<void>;
  archive(id: string, deletedBy: string, reason: string): Promise<void>;
  unarchive(id: string): Promise<void>;

  /**
   * Identity & Verification Queries (Critical for Legal Compliance)
   */
  findByNationalId(nationalId: string): Promise<FamilyMember | null>;
  findByUserId(userId: string): Promise<FamilyMember | null>;
  findByKraPin(kraPin: string): Promise<FamilyMember | null>;
  findByDeathCertificateNumber(certificateNumber: string): Promise<FamilyMember | null>;
  findWithVerifiedIdentity(familyId: string): Promise<FamilyMember[]>;
  findWithUnverifiedIdentity(familyId: string): Promise<FamilyMember[]>;

  /**
   * Family-Centric Queries
   */
  findAllByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findAllByFamilyIdWithStatus(familyId: string, includeArchived?: boolean): Promise<FamilyMember[]>;
  countByFamilyId(familyId: string): Promise<number>;

  /**
   * Life Status Queries (Critical for Estate Distribution)
   */
  findLivingByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findDeceasedByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findMissingByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findActiveByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findInactiveByFamilyId(familyId: string): Promise<FamilyMember[]>;

  /**
   * S.29 Dependant Queries (Critical for Inheritance Claims)
   */
  findPotentialS29Dependants(familyId: string): Promise<FamilyMember[]>;
  findMinorsByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findWithDisabilityByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findStudentsByFamilyId(familyId: string, maxAge?: number): Promise<FamilyMember[]>;
  findDependantEligibleMembers(familyId: string): Promise<FamilyMember[]>;

  /**
   * S.40 Polygamous Family Queries (Critical for Islamic/Customary Law)
   */
  findPolygamousHouseMembers(houseId: string): Promise<FamilyMember[]>;
  findPolygamousHouseHead(houseId: string): Promise<FamilyMember | null>;
  findPolygamousHeadsByFamilyId(familyId: string): Promise<FamilyMember[]>;
  findWivesByHouseId(houseId: string): Promise<FamilyMember[]>;
  findChildrenByHouseId(houseId: string): Promise<FamilyMember[]>;

  /**
   * Demographic & Category Queries
   */
  findByGender(familyId: string, gender: string): Promise<FamilyMember[]>;
  findByReligion(familyId: string, religion: string): Promise<FamilyMember[]>;
  findByEthnicity(familyId: string, ethnicity: string): Promise<FamilyMember[]>;
  findByAgeRange(familyId: string, minAge: number, maxAge: number): Promise<FamilyMember[]>;

  /**
   * Bulk Operations for Performance
   */
  saveMany(members: FamilyMember[]): Promise<FamilyMember[]>;
  batchUpdateStatus(
    updates: Array<{ id: string; isDeceased: boolean; dateOfDeath?: Date }>,
  ): Promise<void>;
  batchArchive(memberIds: string[], deletedBy: string, reason: string): Promise<void>;

  /**
   * Validation & Existence Checks
   */
  existsById(id: string): Promise<boolean>;
  existsByNationalId(nationalId: string): Promise<boolean>;
  existsByUserId(userId: string): Promise<boolean>;
  existsByKraPin(kraPin: string): Promise<boolean>;
  isMemberOfFamily(memberId: string, familyId: string): Promise<boolean>;
  validateFamilyMemberUniqueness(
    familyId: string,
    nationalId?: string,
    kraPin?: string,
    userId?: string,
  ): Promise<boolean>;

  /**
   * Statistics & Counts for Reporting
   */
  getFamilyMemberStatistics(familyId: string): Promise<{
    total: number;
    living: number;
    deceased: number;
    minors: number;
    withDisability: number;
    missing: number;
    archived: number;
    identityVerified: number;
    potentialDependants: number;
    polygamousHeads: number;
    averageAge: number;
  }>;

  /**
   * Inheritance & Legal Eligibility Queries
   */
  findInheritanceEligibleMembers(familyId: string): Promise<FamilyMember[]>;
  findExcludedFromInheritance(familyId: string): Promise<FamilyMember[]>;
  findWithDeathCertificates(familyId: string): Promise<FamilyMember[]>;
  findWithoutDeathCertificates(familyId: string): Promise<FamilyMember[]>;

  /**
   * Search & Advanced Filtering
   */
  searchByName(familyId: string, name: string): Promise<FamilyMember[]>;
  findAll(criteria: FamilyMemberQueryCriteria): Promise<FamilyMember[]>;
  findByOccupation(familyId: string, occupation: string): Promise<FamilyMember[]>;

  /**
   * Relationship & Connectivity Queries
   */
  findImmediateFamily(familyMemberId: string): Promise<{
    spouses: FamilyMember[];
    children: FamilyMember[];
    parents: FamilyMember[];
    siblings: FamilyMember[];
  }>;

  /**
   * Concurrency & Version Control
   */
  saveWithOptimisticLocking(
    familyMember: FamilyMember,
    expectedVersion: number,
  ): Promise<FamilyMember>;

  /**
   * Polygamy-Specific Queries
   */
  findWivesWithMultipleHouses(familyId: string): Promise<FamilyMember[]>;
  findHeirsByPolygamousHouse(houseId: string): Promise<FamilyMember[]>;

  /**
   * Customary Law Queries
   */
  findCustomaryLawApplicable(familyId: string): Promise<FamilyMember[]>;
  findIslamicInheritanceApplicable(familyId: string): Promise<FamilyMember[]>;

  /**
   * Audit & Compliance Queries
   */
  findMembersRequiringIdentityVerification(familyId: string): Promise<FamilyMember[]>;
  findMembersWithMissingCriticalData(familyId: string): Promise<FamilyMember[]>;
}
