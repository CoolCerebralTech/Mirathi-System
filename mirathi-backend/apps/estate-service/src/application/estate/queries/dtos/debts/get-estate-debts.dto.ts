import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { DebtStatus } from '../../../../../domain/enums/debt-status.enum';
import { DebtType } from '../../../../../domain/enums/debt-type.enum';
import { PaginationDto } from '../common/pagination.dto';

export class GetEstateDebtsDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsOptional()
  @IsEnum(DebtStatus)
  status?: DebtStatus;

  @IsOptional()
  @IsEnum(DebtType)
  type?: DebtType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isSecured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isStatuteBarred?: boolean; // Filter out legally unenforceable debts

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  sortByPriority?: boolean; // Critical for S.45 Waterfall Visualization
}
