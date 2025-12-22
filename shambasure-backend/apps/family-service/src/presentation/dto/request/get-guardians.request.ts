// application/guardianship/dto/request/post-bond.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PostBondRequest {
  @ApiProperty({
    description: 'Insurance company or bond provider name',
    example: 'Kenya Reinsurance Corporation',
  })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiProperty({
    description: 'Bond policy number',
    example: 'BOND-KRC-2024-001',
  })
  @IsNotEmpty()
  @IsString()
  policyNumber: string;

  @ApiProperty({
    description: 'Bond expiry date (must be in future)',
    example: '2025-01-15T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  expiryDate: Date;

  @ApiPropertyOptional({
    description: 'Bond amount override (if different from original)',
    example: 1500000,
  })
  @IsOptional()
  @Min(0)
  bondAmountKES?: number;

  @ApiPropertyOptional({
    description: 'Court order reference for bond approval',
    example: 'HC/SUCC/BOND/123/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderReference?: string;

  @ApiPropertyOptional({
    description: 'Premium payment receipt number',
    example: 'REC-KRA-2024-123456',
  })
  @IsOptional()
  @IsString()
  premiumReceiptNumber?: string;
}
