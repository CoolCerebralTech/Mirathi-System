import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateWillDto {
  @IsString()
  @IsNotEmpty()
  activatedBy: string;
}
