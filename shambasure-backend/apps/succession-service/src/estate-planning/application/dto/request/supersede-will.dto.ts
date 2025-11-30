import { IsNotEmpty, IsString } from 'class-validator';

export class SupersedeWillDto {
  @IsString()
  @IsNotEmpty()
  newWillId: string;
}
