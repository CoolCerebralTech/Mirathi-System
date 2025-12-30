import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SuspendGuardianDto {
  @ApiProperty({
    description: 'Detailed reason for suspension (e.g., Conflict of Interest detected)',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
