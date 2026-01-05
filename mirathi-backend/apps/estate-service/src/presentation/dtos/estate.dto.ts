// =============================================================================
// ESTATE SERVICE - DTOs (Data Transfer Objects)
// =============================================================================
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

// =============================================================================
// ESTATE DTOs
// =============================================================================

export class CreateEstateDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'John Kamau' })
  @IsString()
  userName: string;

  @ApiPropertyOptional({ example: 'A123456789X' })
  @IsOptional()
  @IsString()
  @Matches(/^A\d{9}[A-Z]$/, { message: 'Invalid KRA PIN format' })
  kraPin?: string;
}

export class EstateSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userName: string;

  @ApiProperty({ example: 5000000 })
  totalAssets: number;

  @ApiProperty({ example: 500000 })
  totalDebts: number;

  @ApiProperty({ example: 4500000 })
  netWorth: number;

  @ApiProperty()
  isInsolvent: boolean;

  @ApiProperty()
  assetCount: number;

  @ApiProperty()
  debtCount: number;

  @ApiProperty()
  createdAt: Date;
}

// =============================================================================
// ASSET DTOs
// =============================================================================

export enum AssetCategory {
  LAND = 'LAND',
  PROPERTY = 'PROPERTY',
  VEHICLE = 'VEHICLE',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  INVESTMENT = 'INVESTMENT',
  BUSINESS = 'BUSINESS',
  LIVESTOCK = 'LIVESTOCK',
  PERSONAL_EFFECTS = 'PERSONAL_EFFECTS',
  OTHER = 'OTHER',
}

export class AddAssetDto {
  @ApiProperty({ example: 'Land in Kiambu' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({ example: 'Half-acre plot near Thika Road' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AssetCategory })
  @IsEnum(AssetCategory)
  category: AssetCategory;

  @ApiProperty({ example: 3500000 })
  @IsNumber()
  @Min(0)
  estimatedValue: number;

  @ApiPropertyOptional({ example: '2020-05-15' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  purchaseDate?: Date;

  @ApiPropertyOptional({ example: 'Kiambu County' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEncumbered?: boolean;

  @ApiPropertyOptional({ example: 'Mortgage of KES 2M with Equity Bank' })
  @IsOptional()
  @IsString()
  encumbranceDetails?: string;
}

export enum LandCategory {
  RESIDENTIAL = 'RESIDENTIAL',
  AGRICULTURAL = 'AGRICULTURAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  VACANT = 'VACANT',
}

export enum KenyanCounty {
  NAIROBI = 'NAIROBI',
  KIAMBU = 'KIAMBU',
  NAKURU = 'NAKURU',
  MOMBASA = 'MOMBASA',
  KISUMU = 'KISUMU',
  // ... add all 47 counties
}

export class AddLandAssetDto extends AddAssetDto {
  @ApiProperty({ example: 'KIAMBU/THIKA/12345' })
  @IsString()
  titleDeedNumber: string;

  @ApiPropertyOptional({ example: 'KIAMBU/THIKA/BLOCK 1/678' })
  @IsOptional()
  @IsString()
  parcelNumber?: string;

  @ApiProperty({ enum: KenyanCounty })
  @IsEnum(KenyanCounty)
  county: KenyanCounty;

  @ApiPropertyOptional({ example: 'Thika Sub-County' })
  @IsOptional()
  @IsString()
  subCounty?: string;

  @ApiProperty({ enum: LandCategory })
  @IsEnum(LandCategory)
  landCategory: LandCategory;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sizeInAcres?: number;
}

export enum VehicleCategory {
  PERSONAL_CAR = 'PERSONAL_CAR',
  COMMERCIAL_VEHICLE = 'COMMERCIAL_VEHICLE',
  MOTORCYCLE = 'MOTORCYCLE',
  TRACTOR = 'TRACTOR',
}

export class AddVehicleAssetDto extends AddAssetDto {
  @ApiProperty({ example: 'KCA 123A' })
  @IsString()
  @Matches(/^K[A-Z]{2}\s?\d{3}[A-Z]$/, { message: 'Invalid KE registration number' })
  registrationNumber: string;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  make: string;

  @ApiProperty({ example: 'Fielder' })
  @IsString()
  model: string;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiProperty({ enum: VehicleCategory })
  @IsEnum(VehicleCategory)
  vehicleCategory: VehicleCategory;
}

export class UpdateAssetValueDto {
  @ApiProperty({ example: 4000000 })
  @IsNumber()
  @Min(0)
  estimatedValue: number;

  @ApiPropertyOptional({ example: 'Updated after professional valuation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class VerifyAssetDto {
  @ApiProperty()
  @IsString()
  proofDocumentUrl: string;
}

export class AssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: AssetCategory;

  @ApiProperty()
  estimatedValue: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isEncumbered: boolean;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  landDetails?: {
    titleDeedNumber: string;
    county: string;
    landCategory: string;
    sizeInAcres?: number;
  };

  @ApiPropertyOptional()
  vehicleDetails?: {
    registrationNumber: string;
    make: string;
    model: string;
    year?: number;
  };

  @ApiProperty()
  createdAt: Date;
}

// =============================================================================
// DEBT DTOs
// =============================================================================

export enum DebtCategory {
  MORTGAGE = 'MORTGAGE',
  BANK_LOAN = 'BANK_LOAN',
  SACCO_LOAN = 'SACCO_LOAN',
  PERSONAL_LOAN = 'PERSONAL_LOAN',
  MOBILE_LOAN = 'MOBILE_LOAN',
  FUNERAL_EXPENSES = 'FUNERAL_EXPENSES',
  MEDICAL_BILLS = 'MEDICAL_BILLS',
  TAXES_OWED = 'TAXES_OWED',
  OTHER = 'OTHER',
}

export enum DebtPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class AddDebtDto {
  @ApiProperty({ example: 'Equity Bank Kenya' })
  @IsString()
  @Length(1, 200)
  creditorName: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  creditorContact?: string;

  @ApiProperty({ example: 'Home mortgage' })
  @IsString()
  description: string;

  @ApiProperty({ enum: DebtCategory })
  @IsEnum(DebtCategory)
  category: DebtCategory;

  @ApiProperty({ enum: DebtPriority })
  @IsEnum(DebtPriority)
  priority: DebtPriority;

  @ApiProperty({ example: 2000000 })
  @IsNumber()
  @Min(0)
  originalAmount: number;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(0)
  outstandingBalance: number;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSecured?: boolean;

  @ApiPropertyOptional({ example: 'Secured against plot in Kiambu' })
  @IsOptional()
  @IsString()
  securityDetails?: string;
}

export class PayDebtDto {
  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @ApiPropertyOptional({ example: 'M-Pesa payment' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class DebtResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  creditorName: string;

  @ApiProperty()
  category: DebtCategory;

  @ApiProperty()
  priority: DebtPriority;

  @ApiProperty()
  originalAmount: number;

  @ApiProperty()
  outstandingBalance: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isSecured: boolean;

  @ApiProperty()
  createdAt: Date;
}

// =============================================================================
// WILL DTOs
// =============================================================================

export class CreateWillDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'John Kamau Mwangi' })
  @IsString()
  testatorName: string;

  @ApiPropertyOptional({ example: 'Mary Wanjiku Kamau' })
  @IsOptional()
  @IsString()
  executorName?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  executorPhone?: string;

  @ApiPropertyOptional({ example: 'mary@example.com' })
  @IsOptional()
  @IsEmail()
  executorEmail?: string;

  @ApiPropertyOptional({ example: 'Daughter' })
  @IsOptional()
  @IsString()
  executorRelationship?: string;
}

export enum BeneficiaryType {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  FRIEND = 'FRIEND',
  CHARITY = 'CHARITY',
  OTHER = 'OTHER',
}

export enum BequestType {
  SPECIFIC_ASSET = 'SPECIFIC_ASSET',
  PERCENTAGE = 'PERCENTAGE',
  CASH_AMOUNT = 'CASH_AMOUNT',
  RESIDUAL = 'RESIDUAL',
}

export class AddBeneficiaryDto {
  @ApiProperty({ example: 'Jane Wanjiru Kamau' })
  @IsString()
  beneficiaryName: string;

  @ApiProperty({ enum: BeneficiaryType })
  @IsEnum(BeneficiaryType)
  beneficiaryType: BeneficiaryType;

  @ApiPropertyOptional({ example: 'Daughter' })
  @IsOptional()
  @IsString()
  relationship?: string;

  @ApiProperty({ enum: BequestType })
  @IsEnum(BequestType)
  bequestType: BequestType;

  @ApiPropertyOptional({ example: 'asset-uuid-here' })
  @IsOptional()
  @IsString()
  assetId?: string;

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

  @ApiProperty({ example: 'My daughter Jane will receive 30% of my estate' })
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasConditions?: boolean;

  @ApiPropertyOptional({ example: 'Only after completing university' })
  @IsOptional()
  @IsString()
  conditions?: string;
}

export class AddWitnessDto {
  @ApiProperty({ example: 'Peter Omondi Otieno' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @Length(7, 8)
  nationalId?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'peter@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Nairobi, Kenya' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class WillCompletenessDto {
  @ApiProperty()
  isComplete: boolean;

  @ApiProperty({ example: 60 })
  completenessScore: number;

  @ApiProperty()
  hasExecutor: boolean;

  @ApiProperty()
  hasBeneficiaries: boolean;

  @ApiProperty()
  hasWitnesses: boolean;

  @ApiProperty()
  witnessCount: number;

  @ApiProperty({ type: [String] })
  warnings: string[];

  @ApiProperty({ type: [String] })
  requiredActions: string[];
}

export class WillPreviewDto {
  @ApiProperty()
  willId: string;

  @ApiProperty()
  testatorName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  versionNumber: number;

  @ApiPropertyOptional()
  executor?: {
    name: string;
    relationship?: string;
    contact?: string;
  };

  @ApiProperty({ type: [Object] })
  beneficiaries: Array<{
    name: string;
    type: string;
    bequest: string;
    description: string;
  }>;

  @ApiProperty({ type: [Object] })
  witnesses: Array<{
    name: string;
    status: string;
    signedAt?: Date;
  }>;

  @ApiPropertyOptional()
  funeralWishes?: string;

  @ApiPropertyOptional()
  burialLocation?: string;

  @ApiProperty()
  completeness: WillCompletenessDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  htmlPreview: string; // The formatted HTML preview
}
