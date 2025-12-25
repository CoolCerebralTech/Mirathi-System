import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum ReviewOutcome {
  ACCEPT = 'ACCEPT',
  REQUEST_AMENDMENT = 'REQUEST_AMENDMENT',
}

export enum CourtFeedbackType {
  APPROVAL = 'APPROVAL',
  REVISION = 'REVISION', // Minor changes
  REJECTION = 'REJECTION', // Major issues
  QUERY = 'QUERY', // Clarification needed
}

export class ReviewComplianceDto {
  @ApiProperty({ enum: ReviewOutcome })
  @IsEnum(ReviewOutcome)
  outcome: ReviewOutcome;

  @ApiPropertyOptional({
    description: 'Required if requesting amendment',
    enum: CourtFeedbackType,
  })
  @ValidateIf((o) => o.outcome === ReviewOutcome.REQUEST_AMENDMENT)
  @IsEnum(CourtFeedbackType)
  feedbackType?: CourtFeedbackType;

  @ApiPropertyOptional({
    description: 'Comments from the court officer or reviewer',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Specific action required by the guardian',
  })
  @ValidateIf((o) => o.outcome === ReviewOutcome.REQUEST_AMENDMENT)
  @IsString()
  actionRequired?: string;

  @ApiPropertyOptional({
    description: 'New deadline if amendment is requested',
  })
  @IsOptional()
  @IsDateString()
  newDeadline?: Date;
}
