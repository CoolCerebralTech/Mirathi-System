import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class InitializeAssessmentRequestDto {
  @ApiProperty({
    description: 'The UUID of the Estate to assess',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @ApiProperty({
    description: 'The UUID of the Family aggregate associated with this estate',
    example: '987fcdeb-51a2-43c1-z567-123456789012',
  })
  @IsUUID()
  @IsNotEmpty()
  familyId: string;
}
