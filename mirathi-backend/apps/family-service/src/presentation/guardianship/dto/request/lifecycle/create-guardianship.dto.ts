import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Gender } from '../../../../../domain/value-objects/family-enums.vo';
import { LegalGuardianshipType } from '../../../../../domain/value-objects/guardianship-type.vo';

class CourtOrderDto {
  @ApiProperty({ description: 'The official case number (e.g., ELC No. 123 of 2024)' })
  @IsString()
  @IsNotEmpty()
  caseNumber: string;

  @ApiProperty({ description: 'The court station (e.g., Milimani High Court)' })
  @IsString()
  @IsNotEmpty()
  courtStation: string;

  @ApiProperty({ description: 'Date the order was issued' })
  @IsDateString()
  orderDate: Date;

  @ApiPropertyOptional({ description: 'Name of the presiding judge or magistrate' })
  @IsOptional()
  @IsString()
  judgeName?: string;
}

export class CreateGuardianshipDto {
  // ---------------------------------------------------------
  // Ward Identity
  // ---------------------------------------------------------

  @ApiProperty({ description: 'The UUID of the child from the Family Service' })
  @IsUUID('4')
  wardId: string;

  @ApiProperty({ description: 'First name of the ward' })
  @IsString()
  @MinLength(2)
  wardFirstName: string;

  @ApiProperty({ description: 'Last name/Surname of the ward' })
  @IsString()
  @MinLength(2)
  wardLastName: string;

  @ApiProperty({ description: 'Date of Birth (YYYY-MM-DD)' })
  @IsDateString()
  wardDateOfBirth: Date;

  @ApiProperty({ enum: Gender, description: 'Gender of the ward' })
  @IsEnum(Gender)
  wardGender: Gender;

  @ApiProperty({ description: 'Is the ward currently alive?', default: true })
  @IsBoolean()
  wardIsAlive: boolean;

  // ---------------------------------------------------------
  // Legal Configuration
  // ---------------------------------------------------------

  @ApiProperty({
    enum: LegalGuardianshipType,
    description: 'The legal basis for this guardianship',
  })
  @IsEnum(LegalGuardianshipType)
  guardianshipType: string;

  @ApiProperty({
    description: 'The applicable legal jurisdiction',
    enum: ['STATUTORY', 'ISLAMIC', 'CUSTOMARY', 'INTERNATIONAL'],
    default: 'STATUTORY',
  })
  @IsString()
  @IsEnum(['STATUTORY', 'ISLAMIC', 'CUSTOMARY', 'INTERNATIONAL'])
  jurisdiction: 'STATUTORY' | 'ISLAMIC' | 'CUSTOMARY' | 'INTERNATIONAL';

  @ApiProperty({ description: 'Does this involve managing land, shares, or money?' })
  @IsBoolean()
  requiresPropertyManagement: boolean;

  // ---------------------------------------------------------
  // Optional Context
  // ---------------------------------------------------------

  @ApiPropertyOptional({ description: 'Details if appointed by court' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourtOrderDto)
  courtOrder?: CourtOrderDto;

  @ApiPropertyOptional({ description: 'Internal legal notes or reference' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  legalNotes?: string;
}
