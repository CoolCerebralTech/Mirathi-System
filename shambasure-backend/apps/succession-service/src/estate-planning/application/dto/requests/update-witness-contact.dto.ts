// update-witness-contact.dto.ts
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateWitnessContactDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  residentialCounty?: string;
}
