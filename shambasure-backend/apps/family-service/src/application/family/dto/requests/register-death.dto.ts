import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeathDto {
  @IsNotEmpty()
  @IsDateString()
  dateOfDeath: string;

  @IsOptional()
  @IsString()
  placeOfDeath?: string;

  @IsOptional()
  @IsString()
  deathCertificateNumber?: string;

  @IsOptional()
  @IsString()
  causeOfDeath?: string;
}
