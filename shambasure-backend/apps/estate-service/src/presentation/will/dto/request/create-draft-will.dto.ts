import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { WillType } from '../../../../domain/enums/will-type.enum';
import type { CapacityStatus } from '../../../../domain/value-objects/testator-capacity-declaration.vo';

class InitialCapacityDto {
  @ApiProperty({ enum: ['SELF_DECLARATION', 'MEDICAL_CERTIFICATION', 'ASSESSED_COMPETENT'] })
  @IsEnum(['SELF_DECLARATION', 'MEDICAL_CERTIFICATION', 'ASSESSED_COMPETENT']) // Subset of allowed initial statuses
  status: CapacityStatus;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}

export class CreateDraftWillRequestDto {
  @ApiPropertyOptional({ enum: WillType, default: WillType.STANDARD })
  @IsOptional()
  @IsEnum(WillType)
  type?: WillType;

  @ApiPropertyOptional({ type: InitialCapacityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialCapacityDto)
  initialCapacityDeclaration?: InitialCapacityDto;
}
