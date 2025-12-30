import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import { KenyanCounty } from '../../../../domain/value-objects/family-enums.vo';

export class EstablishPolygamousHouseDto {
  @ApiProperty({ description: 'The UUID of the Original Wife establishing this house' })
  @IsUUID()
  originalWifeId: string;

  @ApiPropertyOptional({ description: 'The House Head (if different from Wife, e.g. Husband)' })
  @IsOptional()
  @IsUUID()
  houseHeadId?: string;

  @ApiProperty({ example: 2, description: 'The chronological order of the house (2nd House)' })
  @IsInt()
  @Min(1)
  houseOrder: number;

  @ApiPropertyOptional({ example: 'House of Wanjiku' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  houseName?: string;

  @ApiPropertyOptional({
    description: 'S.40 Distribution Weight (Default 1.0)',
    default: 1.0,
    example: 1.0,
  })
  @IsOptional()
  @IsNumber()
  distributionWeight?: number;

  @ApiPropertyOptional({ enum: ['CUSTOMARY', 'ISLAMIC', 'TRADITIONAL', 'COURT_RECOGNIZED'] })
  @IsOptional()
  @IsEnum(['CUSTOMARY', 'ISLAMIC', 'TRADITIONAL', 'COURT_RECOGNIZED'])
  establishmentType?: 'CUSTOMARY' | 'ISLAMIC' | 'TRADITIONAL' | 'COURT_RECOGNIZED';

  @ApiPropertyOptional({ enum: KenyanCounty })
  @IsOptional()
  @IsEnum(KenyanCounty)
  residentialCounty?: KenyanCounty;
}
