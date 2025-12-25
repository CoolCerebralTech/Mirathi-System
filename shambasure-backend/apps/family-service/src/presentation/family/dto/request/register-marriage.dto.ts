import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { KenyanCounty, MarriageType } from '../../../../domain/value-objects/family-enums.vo';

class DowryPaymentDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'KES' })
  @IsString()
  currency: string;

  @ApiProperty()
  @IsBoolean()
  isPaidInFull: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  livestockCount?: number;
}

export class RegisterMarriageDto {
  @ApiProperty()
  @IsUUID()
  spouse1Id: string;

  @ApiProperty()
  @IsUUID()
  spouse2Id: string;

  @ApiProperty({ enum: MarriageType })
  @IsEnum(MarriageType)
  marriageType: MarriageType;

  @ApiProperty()
  @IsDateString()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: KenyanCounty })
  @IsOptional()
  @IsEnum(KenyanCounty)
  county?: KenyanCounty;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  witnesses?: string[];

  @ApiPropertyOptional({ description: 'For Civil/Christian marriages' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: 'For Customary marriages' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DowryPaymentDto)
  dowryPayment?: DowryPaymentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPolygamous?: boolean;

  @ApiPropertyOptional({ description: 'Required if isPolygamous is true' })
  @IsOptional()
  @IsUUID()
  polygamousHouseId?: string;

  @ApiPropertyOptional({ description: 'e.g., 2 for Second Wife' })
  @IsOptional()
  @IsNumber()
  marriageOrder?: number;
}
