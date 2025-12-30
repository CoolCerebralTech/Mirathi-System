import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// 1. Pay Fee
export class PayFilingFeeRequestDto {
  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'MPESA' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ description: 'M-PESA Code or Bank Ref', example: 'QW12345678' })
  @IsString()
  @IsNotEmpty()
  paymentReference: string;
}

// 2. Submit Filing
export class SubmitFilingRequestDto {
  @ApiProperty({ enum: ['E_FILING', 'PHYSICAL', 'COURT_REGISTRY'], example: 'E_FILING' })
  @IsEnum(['E_FILING', 'PHYSICAL', 'COURT_REGISTRY'])
  filingMethod: 'E_FILING' | 'PHYSICAL' | 'COURT_REGISTRY';

  @ApiPropertyOptional({
    description: 'If filing physically, the case number assigned',
    example: 'E123/2024',
  })
  @IsString()
  @IsOptional()
  courtCaseNumber?: string;

  @ApiPropertyOptional({ example: 'RCPT-998877' })
  @IsString()
  @IsOptional()
  courtReceiptNumber?: string;
}

// 3. Record Court Outcome
export class RecordCourtResponseRequestDto {
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED', 'QUERIED'] })
  @IsEnum(['ACCEPTED', 'REJECTED', 'QUERIED'])
  outcome: 'ACCEPTED' | 'REJECTED' | 'QUERIED';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  queries?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amendmentsRequired?: string[];

  @ApiProperty({ example: '2024-05-20T10:00:00Z' })
  @IsDateString()
  responseDate: string;
}

// 4. Record Grant (Final)
export class RecordGrantRequestDto {
  @ApiProperty({ example: 'GP-2024-123' })
  @IsString()
  @IsNotEmpty()
  grantNumber: string;

  @ApiProperty({ example: 'Hon. J. Mwangi' })
  @IsString()
  @IsNotEmpty()
  issuedByRegistrar: string;

  @ApiProperty({ example: 'Grant of Probate' })
  @IsString()
  @IsNotEmpty()
  grantType: string;

  @ApiProperty({ example: '2024-06-01T09:00:00Z' })
  @IsDateString()
  issuedDate: string;
}
