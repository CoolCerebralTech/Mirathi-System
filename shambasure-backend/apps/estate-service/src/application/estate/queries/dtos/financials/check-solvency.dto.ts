import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CheckSolvencyDto {
  @IsUUID()
  @IsNotEmpty()
  estateId: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeProjectedDebts?: boolean; // Include projected interest?
}
