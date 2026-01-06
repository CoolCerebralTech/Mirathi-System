// src/application/dtos/will.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BeneficiaryType, BequestType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateWillDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'John Kamau Mwangi' })
  @IsString()
  testatorName: string;
}

export class AddBeneficiaryDto {
  @ApiProperty({ example: 'Jane Wanjiru Kamau' })
  @IsString()
  name: string;

  @ApiProperty({ enum: BeneficiaryType })
  @IsEnum(BeneficiaryType)
  type: BeneficiaryType;

  @ApiProperty({ enum: BequestType })
  @IsEnum(BequestType)
  bequestType: BequestType = BequestType.RESIDUAL;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @ApiPropertyOptional({ example: 'My daughter Jane will receive 30% of my estate' })
  @IsOptional()
  @IsString()
  description: string;
}

export class AddWitnessDto {
  @ApiProperty({ example: 'Peter Omondi Otieno' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @Length(6, 20)
  nationalId?: string;

  @ApiPropertyOptional({ example: 'peter@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

// --- RESPONSE DTO ---
export class WillPreviewDto {
  @ApiProperty()
  metadata: any; // Contains ID, status, completeness score

  @ApiProperty()
  htmlPreview: string;
}
