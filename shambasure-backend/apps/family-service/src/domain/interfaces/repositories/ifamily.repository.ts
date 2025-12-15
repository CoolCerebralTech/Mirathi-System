// domain/interfaces/repositories/ifamily.repository.ts
import { Family } from '../../aggregates/family.aggregate';

export interface IFamilyRepository {
  /**
   * Persists a Family Aggregate.
   * Handles both creation (insert) and updates.
   * Should run within a transaction if domain events are published.
   */
  save(family: Family): Promise<void>;

  /**
   * Finds a Family by its UUID.
   */
  findById(id: string): Promise<Family | null>;

  /**
   * Finds all families created by a specific user (Account Service link).
   */
  findByCreator(creatorUserId: string): Promise<Family[]>;

  /**
   * Finds the family that a specific member belongs to.
   * Useful when we only have a memberId (e.g., from a Succession Case).
   */
  findByMemberId(memberId: string): Promise<Family | null>;

  /**
   * Checks for potential duplicate families based on unique characteristics.
   * e.g., Same creator + Same family name.
   */
  exists(creatorId: string, name: string): Promise<boolean>;

  /**
   * Soft deletes a family.
   */
  delete(id: string): Promise<void>;
}
