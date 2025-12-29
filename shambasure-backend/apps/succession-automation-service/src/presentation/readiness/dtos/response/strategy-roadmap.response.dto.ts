import { ApiProperty } from '@nestjs/swagger';

class MilestoneDto {
  @ApiProperty({ example: 'Document Verification' })
  title: string;

  @ApiProperty({ example: true })
  isCompleted: boolean;

  @ApiProperty({
    type: [String],
    description: 'IDs of risks preventing this milestone completion',
    example: [],
  })
  blockers: string[];
}

export class StrategyRoadmapResponseDto {
  @ApiProperty({
    description: 'Full legal strategy in Markdown format',
    example: '## Case Strategy\n\nFile P&A 80 at High Court...',
  })
  strategyContent: string;

  @ApiProperty({ type: [MilestoneDto] })
  milestones: MilestoneDto[];

  @ApiProperty({ description: 'Estimated court filing fees in KES', example: 5000 })
  filingFeeEstimate: number;
}
