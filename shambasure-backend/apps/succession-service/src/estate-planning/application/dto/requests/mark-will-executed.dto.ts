// mark-will-executed.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class MarkWillExecutedDto {
  @IsString()
  @IsNotEmpty()
  executedBy: string;
}
