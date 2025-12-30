import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import type { ExecutorPriorityType } from '../../../../domain/value-objects/executor-priority.vo';

class ExecutorIdentityDto {
  @ApiProperty({ enum: ['USER', 'FAMILY_MEMBER', 'EXTERNAL'] })
  @IsEnum(['USER', 'FAMILY_MEMBER', 'EXTERNAL'])
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'USER')
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'FAMILY_MEMBER')
  @IsUUID()
  familyMemberId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.type === 'EXTERNAL')
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalNationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalPhone?: string;
}

class ExecutorCompensationDto {
  @ApiProperty()
  @IsBoolean()
  isEntitled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ enum: ['FIXED', 'PERCENTAGE', 'REASONABLE'] })
  @IsOptional()
  @IsEnum(['FIXED', 'PERCENTAGE', 'REASONABLE'])
  basis?: 'FIXED' | 'PERCENTAGE' | 'REASONABLE';
}

export class AppointExecutorRequestDto {
  @ApiProperty({ type: ExecutorIdentityDto })
  @ValidateNested()
  @Type(() => ExecutorIdentityDto)
  executorIdentity: ExecutorIdentityDto;

  @ApiProperty({ enum: ['PRIMARY', 'SUBSTITUTE', 'CO_EXECUTOR'] })
  @IsString() // Matching VO type
  priority: ExecutorPriorityType;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.priority === 'CO_EXECUTOR')
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  powers?: string[];

  @ApiPropertyOptional({ type: ExecutorCompensationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExecutorCompensationDto)
  compensation?: ExecutorCompensationDto;
}
