import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { DependantStatus } from '../../../../../domain/entities/legal-dependant.entity';
import { PaginationDto } from '../common/pagination.dto';

export class GetEstateDependantsDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsOptional()
  @IsEnum(DependantStatus)
  status?: DependantStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasHighRisk?: boolean; // Filter "High Risk" dependants (Minors/Incapacitated)

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  requiresCourtDetermination?: boolean;
}
