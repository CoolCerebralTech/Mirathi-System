import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { IQuery } from '../../common/interfaces/use-case.interface';

export abstract class BaseQuery implements IQuery {
  abstract readonly queryId: string;
  abstract readonly timestamp: Date;
  abstract readonly correlationId?: string;
  abstract readonly userId: string;
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export abstract class PaginatedQuery extends BaseQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection = SortDirection.DESC;
}
