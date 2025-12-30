import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { DependantRelationship } from '../../../../../domain/entities/legal-dependant.entity';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class FileDependantClaimRequestDto {
  @ApiProperty({ description: 'Family Member ID' })
  @IsString()
  @IsNotEmpty()
  dependantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dependantName: string;

  @ApiProperty({ enum: DependantRelationship })
  @IsEnum(DependantRelationship)
  relationship: DependantRelationship;

  @ApiPropertyOptional({ description: 'Required for Children to prove minority' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsBoolean()
  isIncapacitated: boolean;

  @ApiProperty()
  @IsBoolean()
  hasDisability: boolean;

  @ApiProperty({ type: MoneyRequestDto, description: 'Monthly support required' })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  monthlyMaintenanceNeeds: MoneyRequestDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  custodialParentId?: string;
}
