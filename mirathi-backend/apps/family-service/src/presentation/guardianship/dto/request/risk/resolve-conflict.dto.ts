import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class ResolveConflictDto {
  @ApiProperty({ description: 'The Guardian involved' })
  @IsUUID()
  guardianId: string;

  @ApiProperty({
    description: 'The index of the conflict in the list (0-based)',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  conflictIndex: number;

  @ApiProperty({
    description: 'How was this issue resolved?',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  resolution: string;

  @ApiPropertyOptional({
    description: 'Steps taken to prevent recurrence (required for HIGH/CRITICAL)',
  })
  @IsOptional()
  @IsString()
  mitigationPlan?: string;
}
