import { Family } from '../../aggregates/family.aggregate';

export interface IFamilyRepository {
  /**
   * Core CRUD Operations
   */
  create(family: Family): Promise<Family>;
  findById(id: string): Promise<Family | null>;
  update(family: Family): Promise<Family>;
  delete(id: string, deletedBy: string, reason: string): Promise<void>;
  archive(id: string, deletedBy: string, reason: string): Promise<void>;
  unarchive(id: string): Promise<void>;

  /**
   * Query Operations Critical for Business Logic
   */
  findByCreatorId(creatorId: string): Promise<Family[]>;
  exists(id: string): Promise<boolean>;

  /**
   * Advanced Search & Filtering
   * Added to support SearchFamiliesQuery
   */
  findAll(criteria: Record<string, any>): Promise<Family[]>;
  count(criteria: Record<string, any>): Promise<number>;

  /**
   * Member Management Operations (Critical for Family aggregate)
   */
  addMember(familyId: string, memberId: string): Promise<void>;
  removeMember(familyId: string, memberId: string): Promise<void>;
  getMemberIds(familyId: string): Promise<string[]>;

  /**
   * Marriage Management Operations (Critical for S.40 compliance)
   */
  addMarriage(familyId: string, marriageId: string): Promise<void>;
  removeMarriage(familyId: string, marriageId: string): Promise<void>;

  /**
   * Polygamous House Management (Critical for S.40 compliance)
   */
  addPolygamousHouse(familyId: string, houseId: string): Promise<void>;
  removePolygamousHouse(familyId: string, houseId: string): Promise<void>;

  /**
   * Search Operations (Basic but necessary for UX)
   */
  searchByName(name: string): Promise<Family[]>;
  findByCounty(county: string): Promise<Family[]>;

  /**
   * Concurrency Control (Critical for event sourcing)
   */
  saveWithOptimisticLocking(family: Family, expectedVersion: number): Promise<Family>;

  /**
   * Bulk Operations for Performance (Critical for system efficiency)
   */
  recalculateFamilyCounts(familyId: string): Promise<void>;
  batchUpdateMemberStatus(
    familyId: string,
    updates: Array<{ memberId: string; isDeceased: boolean }>,
  ): Promise<void>;
}
