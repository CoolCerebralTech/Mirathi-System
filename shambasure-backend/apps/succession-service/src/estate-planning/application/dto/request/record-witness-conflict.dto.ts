// record-witness-conflict.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class RecordWitnessConflictDto {
  @IsString()
  @IsNotEmpty()
  conflictDetails: string;
}
