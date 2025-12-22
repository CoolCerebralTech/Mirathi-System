// application/guardianship/commands/impl/terminate-guardianship.command.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { BaseCommand } from '../base.command';

export enum TerminationReason {
  WARD_CAME_OF_AGE = 'WARD_CAME_OF_AGE',
  COURT_ORDER = 'COURT_ORDER',
  GUARDIAN_RESIGNATION = 'GUARDIAN_RESIGNATION',
  GUARDIAN_DECEASED = 'GUARDIAN_DECEASED',
  GUARDIAN_INCAPACITATED = 'GUARDIAN_INCAPACITATED',
  WARD_DECEASED = 'WARD_DECEASED',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  COMPLETION_OF_PURPOSE = 'COMPLETION_OF_PURPOSE',
  BOND_LAPSED = 'BOND_LAPSED',
  COURT_REVOCATION = 'COURT_REVOCATION',
  OTHER = 'OTHER',
}

export class TerminateGuardianshipCommand extends BaseCommand {
  @ApiProperty({
    description: 'Command name',
    example: 'TerminateGuardianshipCommand',
  })
  getCommandName(): string {
    return 'TerminateGuardianshipCommand';
  }

  @ApiProperty({
    description: 'Guardianship ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  readonly guardianshipId: string;

  @ApiProperty({
    description: 'Termination reason as per Kenyan law',
    enum: TerminationReason,
    example: TerminationReason.WARD_CAME_OF_AGE,
  })
  @IsNotEmpty()
  @IsEnum(TerminationReason)
  readonly reason: TerminationReason;

  @ApiProperty({
    description: 'Effective termination date',
    example: '2024-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  readonly terminationDate: Date;

  @ApiPropertyOptional({
    description: 'Detailed explanation of termination',
    example: 'Ward has reached 18 years of age and is now legally an adult',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  readonly explanation?: string;

  @ApiPropertyOptional({
    description: 'Court order number for termination (if applicable)',
    example: 'HC/SUCC/TERM/123/2024',
  })
  @IsOptional()
  @IsString()
  readonly courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Final account balance handed over (KES)',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  readonly finalAccountBalanceKES?: number;

  @ApiPropertyOptional({
    description: 'ID of new guardian (if guardianship is being transferred)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID('4')
  readonly newGuardianId?: string;

  @ApiPropertyOptional({
    description: 'Certificate of completion reference',
    example: 'CERT/COMPL/2024/001',
  })
  @IsOptional()
  @IsString()
  readonly completionCertificate?: string;

  @ApiPropertyOptional({
    description: 'List of properties transferred',
    example: ['Title Deed No. 123/456', 'Vehicle KAA 123A'],
  })
  @IsOptional()
  readonly propertiesTransferred?: string[];

  constructor(
    commandId: string,
    timestamp: Date,
    userId: string,
    correlationId: string | undefined,
    data: {
      guardianshipId: string;
      reason: TerminationReason;
      terminationDate: Date;
      explanation?: string;
      courtOrderNumber?: string;
      finalAccountBalanceKES?: number;
      newGuardianId?: string;
      completionCertificate?: string;
      propertiesTransferred?: string[];
    },
  ) {
    super(correlationId);
    this.commandId = commandId;
    this.timestamp = timestamp;
    this.userId = userId;
    this.guardianshipId = data.guardianshipId;
    this.reason = data.reason;
    this.terminationDate = data.terminationDate;
    this.explanation = data.explanation;
    this.courtOrderNumber = data.courtOrderNumber;
    this.finalAccountBalanceKES = data.finalAccountBalanceKES;
    this.newGuardianId = data.newGuardianId;
    this.completionCertificate = data.completionCertificate;
    this.propertiesTransferred = data.propertiesTransferred;
  }
}
