// domain/interfaces/repositories/iadoption-order.repository.ts
import { AdoptionOrder } from '../../entities/adoption-order.entity';

export interface IAdoptionOrderRepository {
  /**
   * Core CRUD Operations
   */
  create(adoptionOrder: AdoptionOrder): Promise<AdoptionOrder>;
  findById(id: string): Promise<AdoptionOrder | null>;
  update(adoptionOrder: AdoptionOrder): Promise<AdoptionOrder>;
  delete(id: string): Promise<void>;

  /**
   * Legal & Compliance Queries (Critical for Kenyan Law)
   */
  findByCourtOrderNumber(orderNumber: string): Promise<AdoptionOrder | null>;
  existsByCourtOrderNumber(orderNumber: string): Promise<boolean>;
  findAllByFamilyId(familyId: string): Promise<AdoptionOrder[]>;

  /**
   * Person-Centric Queries (Critical for inheritance calculations)
   */
  findAllByAdopteeId(adopteeId: string): Promise<AdoptionOrder[]>;
  findAllByAdopterId(adopterId: string): Promise<AdoptionOrder[]>;
  findActiveAdoptionForAdoptee(adopteeId: string): Promise<AdoptionOrder | null>;

  /**
   * Adoption Type Queries (Critical for legal differentiation)
   */
  findAllByAdoptionType(adoptionType: string): Promise<AdoptionOrder[]>;
  findStatutoryAdoptions(familyId: string): Promise<AdoptionOrder[]>;
  findCustomaryAdoptions(familyId: string): Promise<AdoptionOrder[]>;

  /**
   * Status & Compliance Queries
   */
  findFinalizedAdoptions(familyId: string): Promise<AdoptionOrder[]>;
  findPendingAdoptions(familyId: string): Promise<AdoptionOrder[]>;

  /**
   * Bulk Operations for Family Aggregates
   */
  batchSave(adoptionOrders: AdoptionOrder[]): Promise<AdoptionOrder[]>;
  batchDeleteByFamilyId(familyId: string): Promise<void>;

  /**
   * Validation Queries
   */
  hasActiveAdoption(adopteeId: string, adopterId: string): Promise<boolean>;
  validateAdoptionUniqueness(
    familyId: string,
    adopteeId: string,
    adopterId: string,
  ): Promise<boolean>;

  /**
   * Count Operations for Reporting
   */
  countByFamilyId(familyId: string): Promise<number>;
  countByAdoptionType(familyId: string, adoptionType: string): Promise<number>;
  countFinalizedAdoptions(familyId: string): Promise<number>;
}
