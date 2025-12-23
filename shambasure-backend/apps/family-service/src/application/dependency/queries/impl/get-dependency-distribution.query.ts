import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { PaginatedQuery, SortDirection } from '../base.query';

export enum SearchField {
  ALL = 'ALL',
  NAME = 'NAME',
  COURT_ORDER = 'COURT_ORDER',
  BASIS = 'BASIS',
}

export enum SearchScope {
  SPECIFIC_DECEASED = 'SPECIFIC_DECEASED',
  ALL_DECEASED = 'ALL_DECEASED',
}

export class SearchDependenciesQuery extends PaginatedQuery {
  @IsString()
  searchTerm: string;

  @IsOptional()
  @IsUUID()
  deceasedId?: string;

  @IsOptional()
  @IsEnum(SearchField)
  searchField: SearchField = SearchField.ALL;

  @IsOptional()
  @IsEnum(SearchScope)
  searchScope: SearchScope = SearchScope.SPECIFIC_DECEASED;

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
  @IsBoolean()
  includeDeceasedDetails: boolean = false;

  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
  readonly userRole?: string; // Added property

  constructor(
    searchTerm: string,
    options?: {
      deceasedId?: string;
      searchField?: SearchField;
      searchScope?: SearchScope;
      dependencyLevel?: DependencyLevel;
      hasCourtOrder?: boolean;
      isClaimant?: boolean;
      minDependencyPercentage?: number;
      includeDeceasedDetails?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortDirection?: SortDirection;
      requestId?: string;
      correlationId?: string;
      userId?: string;
      userRole?: string; // Added to options interface
    },
  ) {
    super();

    this.searchTerm = searchTerm;
    this.queryId = options?.requestId || crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
    this.userId = options?.userId || 'SYSTEM';
    this.userRole = options?.userRole;

    if (options) {
      Object.assign(this, options);
      this.page = options.page ?? 1;
      this.limit = options.limit ?? 20;
      this.sortBy = options.sortBy ?? 'relevance';
      this.sortDirection = options.sortDirection ?? SortDirection.DESC;
    }
  }

  get queryName(): string {
    return 'SearchDependenciesQuery';
  }
}
