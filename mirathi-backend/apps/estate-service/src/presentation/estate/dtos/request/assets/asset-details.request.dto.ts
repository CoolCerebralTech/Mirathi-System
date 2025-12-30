import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class LandAssetDetailsRequestDto {
  @ApiProperty({ example: 'IR 12345', description: 'Title Deed Number' })
  @IsString()
  @IsNotEmpty()
  titleDeedNumber: string;

  @ApiProperty({ example: 'Nairobi/Block10/123', description: 'Land Reference Number' })
  @IsString()
  @IsNotEmpty()
  landReferenceNumber: string;

  @ApiProperty({ example: 'NAIROBI', description: 'County Name' })
  @IsString()
  @IsNotEmpty()
  county: string;

  @ApiPropertyOptional({ example: 'Westlands' })
  @IsString()
  @IsOptional()
  subCounty?: string;

  @ApiPropertyOptional({ example: 'Next to ABC Place' })
  @IsString()
  @IsOptional()
  locationDescription?: string;

  @ApiProperty({ example: 0.5, description: 'Size in Acres' })
  @IsNumber()
  @Min(0.01)
  acreage: number;

  @ApiProperty({ example: 'RESIDENTIAL', enum: ['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL'] })
  @IsString()
  @IsNotEmpty()
  landUse: string;

  @ApiProperty({ example: 'John Doe', description: 'Name on the Title Deed' })
  @IsString()
  @IsNotEmpty()
  registeredOwner: string;
}

export class VehicleAssetDetailsRequestDto {
  @ApiProperty({ example: 'KAA 123A', description: 'Number Plate' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9\s]+$/)
  registrationNumber: string;

  @ApiProperty({ example: 'ABC1234567890XYZ', description: 'Chassis Number' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  chassisNumber: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'Logbook Serial Number' })
  @IsString()
  @IsOptional()
  logbookNumber?: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({ example: 'Harrier' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2018 })
  @IsInt()
  @Min(1900)
  year: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  engineNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;
}

export class FinancialAssetDetailsRequestDto {
  @ApiProperty({ example: 'KCB Bank' })
  @IsString()
  @IsNotEmpty()
  institutionName: string;

  @ApiProperty({ example: '1100220033' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: 'SAVINGS' })
  @IsString()
  @IsNotEmpty()
  accountType: string;

  @ApiPropertyOptional({ example: 'Karen Branch' })
  @IsString()
  @IsOptional()
  branchName?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isJointAccount: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  jointAccountHolders?: string[];
  @ApiProperty({ example: 'KES', description: 'Currency of the account' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be a 3-letter ISO code' })
  currency: string;
}

export class BusinessAssetDetailsRequestDto {
  @ApiProperty({ example: 'Doe Enterprises Ltd' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ example: 'PVT-123456' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({
    example: 'LIMITED_COMPANY',
    enum: ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'LLP'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'LLP'])
  businessType: string;

  @ApiProperty({ example: 50, description: 'Percentage ownership' })
  @IsNumber()
  @Min(0)
  @Max(100)
  shareholdingPercentage: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  numberOfShares?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  registeredAddress?: string;
}
