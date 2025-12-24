// src/family-service/src/domain/interfaces/ifamily.repository.ts
import { FamilyAggregate } from '../aggregates/family.aggregate';
import { DomainEvent } from '../base/domain-event';
import { KenyanCounty } from '../value-objects/family-enums.vo';

// ============================================================================
// DTOs & Search Interfaces
// ============================================================================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  includeCount?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FamilySearchFilters {
  // Core Identity
  searchText?: string; // Names, description
  creatorId?: string;

  // Cultural Context
  clanName?: string;
  subClan?: string;
  homeCounty?: KenyanCounty;

  // Structure
  isPolygamous?: boolean;
  minMembers?: number;
  hasAdoptions?: boolean;
  hasCohabitations?: boolean;

  // Legal & Status
  hasConflicts?: boolean;
  verificationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  // Date Ranges
  createdAfter?: Date;
  updatedAfter?: Date;
}

export interface FamilySortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'memberCount' | 'complexityScore';
  direction: 'ASC' | 'DESC';
}

/**
 * Lightweight projection for list views
 */
export interface FamilySummary {
  id: string;
  name: string;
  description?: string;
  headOfFamily?: string; // Computed name
  memberCount: number;
  isPolygamous: boolean;
  clanName?: string;
  homeCounty?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analytical statistics for system dashboards
 */
export interface FamilySystemStatistics {
  totalFamilies: number;
  totalMembers: number;

  // Structure Stats
  polygamousFamilies: number;
  monogamousFamilies: number;
  averageFamilySize: number;

  // Cultural Stats
  familiesByCounty: Record<string, number>;
  topClans: Array<{ name: string; count: number }>;

  // Legal Stats
  familiesWithAdoptions: number;
  familiesWithCohabitation: number;
  familiesWithConflicts: number;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

export interface FamilyExportOptions {
  format: 'JSON' | 'CSV' | 'GEDCOM' | 'PDF';
  includeEvents?: boolean;
  includePrivateNotes?: boolean;
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface IFamilyRepository {
  // --------------------------------------------------------------------------
  // Persistence (Command Side)
  // --------------------------------------------------------------------------

  /**
   * Persist the family aggregate and all child entities
   */
  save(family: FamilyAggregate): Promise<FamilyAggregate>;

  /**
   * Batch persistence for imports or migrations
   */
  saveMany(families: FamilyAggregate[]): Promise<BulkOperationResult>;

  /**
   * Soft delete a family tree
   */
  softDelete(id: string, deletedBy: string, reason: string): Promise<void>;

  // --------------------------------------------------------------------------
  // Core Queries (Query Side)
  // --------------------------------------------------------------------------

  /**
   * Find family by unique ID
   * @param depth 0=Root, 1=Members, 2=Full Graph
   */
  findById(id: string, depth?: number): Promise<FamilyAggregate | null>;

  /**
   * Find the family that a specific member belongs to
   */
  findByMemberId(memberId: string): Promise<FamilyAggregate | null>;

  /**
   * Find families created by a specific user
   */
  findByCreatorId(creatorId: string): Promise<FamilyAggregate[]>;

  /**
   * Check if a family exists by name within a specific county (duplicate check)
   */
  existsByNameAndCounty(name: string, county: KenyanCounty): Promise<boolean>;

  // --------------------------------------------------------------------------
  // Search & Discovery
  // --------------------------------------------------------------------------

  search(
    filters: FamilySearchFilters,
    pagination: PaginationOptions,
    sort?: FamilySortOptions,
  ): Promise<PaginatedResult<FamilySummary>>;

  count(filters: FamilySearchFilters): Promise<number>;

  // --------------------------------------------------------------------------
  // Legal & Structural Analysis Support
  // --------------------------------------------------------------------------

  /**
   * Find families marked as polygamous for S.40 compliance audits
   */
  findPolygamousFamilies(pagination: PaginationOptions): Promise<PaginatedResult<FamilyAggregate>>;

  /**
   * Find families with potential lineage cycles or data conflicts
   */
  findFamiliesWithConflicts(): Promise<FamilyAggregate[]>;

  /**
   * Find families with pending S.29 dependency claims (Cohabitation/Adoption)
   */
  findFamiliesWithPendingSuccessionClaims(): Promise<FamilyAggregate[]>;

  // --------------------------------------------------------------------------
  // Analytics & Statistics
  // --------------------------------------------------------------------------

  getSystemStatistics(): Promise<FamilySystemStatistics>;

  // --------------------------------------------------------------------------
  // Event Sourcing & Audit
  // --------------------------------------------------------------------------

  getEventHistory(id: string): Promise<DomainEvent[]>;

  rebuildFromEvents(id: string, version?: number): Promise<FamilyAggregate | null>;

  // --------------------------------------------------------------------------
  // Import / Export
  // --------------------------------------------------------------------------

  exportFamily(id: string, options: FamilyExportOptions): Promise<Buffer>;
}

// ============================================================================
// Constants & Exceptions
// ============================================================================

export const FAMILY_REPOSITORY = 'FAMILY_REPOSITORY';

export class FamilyNotFoundException extends Error {
  constructor(id: string) {
    super(`Family tree with ID ${id} not found`);
    this.name = 'FamilyNotFoundException';
  }
}

export class FamilyConcurrencyException extends Error {
  constructor(id: string, expected: number, actual: number) {
    super(`Concurrency conflict for Family ${id}. Expected v${expected}, got v${actual}`);
    this.name = 'FamilyConcurrencyException';
  }
}

export class DuplicateFamilyException extends Error {
  constructor(name: string, county: string) {
    super(`Family '${name}' already exists in ${county}`);
    this.name = 'DuplicateFamilyException';
  }
}
