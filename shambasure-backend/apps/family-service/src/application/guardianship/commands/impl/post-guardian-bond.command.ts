import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class RenewBondCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'RenewBondCommand',
  })
  getCommandName(): string {
    return 'RenewBondCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'New bond expiry date',
    example: '2025-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly newExpiryDate: Date;

  @ApiPropertyOptional({
    description: 'New bond provider (if changing)',
    example: 'APA Insurance',
  })
  @IsOptional()
  @IsString()
  readonly newProvider?: string;

  @ApiPropertyOptional({
    description: 'New policy number',
    example: 'BOND-APA-2024-001',
  })
  @IsOptional()
  @IsString()
  readonly newPolicyNumber?: string;

  @ApiPropertyOptional({
    description: 'Renewal premium amount (KES)',
    example: 15000,
  })
  @IsOptional()
  readonly renewalPremiumKES?: number;

  @ApiPropertyOptional({
    description: 'Renewal receipt number',
    example: 'RENEW-2024-001',
  })
  @IsOptional()
  @IsString()
  readonly renewalReceiptNumber?: string;

  @ApiPropertyOptional({
    description: 'Court approval reference for renewal',
    example: 'HC/SUCC/BOND/RENEW/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtApprovalReference?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      newExpiryDate: Date;
      newProvider?: string;
      newPolicyNumber?: string;
      renewalPremiumKES?: number;
      renewalReceiptNumber?: string;
      courtApprovalReference?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);
    this.guardianshipId = data.guardianshipId;
    this.newExpiryDate = data.newExpiryDate;
    this.newProvider = data.newProvider;
    this.newPolicyNumber = data.newPolicyNumber;
    this.renewalPremiumKES = data.renewalPremiumKES;
    this.renewalReceiptNumber = data.renewalReceiptNumber;
    this.courtApprovalReference = data.courtApprovalReference;
  }
}
