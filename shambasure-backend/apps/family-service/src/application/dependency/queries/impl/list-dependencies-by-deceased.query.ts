// application/dependency/queries/impl/list-dependencies-by-deceased.query.ts
import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { PaginatedQuery, SortDirection } from '../base.query';

export enum DependencyStatus {
  ALL = 'ALL',
  PENDING = 'PENDING',
  ASSESSED = 'ASSESSED',
  WITH_COURT_ORDER = 'WITH_COURT_ORDER',
  WITHOUT_COURT_ORDER = 'WITHOUT_COURT_ORDER',
  S29_COMPLIANT = 'S29_COMPLIANT',
  NON_S29_COMPLIANT = 'NON_S29_COMPLIANT',
  HAS_S26_CLAIM = 'HAS_S26_CLAIM',
  NO_S26_CLAIM = 'NO_S26_CLAIM',
}

export enum DependencyBasisFilter {
  ALL = 'ALL',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  ADOPTED_CHILD = 'ADOPTED_CHILD',
  EX_SPOUSE = 'EX_SPOUSE',
  COHABITOR = 'COHABITOR',
}

export class ListDependenciesByDeceasedQuery extends PaginatedQuery {
  @IsString()
  deceasedId: string;

  @IsOptional()
  @IsEnum(DependencyStatus)
  status: DependencyStatus = DependencyStatus.ALL;

  @IsOptional()
  @IsEnum(DependencyBasisFilter)
  basis: DependencyBasisFilter = DependencyBasisFilter.ALL;

  @IsOptional()
  @IsEnum(DependencyLevel)
  dependencyLevel?: DependencyLevel;

  @IsOptional()
  @IsBoolean()
  isMinor?: boolean;

  @IsOptional()
  @IsBoolean()
  isStudent?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDisability?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCourtOrder?: boolean;

  @IsOptional()
  @IsBoolean()
  isClaimant?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minDependencyPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDependencyPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minClaimAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxClaimAmount?: number;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsDateString()
  updatedAfter?: string;

  @IsOptional()
  @IsDateString()
  updatedBefore?: string;

  @IsOptional()
  @IsDateString()
  courtOrderAfter?: string;

  @IsOptional()
  @IsDateString()
  courtOrderBefore?: string;

  // Evidence filters
  @IsOptional()
  @IsBoolean()
  hasEvidence?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minEvidenceDocuments?: number;

  // Search by dependant name or ID (if available)
  @IsOptional()
  @IsString()
  searchTerm?: string;

  // Include related data
  @IsOptional()
  @IsBoolean()
  includeDependantDetails: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeCourtOrderDetails: boolean = false;

  // Sort options (override base)
  @IsOptional()
  @IsEnum(['dependencyPercentage', 'claimAmount', 'createdAt', 'updatedAt', 'courtOrderDate'])
  sortBy: string = 'createdAt';

  constructor(
    deceasedId: string,
    options?: {
      status?: DependencyStatus;
      basis?: DependencyBasisFilter;
      dependencyLevel?: DependencyLevel;
      isMinor?: boolean;
      isStudent?: boolean;
      hasDisability?: boolean;
      hasCourtOrder?: boolean;
      isClaimant?: boolean;
      minDependencyPercentage?: number;
      maxDependencyPercentage?: number;
      minClaimAmount?: number;
      maxClaimAmount?: number;
      createdAfter?: string;
      createdBefore?: string;
      updatedAfter?: string;
      updatedBefore?: string;
      courtOrderAfter?: string;
      courtOrderBefore?: string;
      hasEvidence?: boolean;
      minEvidenceDocuments?: number;
      searchTerm?: string;
      includeDependantDetails?: boolean;
      includeCourtOrderDetails?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: SortDirection;
      requestId?: string;
      correlationId?: string;
      userId?: string;
      userRole?: string;
    },
  ) {
    super();

    this.deceasedId = deceasedId;

    if (options) {
      Object.assign(this, options);
      this.page = options.page ?? 1;
      this.limit = options.limit ?? 20;
      this.sortBy = options.sortBy ?? 'createdAt';
      this.sortDirection = options.sortDirection ?? SortDirection.DESC;
      this.requestId = options.requestId;
      this.correlationId = options.correlationId;
      this.userId = options.userId;
      this.userRole = options.userRole;
    }
  }

  get queryName(): string {
    return 'ListDependenciesByDeceasedQuery';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.deceasedId) {
      errors.push('Deceased ID is required');
    }

    if (this.deceasedId && !this.isValidUUID(this.deceasedId)) {
      warnings.push('Invalid deceased ID format');
    }

    // Validate date ranges
    if (this.createdAfter && this.createdBefore) {
      const after = new Date(this.createdAfter);
      const before = new Date(this.createdBefore);
      if (after > before) {
        errors.push('Created after date cannot be after created before date');
      }
    }

    if (this.updatedAfter && this.updatedBefore) {
      const after = new Date(this.updatedAfter);
      const before = new Date(this.updatedBefore);
      if (after > before) {
        errors.push('Updated after date cannot be after updated before date');
      }
    }

    if (this.courtOrderAfter && this.courtOrderBefore) {
      const after = new Date(this.courtOrderAfter);
      const before = new Date(this.courtOrderBefore);
      if (after > before) {
        errors.push('Court order after date cannot be after court order before date');
      }
    }

    // Validate percentage ranges
    if (this.minDependencyPercentage !== undefined && this.maxDependencyPercentage !== undefined) {
      if (this.minDependencyPercentage > this.maxDependencyPercentage) {
        errors.push('Minimum dependency percentage cannot be greater than maximum');
      }
    }

    // Validate claim amount ranges
    if (this.minClaimAmount !== undefined && this.maxClaimAmount !== undefined) {
      if (this.minClaimAmount > this.maxClaimAmount) {
        errors.push('Minimum claim amount cannot be greater than maximum');
      }
    }

    // Warn about large result sets
    if (this.limit > 50) {
      warnings.push('Large limit may impact performance. Consider paginating with smaller limits.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  getFilterCriteria(): any {
    const criteria: any = {
      deceasedId: this.deceasedId,
    };

    // Apply status filters
    switch (this.status) {
      case DependencyStatus.WITH_COURT_ORDER:
        criteria.hasCourtOrder = true;
        break;
      case DependencyStatus.WITHOUT_COURT_ORDER:
        criteria.hasCourtOrder = false;
        break;
      case DependencyStatus.HAS_S26_CLAIM:
        criteria.isClaimant = true;
        break;
      case DependencyStatus.NO_S26_CLAIM:
        criteria.isClaimant = false;
        break;
    }

    // Apply basis filter
    if (this.basis !== DependencyBasisFilter.ALL) {
      criteria.dependencyBasis = this.basis;
    }

    // Apply other filters
    if (this.dependencyLevel !== undefined) {
      criteria.dependencyLevel = this.dependencyLevel;
    }

    if (this.isMinor !== undefined) {
      criteria.isMinor = this.isMinor;
    }

    if (this.isStudent !== undefined) {
      criteria.isStudent = this.isStudent;
    }

    if (this.hasDisability !== undefined) {
      criteria.hasDisability = this.hasDisability;
    }

    if (this.hasCourtOrder !== undefined) {
      criteria.hasCourtOrder = this.hasCourtOrder;
    }

    if (this.isClaimant !== undefined) {
      criteria.isClaimant = this.isClaimant;
    }

    return criteria;
  }

  getDescription(): string {
    return `List dependencies for deceased ${this.deceasedId} with status ${this.status}`;
  }
}
