import { ApiProperty } from '@nestjs/swagger';

import { WillSummaryResponseDto } from './will-summary.response.dto';

export class PaginatedWillResponseDto {
  @ApiProperty({ type: [WillSummaryResponseDto] })
  items: WillSummaryResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrevious: boolean;
}
