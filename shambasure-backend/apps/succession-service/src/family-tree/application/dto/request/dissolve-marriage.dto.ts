import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class DissolveMarriageDto {
  @IsDateString()
  @IsNotEmpty()
  divorceDate: string;

  @IsString()
  @IsNotEmpty()
  divorceCertNumber: string; // Decree Absolute Number or Court Order
}
