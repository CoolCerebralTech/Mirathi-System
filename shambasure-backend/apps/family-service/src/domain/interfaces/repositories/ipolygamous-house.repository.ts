// domain/interfaces/repositories/ipolygamous-house.repository.ts
import { PolygamousHouse } from '../../entities/polygamous-house.entity';

export interface IPolygamousHouseRepository {
  /**
   * Core CRUD Operations
   */
  create(house: PolygamousHouse): Promise<PolygamousHouse>;
  findById(id: string): Promise<PolygamousHouse | null>;
  update(house: PolygamousHouse): Promise<PolygamousHouse>;
  delete(id: string): Promise<void>;
  softDelete(id: string, dissolutionDate: Date): Promise<void>;

  /**
   * Family Relationship Queries
   */
  findAllByFamilyId(familyId: string): Promise<PolygamousHouse[]>;
  countByFamilyId(familyId: string): Promise<number>;
  findActiveByFamilyId(familyId: string): Promise<PolygamousHouse[]>;
  findDissolvedByFamilyId(familyId: string): Promise<PolygamousHouse[]>;
  getFamilyHouseOrder(familyId: string, houseOrder: number): Promise<PolygamousHouse | null>;

  /**
   * S.40 LSA Compliance Queries (CRITICAL FOR KENYAN LAW)
   */
  findCertifiedUnderSection40(familyId: string): Promise<PolygamousHouse[]>;
  findNonCompliantHouses(familyId: string): Promise<PolygamousHouse[]>;
  findByCertificateNumber(certificateNumber: string): Promise<PolygamousHouse | null>;
  existsByCertificateNumber(certificateNumber: string): Promise<boolean>;
  findWithWivesConsent(familyId: string): Promise<PolygamousHouse[]>;
  findWithoutWivesConsent(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * House Head Management
   */
  findByHouseHeadId(houseHeadId: string): Promise<PolygamousHouse | null>;
  findHeadedByPersonId(personId: string): Promise<PolygamousHouse[]>;
  countHeadedByPersonId(personId: string): Promise<number>;
  updateHouseHead(houseId: string, newHeadId: string): Promise<void>;

  /**
   * Estate Distribution Queries (CRITICAL FOR S.40(2) CALCULATION)
   */
  findWithHouseSharePercentage(familyId: string): Promise<PolygamousHouse[]>;
  getTotalHouseShares(familyId: string): Promise<number>;
  findHousesWithSuccessionInstructions(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * Business & Property Management
   */
  findWithBusinessRegistration(familyId: string): Promise<PolygamousHouse[]>;
  findByBusinessKraPin(kraPin: string): Promise<PolygamousHouse | null>;
  findWithSeparateProperty(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * House Status Queries
   */
  findWithFrozenAssets(familyId: string): Promise<PolygamousHouse[]>;
  findWithoutHead(familyId: string): Promise<PolygamousHouse[]>;
  findCourtRecognizedHouses(familyId: string): Promise<PolygamousHouse[]>;
  findNonCourtRecognizedHouses(familyId: string): Promise<PolygamousHouse[]>;

  /**
   * Bulk Operations
   */
  batchSave(houses: PolygamousHouse[]): Promise<PolygamousHouse[]>;
  batchDissolveByFamilyId(familyId: string, dissolutionDate: Date): Promise<void>;
  batchFreezeAssetsByFamilyId(familyId: string): Promise<void>;
  batchUnfreezeAssetsByFamilyId(familyId: string): Promise<void>;

  /**
   * Validation & Existence Checks
   */
  existsByHouseName(familyId: string, houseName: string): Promise<boolean>;
  existsByHouseOrder(familyId: string, houseOrder: number): Promise<boolean>;
  validateHouseUniqueness(
    familyId: string,
    houseName: string,
    houseOrder: number,
  ): Promise<boolean>;
  hasActiveHouseForHead(houseHeadId: string): Promise<boolean>;

  /**
   * Statistics & Reporting
   */
  getHouseStatistics(familyId: string): Promise<{
    total: number;
    active: number;
    dissolved: number;
    certifiedS40: number;
    courtRecognized: number;
    withBusiness: number;
    withSuccessionInstructions: number;
    averageSharePercentage: number;
    complianceRate: number;
  }>;

  /**
   * S.40(2) Distribution Calculations
   */
  calculateHouseDistribution(familyId: string): Promise<
    Array<{
      houseId: string;
      houseName: string;
      houseOrder: number;
      sharePercentage: number;
      calculatedShare: number;
      isCertified: boolean;
      hasSuccessionInstructions: boolean;
    }>
  >;

  /**
   * Legal Compliance Reporting
   */
  getS40ComplianceReport(familyId: string): Promise<{
    totalHouses: number;
    compliantHouses: number;
    nonCompliantHouses: number;
    pendingHouses: number;
    missingCertificates: string[];
    missingWivesConsent: string[];
    housesWithoutHeads: string[];
  }>;

  /**
   * House Order Management
   */
  getNextHouseOrder(familyId: string): Promise<number>;
  reorderHouses(
    familyId: string,
    newOrderMapping: Array<{ houseId: string; newOrder: number }>,
  ): Promise<void>;

  /**
   * Search Operations
   */
  searchByName(familyId: string, name: string): Promise<PolygamousHouse[]>;
  findByBusinessName(familyId: string, businessName: string): Promise<PolygamousHouse[]>;
}
