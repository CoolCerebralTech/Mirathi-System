import { CohabitationRecord } from '../../entities/cohabitation-record.entity';

export interface ICohabitationRecordRepository {
  /**
   * Finds a CohabitationRecord by its unique ID.
   */
  findById(id: string): Promise<CohabitationRecord | null>;

  /**
   * Finds the most recent active cohabitation record between two partners.
   * This is essential for preventing duplicate active records.
   */
  findActiveByPartners(partner1Id: string, partner2Id: string): Promise<CohabitationRecord | null>;

  /**
   * Finds all cohabitation records (active and inactive) for a specific family.
   */
  findAllByFamilyId(familyId: string): Promise<CohabitationRecord[]>;

  /**
   * Finds all cohabitation records (active and inactive) a person has been a part of.
   */
  findAllByPartnerId(partnerId: string): Promise<CohabitationRecord[]>;

  /**
   * Saves a new or updated CohabitationRecord entity.
   * @param record The CohabitationRecord entity to save.
   * @param tx An optional transaction client.
   */
  save(record: CohabitationRecord, tx?: any): Promise<CohabitationRecord>;

  /**
   * Deletes a CohabitationRecord from the repository.
   */
  delete(id: string, tx?: any): Promise<void>;
}
