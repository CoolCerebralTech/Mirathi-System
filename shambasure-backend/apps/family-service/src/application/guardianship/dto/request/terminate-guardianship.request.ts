// application/guardianship/dto/request/terminate-guardianship.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum TerminationReason {
  WARD_CAME_OF_AGE = 'WARD_CAME_OF_AGE',
  COURT_ORDER = 'COURT_ORDER',
  GUARDIAN_RESIGNATION = 'GUARDIAN_RESIGNATION',
  GUARDIAN_DECEASED = 'GUARDIAN_DECEASED',
  GUARDIAN_INCAPACITATED = 'GUARDIAN_INCAPACITATED',
  WARD_DECEASED = 'WARD_DECEASED',
  MUTUAL_AGREEMENT = 'MUTUAL_AGREEMENT',
  COMPLETION_OF_PURPOSE = 'COMPLETION_OF_PURPOSE',
  OTHER = 'OTHER',
}

export class TerminateGuardianshipRequest {
  @ApiProperty({
    description: 'Termination reason as per Kenyan law',
    enum: TerminationReason,
    example: TerminationReason.WARD_CAME_OF_AGE,
  })
  @IsNotEmpty()
  @IsEnum(TerminationReason)
  reason: TerminationReason;

  @ApiProperty({
    description: 'Effective termination date',
    example: '2024-12-31T00:00:00.000Z',
  })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  terminationDate: Date;

  @ApiPropertyOptional({
    description: 'Detailed explanation of termination',
    example: 'Ward has reached 18 years of age and is now legally an adult',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Court order number for termination (if applicable)',
    example: 'HC/SUCC/TERM/123/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;

  @ApiPropertyOptional({
    description: 'Final account balance handed over (KES)',
    example: 500000,
  })
  @IsOptional()
  finalAccountBalanceKES?: number;

  @ApiPropertyOptional({
    description: 'ID of new guardian (if guardianship is being transferred)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsString()
  newGuardianId?: string;
}
