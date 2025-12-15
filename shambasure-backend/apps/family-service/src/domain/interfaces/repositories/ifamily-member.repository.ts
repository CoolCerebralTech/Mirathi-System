import { FamilyMember } from '../../entities/family-member.entity';
import { KenyanIdentity } from '../../value-objects/identity/kenyan-identity.vo';

export interface IFamilyMemberRepository {
  // CRUD operations
  findById(id: string): Promise<FamilyMember | null>;
  save(member: FamilyMember): Promise<FamilyMember>;
  update(member: FamilyMember): Promise<FamilyMember>;
  delete(id: string): Promise<void>;
  softDelete(id: string, deletedBy: string, reason?: string): Promise<void>;

  // Identity queries
  findByIdentity(identity: KenyanIdentity): Promise<FamilyMember | null>;
  findByNationalId(nationalId: string): Promise<FamilyMember | null>;
  findByKraPin(kraPin: string): Promise<FamilyMember | null>;
  findByEmail(email: string): Promise<FamilyMember | null>;
  findByPhone(phoneNumber: string): Promise<FamilyMember | null>;
  findByUserId(userId: string): Promise<FamilyMember | null>;

  // Life status queries
  findLivingMembers(familyId: string): Promise<FamilyMember[]>;
  findDeceasedMembers(familyId: string): Promise<FamilyMember[]>;
  findMinors(familyId: string): Promise<FamilyMember[]>;
  findAdults(familyId: string): Promise<FamilyMember[]>;

  // Special categories
  findDependants(familyId: string): Promise<FamilyMember[]>;
  findMembersWithDisabilities(familyId: string): Promise<FamilyMember[]>;
  findMissingPersons(familyId: string): Promise<FamilyMember[]>;

  // Batch operations
  bulkCreate(members: FamilyMember[]): Promise<FamilyMember[]>;
  bulkUpdate(members: FamilyMember[]): Promise<FamilyMember[]>;

  // Verification
  verifyNationalId(memberId: string, verifiedBy: string): Promise<void>;
  verifyKraPin(memberId: string, verifiedBy: string): Promise<void>;

  // Death registration
  registerDeath(
    memberId: string,
    deathDetails: {
      dateOfDeath: Date;
      placeOfDeath?: string;
      deathCertificateNumber?: string;
    },
  ): Promise<void>;

  // Age calculations
  updateAgeCalculations(memberId: string): Promise<void>;

  // Search
  searchMembers(criteria: {
    familyId?: string;
    firstName?: string;
    lastName?: string;
    nationalId?: string;
    kraPin?: string;
    isDeceased?: boolean;
    isMinor?: boolean;
    disabilityStatus?: string;
  }): Promise<FamilyMember[]>;
}
