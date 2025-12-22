import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class UpdateRestrictionsCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'UpdateRestrictionsCommand',
  })
  getCommandName(): string {
    return 'UpdateRestrictionsCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'New restrictions (JSON format)',
    example: {
      travelRestrictions: ['Cannot travel out of county without court approval'],
      financialLimits: { maximumWithdrawalPerMonth: 50000 },
      propertyRestrictions: ['Cannot mortgage property'],
    },
  })
  @IsNotEmpty()
  readonly restrictions: any;

  @ApiPropertyOptional({
    description: 'Court order number for restriction update',
    example: 'HC/SUCC/RES/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Reason for restriction update',
    example: 'Concerns about financial mismanagement',
  })
  @IsOptional()
  @IsString()
  readonly updateReason?: string;

  @ApiPropertyOptional({
    description: 'Effective date of new restrictions',
    example: '2024-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  readonly effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Review date for restrictions',
    example: '2025-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  readonly reviewDate?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      restrictions: any;
      courtOrderNumber?: string;
      updateReason?: string;
      effectiveDate?: string;
      reviewDate?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);
    this.guardianshipId = data.guardianshipId;
    this.restrictions = data.restrictions;
    this.courtOrderNumber = data.courtOrderNumber;
    this.updateReason = data.updateReason;
    this.effectiveDate = data.effectiveDate;
    this.reviewDate = data.reviewDate;
  }
}
