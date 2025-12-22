// application/guardianship/queries/impl/find-guardianships.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BaseQuery } from '../base.query';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindGuardianshipsQuery extends BaseQuery {
  @ApiProperty({
    description: 'Query name',
    example: 'FindGuardianshipsQuery',
  })
  getQueryName(): string {
    return 'FindGuardianshipsQuery';
  }

  // Pagination
  @ApiPropertyOptional({
    description: 'Pagination parameters',
    type: PaginationDto,
  })
  @Type(() => PaginationDto)
  readonly pagination?: PaginationDto = { page: 1, limit: 20 };

  // Filters
  @ApiPropertyOptional({
    description: 'Filter by ward ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  readonly wardId?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardian ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID('4')
  readonly guardianId?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardianship type',
    enum: GuardianType,
  })
  @IsOptional()
  @IsEnum(GuardianType)
  readonly type?: GuardianType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by bond requirement',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly bondRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by bond posted status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly isBondPosted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by property management powers',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly hasPropertyManagementPowers?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by compliance status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly isCompliant?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by court case number',
    example: 'CASE NO. 123 OF 2024',
  })
  @IsOptional()
  @IsString()
  readonly courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by court station',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  readonly courtStation?: string;

  @ApiPropertyOptional({
    description: 'Search by ward/guardian name (partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: 'Filter by S.72 compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_REQUIRED'],
  })
  @IsOptional()
  @IsString()
  readonly s72ComplianceStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by S.73 compliance status',
    example: 'COMPLIANT',
    enum: ['COMPLIANT', 'NON_COMPLIANT', 'NOT_REQUIRED'],
  })
  @IsOptional()
  @IsString()
  readonly s73ComplianceStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by report status',
    example: 'APPROVED',
    enum: ['PENDING', 'SUBMITTED', 'APPROVED', 'OVERDUE'],
  })
  @IsOptional()
  @IsString()
  readonly reportStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardianship term status',
    example: 'EXPIRED',
    enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'],
  })
  @IsOptional()
  @IsString()
  readonly termStatus?: string;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: [
      'createdAt',
      'updatedAt',
      'appointmentDate',
      'nextReportDue',
      'bondExpiry',
      'validUntil',
    ],
  })
  @IsOptional()
  @IsString()
  readonly sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  readonly sortDirection?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: 'Include denormalized data',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeDenormalizedData?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include compliance summaries',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly includeComplianceSummaries?: boolean = true;

  constructor(
    queryId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      pagination?: PaginationDto;
      wardId?: string;
      guardianId?: string;
      type?: GuardianType;
      isActive?: boolean;
      bondRequired?: boolean;
      isBondPosted?: boolean;
      hasPropertyManagementPowers?: boolean;
      isCompliant?: boolean;
      courtCaseNumber?: string;
      courtStation?: string;
      search?: string;
      s72ComplianceStatus?: string;
      s73ComplianceStatus?: string;
      reportStatus?: string;
      termStatus?: string;
      sortBy?: string;
      sortDirection?: 'ASC' | 'DESC';
      includeDenormalizedData?: boolean;
      includeComplianceSummaries?: boolean;
    },
  ) {
    super(correlationId);
    this.queryId = queryId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.pagination = data.pagination || { page: 1, limit: 20 };
    this.wardId = data.wardId;
    this.guardianId = data.guardianId;
    this.type = data.type;
    this.isActive = data.isActive;
    this.bondRequired = data.bondRequired;
    this.isBondPosted = data.isBondPosted;
    this.hasPropertyManagementPowers = data.hasPropertyManagementPowers;
    this.isCompliant = data.isCompliant;
    this.courtCaseNumber = data.courtCaseNumber;
    this.courtStation = data.courtStation;
    this.search = data.search;
    this.s72ComplianceStatus = data.s72ComplianceStatus;
    this.s73ComplianceStatus = data.s73ComplianceStatus;
    this.reportStatus = data.reportStatus;
    this.termStatus = data.termStatus;
    this.sortBy = data.sortBy || 'createdAt';
    this.sortDirection = data.sortDirection || 'DESC';
    this.includeDenormalizedData = data.includeDenormalizedData ?? true;
    this.includeComplianceSummaries = data.includeComplianceSummaries ?? true;
  }
}