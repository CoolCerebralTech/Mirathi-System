import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WillStatus } from '../../../../domain/enums/will-status.enum';
import { WillType } from '../../../../domain/enums/will-type.enum';

export class WillSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  testatorId: string;

  @ApiProperty({ enum: WillStatus })
  status: WillStatus;

  @ApiProperty({ enum: WillType })
  type: WillType;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  isRevoked: boolean;

  @ApiProperty()
  hasCodicils: boolean;

  @ApiProperty()
  hasDisinheritance: boolean;

  @ApiPropertyOptional()
  executionDate?: string;

  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  validationErrorsCount: number;
}
