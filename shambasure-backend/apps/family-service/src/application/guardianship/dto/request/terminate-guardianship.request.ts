// application/guardianship/dto/request/terminate-guardianship.request.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TerminateGuardianshipRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Reason for termination',
    example: 'Ward reached majority age (18 years)',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Date of termination',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  terminationDate: Date;

  @ApiPropertyOptional({
    description: 'Court order number for termination (if court-ordered)',
    example: 'HC/TERM/456/2024',
  })
  @IsOptional()
  @IsString()
  courtOrderNumber?: string;
}
