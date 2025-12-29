import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDefined } from 'class-validator';

export class CompleteAssessmentRequestDto {
  @ApiProperty({
    description:
      'Explicit confirmation to lock the assessment and mark it as Ready to File. This action is irreversible.',
    example: true,
  })
  @IsBoolean()
  @IsDefined()
  confirm: boolean;
}
