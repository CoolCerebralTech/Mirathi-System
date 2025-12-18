// application/family/queries/impl/search-families.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KenyanCounty } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { BaseQuery } from '../base.query';

export enum FamilySortField {
  NAME = 'NAME',
  MEMBER_COUNT = 'MEMBER_COUNT',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
  COUNTY = 'COUNTY',
}

export enum FamilySortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SearchFamiliesQuery extends BaseQuery {
  @ApiProperty({
    description: 'Unique query identifier',
    example: 'qry-1234567890',
  })
  @IsUUID('4')
  readonly queryId: string;

  @ApiProperty({
    description: 'Query timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsNotEmpty()
  readonly timestamp: Date;

  @ApiProperty({
    description: 'Correlation ID for tracing',
    example: 'corr-1234567890',
  })
  @IsUUID('4')
  readonly correlationId?: string;

  @ApiProperty({
    description: 'User ID executing the query',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  readonly userId: string;

  @ApiPropertyOptional({
    description: 'Search term for family name',
    example: 'Mwangi',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  readonly page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  readonly limit: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by clan name',
    example: 'Anjirũ',
  })
  @IsOptional()
  @IsString()
  readonly clanName?: string;

  @ApiPropertyOptional({
    description: 'Filter by ancestral home',
    example: 'Gatundu',
  })
  @IsOptional()
  @IsString()
  readonly ancestralHome?: string;

  @ApiPropertyOptional({
    description: 'Filter by county',
    enum: KenyanCounty,
    example: KenyanCounty.KIAMBU,
  })
  @IsOptional()
  @IsEnum(KenyanCounty)
  readonly county?: KenyanCounty;

  @ApiPropertyOptional({
    description: 'Filter by sub-county',
    example: 'Gatundu North',
  })
  @IsOptional()
  @IsString()
  readonly subCounty?: string;

  @ApiPropertyOptional({
    description: 'Filter by polygamous status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isPolygamous?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by archived status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by family totem',
    example: 'Ngũ (Leopard)',
  })
  @IsOptional()
  @IsString()
  readonly familyTotem?: string;

  @ApiPropertyOptional({
    description: 'Minimum member count',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  readonly minMemberCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum member count',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  readonly maxMemberCount?: number;

  @ApiPropertyOptional({
    description: 'Filter by creator user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  readonly creatorId?: string;

  @ApiPropertyOptional({
    description: 'Filter by family IDs',
    example: ['fam-1234567890', 'fam-0987654321'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  readonly familyIds?: string[];

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: FamilySortField.NAME,
    enum: FamilySortField,
    default: FamilySortField.NAME,
  })
  @IsOptional()
  @IsEnum(FamilySortField)
  readonly sortBy?: FamilySortField = FamilySortField.NAME;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: FamilySortOrder.ASC,
    enum: FamilySortOrder,
    default: FamilySortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(FamilySortOrder)
  readonly sortOrder?: FamilySortOrder = FamilySortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Include family statistics in response',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly includeStatistics?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include only families with living members',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly hasLivingMembers?: boolean;

  @ApiPropertyOptional({
    description: 'Include only families with minors',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly hasMinors?: boolean;

  @ApiPropertyOptional({
    description: 'Include only families with dependants',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly hasDependants?: boolean;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    search?: string,
    page: number = 1,
    limit: number = 20,
    clanName?: string,
    ancestralHome?: string,
    county?: KenyanCounty,
    subCounty?: string,
    isPolygamous?: boolean,
    isActive?: boolean,
    isArchived?: boolean,
    familyTotem?: string,
    minMemberCount?: number,
    maxMemberCount?: number,
    creatorId?: string,
    familyIds?: string[],
    sortBy?: FamilySortField,
    sortOrder?: FamilySortOrder,
    includeStatistics?: boolean,
    hasLivingMembers?: boolean,
    hasMinors?: boolean,
    hasDependants?: boolean,
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.search = search;
    this.page = page;
    this.limit = limit;
    this.clanName = clanName;
    this.ancestralHome = ancestralHome;
    this.county = county;
    this.subCounty = subCounty;
    this.isPolygamous = isPolygamous;
    this.isActive = isActive;
    this.isArchived = isArchived;
    this.familyTotem = familyTotem;
    this.minMemberCount = minMemberCount;
    this.maxMemberCount = maxMemberCount;
    this.creatorId = creatorId;
    this.familyIds = familyIds;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.includeStatistics = includeStatistics;
    this.hasLivingMembers = hasLivingMembers;
    this.hasMinors = hasMinors;
    this.hasDependants = hasDependants;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    options?: {
      search?: string;
      page?: number;
      limit?: number;
      clanName?: string;
      ancestralHome?: string;
      county?: KenyanCounty;
      subCounty?: string;
      isPolygamous?: boolean;
      isActive?: boolean;
      isArchived?: boolean;
      familyTotem?: string;
      minMemberCount?: number;
      maxMemberCount?: number;
      creatorId?: string;
      familyIds?: string[];
      sortBy?: FamilySortField;
      sortOrder?: FamilySortOrder;
      includeStatistics?: boolean;
      hasLivingMembers?: boolean;
      hasMinors?: boolean;
      hasDependants?: boolean;
      correlationId?: string;
    },
  ): SearchFamiliesQuery {
    const {
      search,
      page = 1,
      limit = 20,
      clanName,
      ancestralHome,
      county,
      subCounty,
      isPolygamous,
      isActive,
      isArchived,
      familyTotem,
      minMemberCount,
      maxMemberCount,
      creatorId,
      familyIds,
      sortBy = FamilySortField.NAME,
      sortOrder = FamilySortOrder.ASC,
      includeStatistics = false,
      hasLivingMembers,
      hasMinors,
      hasDependants,
      correlationId,
    } = options || {};

    return new SearchFamiliesQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      search,
      page,
      limit,
      clanName,
      ancestralHome,
      county,
      subCounty,
      isPolygamous,
      isActive,
      isArchived,
      familyTotem,
      minMemberCount,
      maxMemberCount,
      creatorId,
      familyIds,
      sortBy,
      sortOrder,
      includeStatistics,
      hasLivingMembers,
      hasMinors,
      hasDependants,
      correlationId,
    );
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }

  get hasFilters(): boolean {
    return Boolean(
      this.search ||
      this.clanName ||
      this.ancestralHome ||
      this.county ||
      this.subCounty ||
      this.isPolygamous !== undefined ||
      this.isActive !== undefined ||
      this.isArchived !== undefined ||
      this.familyTotem ||
      this.minMemberCount !== undefined ||
      this.maxMemberCount !== undefined ||
      this.creatorId ||
      (this.familyIds && this.familyIds.length > 0) ||
      this.hasLivingMembers !== undefined ||
      this.hasMinors !== undefined ||
      this.hasDependants !== undefined,
    );
  }
}
