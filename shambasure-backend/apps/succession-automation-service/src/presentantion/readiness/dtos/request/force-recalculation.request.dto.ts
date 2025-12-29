import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ForceRecalculationRequestDto {
  @ApiPropertyOptional({
    description: 'Reason for forcing the recalculation (for audit logs)',
    example: 'Manual refresh after family member update',
  })
  @IsString()
  @IsOptional()
  triggerReason?: string;
}
