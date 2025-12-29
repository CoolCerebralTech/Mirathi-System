import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class OverrideStrategyRequestDto {
  @ApiProperty({
    description: 'The new Markdown formatted strategy text',
    minLength: 50,
    example: '## Amended Strategy\n\nDue to the High Court ruling on...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  newStrategy: string;

  @ApiProperty({
    description: 'Why is the system strategy being overridden?',
    example: 'System failed to account for specific Court Order dated 2024-01-01',
  })
  @IsString()
  @IsNotEmpty()
  reasonForOverride: string;
}
