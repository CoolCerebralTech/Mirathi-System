import { ApiProperty } from '@nestjs/swagger';

import { ApplicationStatus } from '../../../../domain/aggregates/probate-application.aggregate';

export class ApplicationSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  estateId: string;

  @ApiProperty({ example: 'Late John Doe' })
  deceasedName: string;

  @ApiProperty({ example: 'Grant of Probate' })
  applicationType: string;

  @ApiProperty({ enum: ApplicationStatus })
  status: ApplicationStatus;

  @ApiProperty({ example: 'High Court Nairobi' })
  courtName: string;

  @ApiProperty({ example: 45 })
  progressPercentage: number;

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty({ example: 'Sign Forms' })
  nextAction: string;
}

export class ApplicationListResponseDto {
  @ApiProperty({ type: [ApplicationSummaryResponseDto] })
  items: ApplicationSummaryResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 1 })
  pages: number;
}
