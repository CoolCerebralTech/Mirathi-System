import { IsNotEmpty, IsString } from 'class-validator';

export class ContestWillDto {
  @IsString()
  @IsNotEmpty()
  disputeId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
