// reject-witness.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectWitnessDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}
