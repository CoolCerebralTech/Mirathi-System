import { IsNotEmpty, IsString } from 'class-validator';

export class DeclineExecutorDto {
  @IsString()
  @IsNotEmpty()
  declineReason: string;
}
