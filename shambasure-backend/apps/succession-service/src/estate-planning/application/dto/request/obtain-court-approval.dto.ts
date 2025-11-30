import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class ObtainCourtApprovalDto {
  @IsDate()
  @Type(() => Date)
  approvalDate: Date;

  @IsString()
  @IsOptional()
  courtOrderNumber?: string;
}
