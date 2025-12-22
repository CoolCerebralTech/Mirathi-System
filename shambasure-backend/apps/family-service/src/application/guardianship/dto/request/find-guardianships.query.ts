// application/guardianship/dto/request/find-guardianships.query.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GuardianType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindGuardianshipsQuery extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by ward ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  wardId?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardian ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsString()
  guardianId?: string;

  @ApiPropertyOptional({
    description: 'Filter by guardianship type',
    enum: GuardianType,
  })
  @IsOptional()
  @IsEnum(GuardianType)
  type?: GuardianType;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by bond requirement',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  bondRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by bond posted status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBondPosted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by property management powers',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasPropertyManagementPowers?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by compliance status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isCompliant?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by court case number',
    example: 'CASE NO. 123 OF 2024',
  })
  @IsOptional()
  @IsString()
  courtCaseNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by court station',
    example: 'Milimani Law Courts',
  })
  @IsOptional()
  @IsString()
  courtStation?: string;

  @ApiPropertyOptional({
    description: 'Search by ward/guardian name (partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'appointmentDate', 'nextReportDue', 'bondExpiry'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortDirection?: 'ASC' | 'DESC' = 'DESC';
}
