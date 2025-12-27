import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

/**
 * Data Transfer Object for Advanced Will Search.
 *
 * USE CASE:
 * Used by the Court Registry, Lawyers, or Admins to find wills based on
 * specific criteria (e.g., "Find all revoked wills from 2024").
 */
export interface WillSearchDto {
  // --- IDENTITY FILTERS ---
  testatorId?: string;
  testatorName?: string; // Partial match
  probateCaseNumber?: string;

  // --- STATUS FILTERS ---
  status?: WillStatus | WillStatus[];
  type?: WillType | WillType[];
  isRevoked?: boolean;
  isValid?: boolean; // Filter by internal validation state

  // --- DATE RANGES ---
  createdFrom?: Date;
  createdTo?: Date;
  executedFrom?: Date;
  executedTo?: Date;
  revokedFrom?: Date;
  revokedTo?: Date;

  // --- STRUCTURAL FILTERS (Risk Analysis) ---
  hasCodicils?: boolean;
  hasDisinheritanceRecords?: boolean;
  minWitnessCount?: number; // e.g., Find wills with < 2 witnesses (Risk)

  // --- PAGINATION & SORTING ---
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'executionDate' | 'testatorName' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}
