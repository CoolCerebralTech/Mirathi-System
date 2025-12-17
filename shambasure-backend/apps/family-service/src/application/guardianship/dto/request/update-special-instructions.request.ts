// application/guardianship/dto/request/update-special-instructions.request.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSpecialInstructionsRequest {
  @ApiProperty({
    description: 'Guardianship ID',
    example: 'grd-1234567890',
  })
  @IsString()
  @IsNotEmpty()
  guardianshipId: string;

  @ApiProperty({
    description: 'Updated special instructions',
    example:
      'Guardian must provide quarterly medical reports and educational progress updates to the court',
  })
  @IsString()
  @IsNotEmpty()
  instructions: string;
}
