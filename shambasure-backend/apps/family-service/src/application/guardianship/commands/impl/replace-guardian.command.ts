// application/guardianship/commands/impl/extend-guardianship-term.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

import { BaseCommand } from '../base.command';

export class ExtendGuardianshipTermCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'ExtendGuardianshipTermCommand',
  })
  getCommandName(): string {
    return 'ExtendGuardianshipTermCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'New valid until date',
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly newValidUntil: Date;

  @ApiPropertyOptional({
    description: 'Court order number for extension',
    example: 'HC/SUCC/EXT/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Reason for extension',
    example: 'Ward pursuing higher education beyond age of majority',
  })
  @IsOptional()
  @IsString()
  readonly extensionReason?: string;

  @ApiPropertyOptional({
    description: 'Bond extension required',
    example: true,
  })
  @IsOptional()
  readonly bondExtensionRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Review conditions',
    example: 'Annual review required by family council',
  })
  @IsOptional()
  @IsString()
  readonly reviewConditions?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      newValidUntil: Date;
      courtOrderNumber?: string;
      extensionReason?: string;
      bondExtensionRequired?: boolean;
      reviewConditions?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);

    this.guardianshipId = data.guardianshipId;
    this.newValidUntil = data.newValidUntil;
    this.courtOrderNumber = data.courtOrderNumber;
    this.extensionReason = data.extensionReason;
    this.bondExtensionRequired = data.bondExtensionRequired;
    this.reviewConditions = data.reviewConditions;
  }
}
