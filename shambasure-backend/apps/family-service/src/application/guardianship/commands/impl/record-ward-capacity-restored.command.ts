import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { BaseCommand } from '../base.command';

export class UpdateSpecialInstructionsCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'UpdateSpecialInstructionsCommand',
  })
  getCommandName(): string {
    return 'UpdateSpecialInstructionsCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'New special instructions',
    example: 'Guardian must consult with family council quarterly and submit minutes',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  readonly specialInstructions: string;

  @ApiPropertyOptional({
    description: 'Court order reference for instructions',
    example: 'HC/SUCC/INST/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderReference?: string;

  @ApiPropertyOptional({
    description: 'Instructions from (e.g., Testator, Court, Family Council)',
    example: 'FAMILY_COUNCIL',
  })
  @IsOptional()
  @IsString()
  readonly instructionsFrom?: string;

  @ApiPropertyOptional({
    description: 'Priority level of instructions',
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  readonly priority?: string;

  @ApiPropertyOptional({
    description: 'Instructions effective date',
    example: '2024-02-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  readonly effectiveDate?: string;

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      specialInstructions: string;
      courtOrderReference?: string;
      instructionsFrom?: string;
      priority?: string;
      effectiveDate?: string;
    },
  ) {
    super(commandId, timestamp, userId, correlationId);
    this.guardianshipId = data.guardianshipId;
    this.specialInstructions = data.specialInstructions;
    this.courtOrderReference = data.courtOrderReference;
    this.instructionsFrom = data.instructionsFrom;
    this.priority = data.priority;
    this.effectiveDate = data.effectiveDate;
  }
}
