import { Marriage } from '../../entities/marriage.entity';

export interface IMarriageRepository {
  // CRUD operations
  findById(id: string): Promise<Marriage | null>;
  save(marriage: Marriage): Promise<Marriage>;
  update(marriage: Marriage): Promise<Marriage>;
  delete(id: string): Promise<void>;

  // Query operations
  findByFamilyId(familyId: string): Promise<Marriage[]>;
  findBySpouseId(spouseId: string): Promise<Marriage[]>;
  findByPolygamousHouseId(houseId: string): Promise<Marriage[]>;
  findActiveMarriages(familyId: string): Promise<Marriage[]>;
  findDivorcedMarriages(familyId: string): Promise<Marriage[]>;
  findWidowedMarriages(familyId: string): Promise<Marriage[]>;

  // Validation queries
  findMarriageByRegistrationNumber(registrationNumber: string): Promise<Marriage | null>;
  findMarriagesByCertificateNumber(certificateNumber: string): Promise<Marriage[]>;

  // S.40 Polygamy compliance
  findPolygamousMarriages(familyId: string): Promise<Marriage[]>;
  countPolygamousMarriages(familyId: string): Promise<number>;

  // Customary marriage queries
  findCustomaryMarriages(familyId: string): Promise<Marriage[]>;
  findIslamicMarriages(familyId: string): Promise<Marriage[]>;

  // Cohabitation tracking
  findCohabitationRecords(partner1Id: string, partner2Id: string): Promise<Marriage[]>;

  // Status updates
  dissolveMarriage(
    marriageId: string,
    reason: string,
    details: {
      divorceDate?: Date;
      divorceDecreeNumber?: string;
      divorceCourt?: string;
    },
  ): Promise<void>;

  registerDeathOfSpouse(
    marriageId: string,
    deceasedSpouseId: string,
    deathDate: Date,
  ): Promise<void>;

  // Verification
  validateMarriageUnderKenyanLaw(marriage: Marriage): Promise<{
    isValid: boolean;
    reasons: string[];
  }>;

  // Search
  searchMarriages(criteria: {
    familyId?: string;
    spouse1Id?: string;
    spouse2Id?: string;
    marriageType?: string;
    isActive?: boolean;
    startDateFrom?: Date;
    startDateTo?: Date;
    polygamousHouseId?: string;
  }): Promise<Marriage[]>;
}
