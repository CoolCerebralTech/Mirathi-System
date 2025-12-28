import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

export class WillSearchFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  testatorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testatorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  probateCaseNumber?: string;

  @ApiPropertyOptional({ enum: WillStatus })
  @IsOptional()
  @IsEnum(WillStatus)
  status?: WillStatus;

  @ApiPropertyOptional({ enum: WillType })
  @IsOptional()
  @IsEnum(WillType)
  type?: WillType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRevoked?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isValid?: boolean;

  // Dates
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  // Pagination
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;
}
