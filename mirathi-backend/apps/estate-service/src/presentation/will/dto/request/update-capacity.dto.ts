import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import type { CapacityStatus } from '../../../../domain/value-objects/testator-capacity-declaration.vo';

class CapacityDeclarationsDto {
  @ApiProperty()
  @IsBoolean()
  isVoluntarilyMade: boolean;

  @ApiProperty()
  @IsBoolean()
  isFreeFromUndueInfluence: boolean;
}

export class UpdateCapacityRequestDto {
  @ApiProperty({
    enum: [
      'ASSESSED_COMPETENT',
      'ASSESSED_INCOMPETENT',
      'PENDING_ASSESSMENT',
      'MEDICAL_CERTIFICATION',
      'COURT_DETERMINATION',
      'SELF_DECLARATION',
    ],
  })
  @IsString() // matching CapacityStatus alias
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

  @ApiProperty()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @ApiProperty({ type: CapacityDeclarationsDto })
  @ValidateNested()
  @Type(() => CapacityDeclarationsDto)
  declarations: CapacityDeclarationsDto;
}
