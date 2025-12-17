// application/dependency/queries/base.query.ts
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export abstract class BaseQuery {
  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsDateString()
  requestedAt?: string = new Date().toISOString();
}

export abstract class PaginatedQuery extends BaseQuery {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;

  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  get skip(): number {
    return this.offset;
  }

  get take(): number {
    return this.limit;
  }
}

// Query metadata for audit and tracing
export interface QueryMetadata {
  userId: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}
