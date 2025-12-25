import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

export class RecordCohabitationDto {
  @ApiProperty()
  @IsUUID()
  partner1Id: string;

  @ApiProperty()
  @IsUUID()
  partner2Id: string;

  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sharedResidenceAddress: string;

  @ApiProperty({ enum: KenyanCounty })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  jointAssets?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasChildrenTogether?: boolean;

  @ApiPropertyOptional({ description: 'UUID of sworn affidavit' })
  @IsOptional()
  @IsUUID()
  affidavitId?: string;
}
