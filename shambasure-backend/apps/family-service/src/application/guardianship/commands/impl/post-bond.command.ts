import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { BaseCommand } from '../base.command';

export class PostBondCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'PostBondCommand',
  })
  getCommandName(): string {
    return 'PostBondCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'Insurance company or bond provider name',
    example: 'Kenya Reinsurance Corporation',
  })
  @IsNotEmpty()
  @IsString()
  readonly provider: string;

  @ApiProperty({
    description: 'Bond policy number',
    example: 'BOND-KRC-2024-001',
  })
  @IsNotEmpty()
  @IsString()
  readonly policyNumber: string;

  @ApiProperty({
    description: 'Bond expiry date (must be in future)',
    example: '2025-01-15T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly expiryDate: Date;

  @ApiPropertyOptional({
    description: 'Bond amount override (if different from original)',
    example: 1500000,
  })
  @IsOptional()
  @Min(0)
  readonly bondAmountKES?: number;

  @ApiPropertyOptional({
    description: 'Court order reference for bond approval',
    example: 'HC/SUCC/BOND/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderReference?: string;

  @ApiPropertyOptional({
    description: 'Premium payment receipt number',
    example: 'REC-KRA-2024-123456',
  })
  @IsOptional()
  @IsString()
  readonly premiumReceiptNumber?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      provider: string;
      policyNumber: string;
      expiryDate: Date;
      bondAmountKES?: number;
      courtOrderReference?: string;
      premiumReceiptNumber?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);
    this.guardianshipId = data.guardianshipId;
    this.provider = data.provider;
    this.policyNumber = data.policyNumber;
    this.expiryDate = data.expiryDate;
    this.bondAmountKES = data.bondAmountKES;
    this.courtOrderReference = data.courtOrderReference;
    this.premiumReceiptNumber = data.premiumReceiptNumber;
  }
}
