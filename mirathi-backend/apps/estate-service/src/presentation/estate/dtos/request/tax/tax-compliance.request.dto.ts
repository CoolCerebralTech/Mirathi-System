import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class MoneyRequestDto {
  @ApiProperty() amount: number;
  @ApiProperty() currency: string;
}

export class RecordTaxAssessmentRequestDto {
  @ApiProperty({ example: 'KRA/2024/001' })
  @IsString()
  @IsNotEmpty()
  assessmentReference: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  assessmentDate: Date;

  @ApiPropertyOptional({ type: MoneyRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  incomeTax?: MoneyRequestDto;

  @ApiPropertyOptional({ type: MoneyRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  capitalGainsTax?: MoneyRequestDto;

  @ApiPropertyOptional({ type: MoneyRequestDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  stampDuty?: MoneyRequestDto;
}

export class RecordTaxPaymentRequestDto {
  @ApiProperty({ type: MoneyRequestDto })
  @ValidateNested()
  @Type(() => MoneyRequestDto)
  amount: MoneyRequestDto;

  @ApiProperty({ example: 'CGT_PAYMENT' })
  @IsString()
  @IsNotEmpty()
  paymentType: string;

  @ApiProperty({ description: 'Payment Registration Number (PRN)' })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  paymentDate: Date;
}

export class UploadTaxClearanceRequestDto {
  @ApiProperty({ description: 'KRA Tax Clearance Certificate Number' })
  @IsString()
  @IsNotEmpty()
  certificateNumber: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  clearanceDate: Date;

  @ApiPropertyOptional({ description: 'URL to document' })
  @IsString()
  @IsOptional()
  documentUrl?: string;
}
