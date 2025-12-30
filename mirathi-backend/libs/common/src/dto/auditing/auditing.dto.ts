import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../shared/pagination.dto';

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter audit logs by action keyword.' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Filter audit logs by user ID.' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter logs created after this date (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter logs created before this date (ISO 8601).',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
