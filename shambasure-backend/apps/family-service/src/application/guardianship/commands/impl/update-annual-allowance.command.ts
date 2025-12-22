// application/guardianship/commands/impl/update-annual-allowance.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { BaseCommand } from '../base.command';

export class UpdateAnnualAllowanceCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'UpdateAnnualAllowanceCommand',
  })
  getCommandName(): string {
    return 'UpdateAnnualAllowanceCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'New annual allowance amount in KES',
    example: 300000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  readonly amount: number;

  @ApiProperty({
    description: 'ID of person approving allowance (Court Registrar ID)',
    example: 'CR-001',
  })
  @IsNotEmpty()
  @IsString()
  readonly approvedBy: string;

  @ApiPropertyOptional({
    description: 'Court order reference for allowance approval',
    example: 'HC/SUCC/ALLOW/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderReference?: string;

  @ApiPropertyOptional({
    description: 'Breakdown of allowance components',
    example: {
      education: 120000,
      clothing: 30000,
      medical: 60000,
      entertainment: 30000,
      miscellaneous: 60000,
    },
  })
  @IsOptional()
  readonly breakdown?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Effective date of new allowance',
    example: '2024-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  readonly effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Review period (months)',
    example: 12,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  readonly reviewPeriodMonths?: number;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      amount: number;
      approvedBy: string;
      courtOrderReference?: string;
      breakdown?: Record<string, number>;
      effectiveDate?: string;
      reviewPeriodMonths?: number;
    },
  ) {
    super(correlationId);
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.guardianshipId = data.guardianshipId;
    this.amount = data.amount;
    this.approvedBy = data.approvedBy;
    this.courtOrderReference = data.courtOrderReference;
    this.breakdown = data.breakdown;
    this.effectiveDate = data.effectiveDate;
    this.reviewPeriodMonths = data.reviewPeriodMonths;
  }
}
