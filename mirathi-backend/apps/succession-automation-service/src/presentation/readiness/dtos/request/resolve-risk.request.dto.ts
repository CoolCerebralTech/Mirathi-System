import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveRiskRequestDto {
  @ApiProperty({
    description: 'Explanation of how the risk was resolved (Legal Audit Trail)',
    example: 'Death certificate obtained from Civil Registration and uploaded to DMS.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  resolutionNotes: string;
}
