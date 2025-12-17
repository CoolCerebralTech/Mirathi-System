// application/dependency/queries/impl/search-dependencies.query.ts
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

export enum SearchField {
  ALL = 'ALL',
  DEPENDANT_NAME = 'DEPENDANT_NAME',
  DEPENDANT_ID = 'DEPENDANT_ID',
  DEPENDENCY_BASIS = 'DEPENDENCY_BASIS',
  COURT_ORDER_NUMBER = 'COURT_ORDER_NUMBER',
  CASE_NUMBER = 'CASE_NUMBER',
}

export enum SearchScope {
  ALL_DECEASED = 'ALL_DECEASED',
  SPECIFIC_DECEASED = 'SPECIFIC_DECEASED',
  BY_JURISDICTION = 'BY_JURISDICTION',
  BY_COURT = 'BY_COURT',
}

export class SearchDependenciesQuery extends PaginatedQuery {
  @IsOptional()
  @IsString()
  deceasedId?: string;

  @IsOptional()
  @IsString()
  searchTerm: string;

  @IsOptional()
  @IsEnum(SearchField)
  searchField: SearchField = SearchField.ALL;

  @IsOptional()
  @IsEnum(SearchScope)
  searchScope: SearchScope = SearchScope.ALL_DECEASED;

  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsString()
  courtName?: string;

  // Advanced filters
  @IsOptional()
  @IsEnum(DependencyLevel)
  dependencyLevel?: DependencyLevel;

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
  minClaimAmount?: number;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsDateString()
  courtOrderAfter?: string;

  @IsOptional()
  @IsDateString()
  courtOrderBefore?: string;

  // Include related data
  @IsOptional()
  @IsBoolean()
  includeDeceasedDetails: boolean = false;

  @IsOptional()
  @IsBoolean()
  includeDependantDetails: boolean = true;

  // Fuzzy search options
  @IsOptional()
  @IsBoolean()
  useFuzzySearch: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold: number = 0.7;

  // Result highlighting
  @IsOptional()
  @IsBoolean()
  highlightMatches: boolean = false;

  constructor(
    searchTerm: string,
    options?: {
      deceasedId?: string;
      searchField?: SearchField;
      searchScope?: SearchScope;
      jurisdiction?: string;
      courtName?: string;
      dependencyLevel?: DependencyLevel;
      hasCourtOrder?: boolean;
      isClaimant?: boolean;
      minDependencyPercentage?: number;
      minClaimAmount?: number;
      createdAfter?: string;
      createdBefore?: string;
      courtOrderAfter?: string;
      courtOrderBefore?: string;
      includeDeceasedDetails?: boolean;
      includeDependantDetails?: boolean;
      useFuzzySearch?: boolean;
      similarityThreshold?: number;
      highlightMatches?: boolean;
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

    this.searchTerm = searchTerm;

    if (options) {
      Object.assign(this, options);
      this.page = options.page ?? 1;
      this.limit = options.limit ?? 20;
      this.sortBy = options.sortBy ?? 'relevance';
      this.sortDirection = options.sortDirection ?? SortDirection.DESC;
      this.requestId = options.requestId;
      this.correlationId = options.correlationId;
      this.userId = options.userId;
      this.userRole = options.userRole;
    }
  }

  get queryName(): string {
    return 'SearchDependenciesQuery';
  }

  validate(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.searchTerm || this.searchTerm.trim().length === 0) {
      errors.push('Search term is required');
    }

    if (this.searchTerm && this.searchTerm.trim().length < 2) {
      warnings.push('Search term is very short. Results may be too broad.');
    }

    if (this.searchTerm && this.searchTerm.trim().length > 100) {
      warnings.push('Very long search term. Consider using more specific terms.');
    }

    // Validate scope-specific requirements
    if (this.searchScope === SearchScope.SPECIFIC_DECEASED && !this.deceasedId) {
      errors.push('Deceased ID is required for specific deceased scope');
    }

    if (this.searchScope === SearchScope.BY_JURISDICTION && !this.jurisdiction) {
      errors.push('Jurisdiction is required for jurisdiction scope');
    }

    if (this.searchScope === SearchScope.BY_COURT && !this.courtName) {
      errors.push('Court name is required for court scope');
    }

    // Validate date ranges
    if (this.createdAfter && this.createdBefore) {
      const after = new Date(this.createdAfter);
      const before = new Date(this.createdBefore);
      if (after > before) {
        errors.push('Created after date cannot be after created before date');
      }
    }

    if (this.courtOrderAfter && this.courtOrderBefore) {
      const after = new Date(this.courtOrderAfter);
      const before = new Date(this.courtOrderBefore);
      if (after > before) {
        errors.push('Court order after date cannot be after court order before date');
      }
    }

    // Warn about performance for broad searches
    if (this.searchScope === SearchScope.ALL_DECEASED && !this.hasCourtOrder && !this.isClaimant) {
      warnings.push('Searching across all deceased without filters may impact performance.');
    }

    // Validate similarity threshold
    if (this.similarityThreshold < 0.3) {
      warnings.push('Very low similarity threshold may return irrelevant results.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getSearchParameters(): any {
    const params: any = {
      searchTerm: this.searchTerm.trim(),
      searchField: this.searchField,
      searchScope: this.searchScope,
    };

    // Add scope-specific parameters
    if (this.deceasedId) {
      params.deceasedId = this.deceasedId;
    }

    if (this.jurisdiction) {
      params.jurisdiction = this.jurisdiction;
    }

    if (this.courtName) {
      params.courtName = this.courtName;
    }

    // Add filters
    if (this.dependencyLevel !== undefined) {
      params.dependencyLevel = this.dependencyLevel;
    }

    if (this.hasCourtOrder !== undefined) {
      params.hasCourtOrder = this.hasCourtOrder;
    }

    if (this.isClaimant !== undefined) {
      params.isClaimant = this.isClaimant;
    }

    if (this.minDependencyPercentage !== undefined) {
      params.minDependencyPercentage = this.minDependencyPercentage;
    }

    if (this.minClaimAmount !== undefined) {
      params.minClaimAmount = this.minClaimAmount;
    }

    // Add date ranges
    if (this.createdAfter) {
      params.createdAfter = new Date(this.createdAfter);
    }

    if (this.createdBefore) {
      params.createdBefore = new Date(this.createdBefore);
    }

    if (this.courtOrderAfter) {
      params.courtOrderAfter = new Date(this.courtOrderAfter);
    }

    if (this.courtOrderBefore) {
      params.courtOrderBefore = new Date(this.courtOrderBefore);
    }

    // Add search options
    params.useFuzzySearch = this.useFuzzySearch;
    params.similarityThreshold = this.similarityThreshold;
    params.highlightMatches = this.highlightMatches;

    return params;
  }

  getDescription(): string {
    let desc = `Search dependencies for "${this.searchTerm}" in field ${this.searchField}`;

    if (this.searchScope !== SearchScope.ALL_DECEASED) {
      desc += ` within ${this.searchScope}`;

      if (this.deceasedId) {
        desc += ` for deceased ${this.deceasedId}`;
      }

      if (this.jurisdiction) {
        desc += ` in ${this.jurisdiction}`;
      }

      if (this.courtName) {
        desc += ` at ${this.courtName}`;
      }
    }

    return desc;
  }
}
