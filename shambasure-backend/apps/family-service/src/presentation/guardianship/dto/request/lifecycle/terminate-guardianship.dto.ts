import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TerminateGuardianshipDto {
  @ApiProperty({
    description: 'Detailed legal or practical reason for closing the file',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;

  @ApiProperty({
    description: 'Date the guardianship legally ends',
    example: '2025-12-31',
  })
  @IsDateString()
  terminationDate: Date;
}
