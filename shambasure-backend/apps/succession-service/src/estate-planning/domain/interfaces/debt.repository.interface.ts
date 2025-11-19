import { DebtType } from '@prisma/client';
import { Debt } from '../entities/debt.entity';

export interface DebtRepositoryInterface {
  // ---------------------------------------------------------
  // Basic Persistence
  // ---------------------------------------------------------
  save(debt: Debt): Promise<void>;
  findById(id: string): Promise<Debt | null>;
  delete(id: string): Promise<void>; // Only if created in error

  // ---------------------------------------------------------
  // Standard Lookups
  // ---------------------------------------------------------
  findByOwnerId(ownerId: string): Promise<Debt[]>;

  /**
   * Find debts secured by a specific asset (e.g., Mortgage)
   */
  findByAssetId(assetId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // Payment Status Queries
  // ---------------------------------------------------------
  findOutstandingDebts(ownerId: string): Promise<Debt[]>;
  findPaidDebts(ownerId: string): Promise<Debt[]>;

  /**
   * Find debts that are overdue based on DueDate
   */
  findOverdueDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // Categorization Queries (For Priority Sorting)
  // ---------------------------------------------------------
  findByType(ownerId: string, type: DebtType): Promise<Debt[]>;

  /**
   * Specific query for Section 83 priority handling (Funeral/Taxes first)
   */
  findPriorityDebts(ownerId: string): Promise<Debt[]>;

  // ---------------------------------------------------------
  // Financials
  // ---------------------------------------------------------
  /**
   * Sum of all outstanding debt amounts, grouped by currency
   */
  getTotalLiabilities(ownerId: string): Promise<{ currency: string; amount: number }[]>;
}
