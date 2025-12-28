import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../common/pagination.dto';

export class GetGiftsInterVivosDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInHotchpotOnly?: boolean; // Only show gifts that affect distribution

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isContested?: boolean;
}
