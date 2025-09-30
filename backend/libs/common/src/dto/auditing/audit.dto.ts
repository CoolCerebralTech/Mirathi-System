import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../shared/pagination.dto';

export class AuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  action?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  userId?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  endDate?: string;
}