// application/guardianship/commands/impl/grant-property-powers.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { BaseCommand } from '../base.command';

export class GrantPropertyManagementPowersCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'GrantPropertyManagementPowersCommand',
  })
  getCommandName(): string {
    return 'GrantPropertyManagementPowersCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiPropertyOptional({
    description: 'Court order number granting property powers',
    example: 'HC/SUCC/PROP/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderNumber?: string;

  @ApiProperty({
    description: 'Specific powers being granted (JSON format)',
    example: {
      canSellProperty: false,
      canMortgageProperty: false,
      canLeaseProperty: true,
      maximumLeaseTerm: '2 years',
      requiresFamilyConsent: true,
      investmentRestrictions: 'Only government bonds allowed',
    },
  })
  @IsNotEmpty()
  readonly restrictions: any;

  @ApiPropertyOptional({
    description: 'Bond amount increase (if required for property powers)',
    example: 2000000,
  })
  @IsOptional()
  @Min(0)
  readonly increasedBondAmountKES?: number;

  @ApiPropertyOptional({
    description: 'Effective date of property powers',
    example: '2024-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  readonly effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Limitations on property management',
    example: 'Cannot sell ancestral land without family council approval',
  })
  @IsOptional()
  @IsString()
  readonly limitations?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      courtOrderNumber?: string;
      restrictions: any;
      increasedBondAmountKES?: number;
      effectiveDate?: string;
      limitations?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);

    this.guardianshipId = data.guardianshipId;
    this.courtOrderNumber = data.courtOrderNumber;
    this.restrictions = data.restrictions;
    this.increasedBondAmountKES = data.increasedBondAmountKES;
    this.effectiveDate = data.effectiveDate;
    this.limitations = data.limitations;
  }
}
