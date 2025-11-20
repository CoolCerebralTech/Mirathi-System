import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  Matches,
  ValidateIf,
} from 'class-validator';

export class AddWitnessDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @ValidateIf((o) => !o.userId)
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsPhoneNumber('KE')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  // Matches Kenyan National ID (7-9 digits)
  @Matches(/^\d{7,9}$/, { message: 'Invalid Kenyan National ID format' })
  idNumber?: string;
}
