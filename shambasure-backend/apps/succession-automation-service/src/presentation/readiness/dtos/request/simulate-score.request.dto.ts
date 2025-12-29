import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SimulateScoreRequestDto {
  @ApiProperty({
    description: 'List of Risk IDs to tentatively resolve in the simulation',
    type: [String],
    example: ['uuid-risk-1', 'uuid-risk-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  risksToResolve: string[];
}
