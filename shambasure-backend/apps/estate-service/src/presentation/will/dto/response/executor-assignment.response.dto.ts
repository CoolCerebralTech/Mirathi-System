import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { WillStatus } from '../../../../domain/enums/will-status.enum';

export class ExecutorAssignmentResponseDto {
  @ApiProperty()
  willId: string;

  @ApiProperty()
  testatorId: string;

  @ApiProperty({ enum: WillStatus })
  willStatus: WillStatus;

  @ApiProperty({ enum: ['PRIMARY', 'SUBSTITUTE', 'CO_EXECUTOR'] })
  myRole: 'PRIMARY' | 'SUBSTITUTE' | 'CO_EXECUTOR';

  @ApiPropertyOptional()
  myOrder?: number;

  @ApiProperty()
  appointmentDate: string;

  @ApiProperty({ enum: ['PENDING', 'CONSENTED', 'DECLINED', 'UNKNOWN'] })
  consentStatus: 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN';

  @ApiProperty()
  isQualified: boolean;

  @ApiPropertyOptional()
  disqualificationRisk?: string;

  @ApiProperty()
  compensationSummary: string;

  @ApiProperty()
  actionRequired: boolean;

  @ApiPropertyOptional()
  actionLabel?: string;
}
