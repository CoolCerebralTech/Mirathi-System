import { DebtType, KenyanTaxType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DebtCreditorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsObject()
  @IsOptional()
  address?: Record<string, any>;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[A]{1}\d{9}[A-Z]{1}$/, { message: 'Invalid KRA PIN format' })
  kraPin?: string;
}

export class DebtTermsDto {
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  interestRate?: number;

  @IsString()
  @IsOptional()
  interestType?: string;

  @IsString()
  @IsOptional()
  compoundingFrequency?: string;
}

export class CreateDebtDto {
  @IsEnum(DebtType)
  type: DebtType;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  principalAmount: number;

  @IsString()
  currency: string = 'KES';

  @ValidateNested()
  @Type(() => DebtCreditorDto)
  creditor: DebtCreditorDto;

  // Asset linkage
  @IsString()
  @IsOptional()
  assetId?: string;

  // Tax-specific fields
  @IsEnum(KenyanTaxType)
  @IsOptional()
  @ValidateIf((o) => o.type === DebtType.TAX_OBLIGATION)
  taxType?: KenyanTaxType;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.type === DebtType.TAX_OBLIGATION)
  @Matches(/^[A]{1}\d{9}[A-Z]{1}$/, { message: 'Invalid KRA PIN format' })
  kraPin?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.type === DebtType.TAX_OBLIGATION)
  taxPeriod?: string;

  // Terms
  @ValidateNested()
  @Type(() => DebtTermsDto)
  @IsOptional()
  terms?: DebtTermsDto;

  // Security
  @IsBoolean()
  @IsOptional()
  isSecured?: boolean = false;

  @IsString()
  @IsOptional()
  securityDetails?: string;

  @IsString()
  @IsOptional()
  collateralDescription?: string;

  // Legal
  @IsBoolean()
  @IsOptional()
  requiresCourtApproval?: boolean = false;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  incurredDate?: Date;
}
