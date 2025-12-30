import { ApiProperty } from '@nestjs/swagger';

export class SimulationResultResponseDto {
  @ApiProperty({ example: 60 })
  currentScore: number;

  @ApiProperty({ example: 85 })
  projectedScore: number;

  @ApiProperty({ example: 25 })
  scoreImprovement: number;

  @ApiProperty({ example: 'Ready to File' })
  newStatusLabel: string;

  @ApiProperty({ example: true })
  willBeReadyToFile: boolean;

  @ApiProperty({ description: 'How many blockers would remain even after these fixes', example: 0 })
  remainingBlockersCount: number;
}
