import { DependencyLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { PaginatedQuery, SortDirection } from '../base.query';

export enum DependencyStatus {
  ALL = 'ALL',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  WITH_COURT_ORDER = 'WITH_COURT_ORDER',
  S26_CLAIMANT = 'S26_CLAIMANT',
  S29_COMPLIANT = 'S29_COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
}

export enum DependencyBasisFilter {
  ALL = 'ALL',
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  OTHER = 'OTHER',
}

export class ListDependenciesByDeceasedQuery extends PaginatedQuery {
  @IsUUID()
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
  hasCourtOrder?: boolean;

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
  @IsString()
  searchTerm?: string;

  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId: string;
  readonly userRole?: string; // Added property

  constructor(
    deceasedId: string,
    options?: {
      status?: DependencyStatus;
      basis?: DependencyBasisFilter;
      dependencyLevel?: DependencyLevel;
      isMinor?: boolean;
      isStudent?: boolean;
      hasCourtOrder?: boolean;
      minDependencyPercentage?: number;
      minClaimAmount?: number;
      createdAfter?: string;
      createdBefore?: string;
      searchTerm?: string;
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

    this.deceasedId = deceasedId;
    this.queryId = options?.requestId || crypto.randomUUID();
    this.timestamp = new Date();
    this.correlationId = options?.correlationId;
    this.userId = options?.userId || 'SYSTEM';
    this.userRole = options?.userRole;

    if (options) {
      Object.assign(this, options);
      this.page = options.page ?? 1;
      this.limit = options.limit ?? 20;
      this.sortBy = options.sortBy ?? 'createdAt';
      this.sortDirection = options.sortDirection ?? SortDirection.DESC;
    }
  }

  get queryName(): string {
    return 'ListDependenciesByDeceasedQuery';
  }
}
