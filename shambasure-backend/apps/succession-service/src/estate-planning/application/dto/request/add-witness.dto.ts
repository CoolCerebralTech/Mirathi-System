import { IsNotEmpty, IsString } from 'class-validator';

export class AddWitnessDto {
  @IsString()
  @IsNotEmpty()
  witnessId: string;
}
