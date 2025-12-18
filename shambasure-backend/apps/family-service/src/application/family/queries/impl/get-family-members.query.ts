// application/family/queries/impl/get-family-members.query.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export enum FamilyMemberSortField {
  NAME = 'NAME',
  AGE = 'AGE',
  CREATED_AT = 'CREATED_AT',
  UPDATED_AT = 'UPDATED_AT',
}

export enum FamilyMemberSortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetFamilyMembersQuery extends BaseQuery {
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

  @ApiProperty({
    description: 'Family ID to retrieve members for',
    example: 'fam-1234567890',
  })
  @IsString()
  readonly familyId: string;

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
    description: 'Search term for member names',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'Filter by gender',
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'OTHER'],
  })
  @IsOptional()
  @IsString()
  readonly gender?: string;

  @ApiPropertyOptional({
    description: 'Filter by age range - minimum age',
    example: 18,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  readonly minAge?: number;

  @ApiPropertyOptional({
    description: 'Filter by age range - maximum age',
    example: 65,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  readonly maxAge?: number;

  @ApiPropertyOptional({
    description: 'Filter by life status',
    example: 'LIVING',
    enum: ['LIVING', 'DECEASED', 'MISSING'],
  })
  @IsOptional()
  @IsString()
  readonly lifeStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by minor status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isMinor?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by disability status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly hasDisability?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by identity verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly isIdentityVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by polygamous house ID',
    example: 'hse-1234567890',
  })
  @IsOptional()
  @IsString()
  readonly polygamousHouseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by occupation',
    example: 'Software Engineer',
  })
  @IsOptional()
  @IsString()
  readonly occupation?: string;

  @ApiPropertyOptional({
    description: 'Include archived members',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  readonly includeArchived?: boolean = false;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: FamilyMemberSortField.NAME,
    enum: FamilyMemberSortField,
    default: FamilyMemberSortField.NAME,
  })
  @IsOptional()
  @IsEnum(FamilyMemberSortField)
  readonly sortBy?: FamilyMemberSortField = FamilyMemberSortField.NAME;

  @ApiPropertyOptional({
    description: 'Sort order',
    example: FamilyMemberSortOrder.ASC,
    enum: FamilyMemberSortOrder,
    default: FamilyMemberSortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(FamilyMemberSortOrder)
  readonly sortOrder?: FamilyMemberSortOrder = FamilyMemberSortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Array of member IDs to fetch specifically',
    example: ['fm-1234567890', 'fm-0987654321'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  readonly memberIds?: string[];

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    familyId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    gender?: string,
    minAge?: number,
    maxAge?: number,
    lifeStatus?: string,
    isMinor?: boolean,
    hasDisability?: boolean,
    isIdentityVerified?: boolean,
    polygamousHouseId?: string,
    occupation?: string,
    includeArchived?: boolean,
    sortBy?: FamilyMemberSortField,
    sortOrder?: FamilyMemberSortOrder,
    memberIds?: string[],
    correlationId?: string,
  ) {
    super();
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.familyId = familyId;
    this.page = page;
    this.limit = limit;
    this.search = search;
    this.gender = gender;
    this.minAge = minAge;
    this.maxAge = maxAge;
    this.lifeStatus = lifeStatus;
    this.isMinor = isMinor;
    this.hasDisability = hasDisability;
    this.isIdentityVerified = isIdentityVerified;
    this.polygamousHouseId = polygamousHouseId;
    this.occupation = occupation;
    this.includeArchived = includeArchived;
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.memberIds = memberIds;
    this.correlationId = correlationId;
  }

  static create(
    userId: string,
    familyId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      gender?: string;
      minAge?: number;
      maxAge?: number;
      lifeStatus?: string;
      isMinor?: boolean;
      hasDisability?: boolean;
      isIdentityVerified?: boolean;
      polygamousHouseId?: string;
      occupation?: string;
      includeArchived?: boolean;
      sortBy?: FamilyMemberSortField;
      sortOrder?: FamilyMemberSortOrder;
      memberIds?: string[];
      correlationId?: string;
    },
  ): GetFamilyMembersQuery {
    const {
      page = 1,
      limit = 20,
      search,
      gender,
      minAge,
      maxAge,
      lifeStatus,
      isMinor,
      hasDisability,
      isIdentityVerified,
      polygamousHouseId,
      occupation,
      includeArchived = false,
      sortBy = FamilyMemberSortField.NAME,
      sortOrder = FamilyMemberSortOrder.ASC,
      memberIds,
      correlationId,
    } = options || {};

    return new GetFamilyMembersQuery(
      `qry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      new Date(),
      userId,
      familyId,
      page,
      limit,
      search,
      gender,
      minAge,
      maxAge,
      lifeStatus,
      isMinor,
      hasDisability,
      isIdentityVerified,
      polygamousHouseId,
      occupation,
      includeArchived,
      sortBy,
      sortOrder,
      memberIds,
      correlationId,
    );
  }

  get offset(): number {
    return (this.page - 1) * this.limit;
  }
}
