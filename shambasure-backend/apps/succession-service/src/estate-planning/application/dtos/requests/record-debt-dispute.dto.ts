import { IsNotEmpty, IsString } from 'class-validator';

export class RecordDebtDisputeDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
