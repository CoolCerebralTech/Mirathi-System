// src/family-service/src/domain/interfaces/iguardianship.repository.ts
import {
  BondOverallStatus,
  GuardianshipAggregate,
  GuardianshipStatus,
} from '../aggregates/guardianship.aggregate';
import { DomainEvent } from '../base/domain-event';

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

export interface GuardianshipSearchFilters {
  // Ward
  wardId?: string;
  wardIds?: string[];
  wardIsMinor?: boolean;

  // Guardian
  guardianId?: string;
  guardianIsPrimary?: boolean;

  // Status & Lifecycle
  status?: GuardianshipStatus | GuardianshipStatus[];
  establishedDate?: { from?: Date; to?: Date };
  terminationDate?: { from?: Date; to?: Date };

  // Compliance & Risk
  bondStatus?: BondOverallStatus | BondOverallStatus[];
  hasOverdueCompliance?: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  // Legal
  courtOrderExists?: boolean;
  caseNumber?: string;
  jurisdiction?: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';
  courtStation?: string;

  // Text Search
  searchText?: string;
}

export interface GuardianshipSortOptions {
  field: 'establishedDate' | 'wardName' | 'status' | 'nextComplianceDue';
  direction: 'ASC' | 'DESC';
}

export interface ComplianceStatistics {
  totalGuardianships: number;
  activeCount: number;
  terminatedCount: number;
  bondComplianceRate: number;
  reportComplianceRate: number;
  overdueCount: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

// ============================================================================
// Repository Interface
// ============================================================================

export interface IGuardianshipRepository {
  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  save(guardianship: GuardianshipAggregate): Promise<GuardianshipAggregate>;

  saveMany(guardianships: GuardianshipAggregate[]): Promise<BulkOperationResult>;

  softDelete(id: string, deletedBy: string, reason: string): Promise<void>;

  // --------------------------------------------------------------------------
  // Core Queries
  // --------------------------------------------------------------------------

  findById(id: string): Promise<GuardianshipAggregate | null>;

  findActiveByWardId(wardId: string): Promise<GuardianshipAggregate | null>;

  findAllByWardId(wardId: string): Promise<GuardianshipAggregate[]>;

  findByGuardianId(guardianId: string, activeOnly?: boolean): Promise<GuardianshipAggregate[]>;

  findByCourtCaseNumber(caseNumber: string): Promise<GuardianshipAggregate | null>;

  // --------------------------------------------------------------------------
  // Search & Reporting
  // --------------------------------------------------------------------------

  search(
    filters: GuardianshipSearchFilters,
    pagination: PaginationOptions,
    sort?: GuardianshipSortOptions,
  ): Promise<PaginatedResult<GuardianshipAggregate>>;

  count(filters: GuardianshipSearchFilters): Promise<number>;

  // --------------------------------------------------------------------------
  // Compliance & Risk Analysis
  // --------------------------------------------------------------------------

  findWithOverdueCompliance(): Promise<GuardianshipAggregate[]>;

  findWithBondIssues(): Promise<GuardianshipAggregate[]>;

  findHighRiskGuardianships(riskThreshold?: 'HIGH' | 'CRITICAL'): Promise<GuardianshipAggregate[]>;

  findWardsApproachingMajority(withinDays: number): Promise<GuardianshipAggregate[]>;

  getComplianceStatistics(courtStation?: string): Promise<ComplianceStatistics>;

  // --------------------------------------------------------------------------
  // Event Sourcing & Audit
  // --------------------------------------------------------------------------

  getEventHistory(id: string): Promise<DomainEvent[]>;

  rebuildFromEvents(id: string, version?: number): Promise<GuardianshipAggregate | null>;
}

// ============================================================================
// Constants & Exceptions
// ============================================================================

export const GUARDIANSHIP_REPOSITORY = 'GUARDIANSHIP_REPOSITORY';

export class GuardianshipNotFoundException extends Error {
  constructor(id: string) {
    super(`Guardianship with ID ${id} not found`);
    this.name = 'GuardianshipNotFoundException';
  }
}

export class ConcurrencyException extends Error {
  constructor(id: string, expected: number, actual: number) {
    super(`Concurrency conflict for Guardianship ${id}. Expected v${expected}, got v${actual}`);
    this.name = 'ConcurrencyException';
  }
}
