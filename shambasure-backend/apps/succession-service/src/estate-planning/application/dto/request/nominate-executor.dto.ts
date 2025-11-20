import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsBoolean,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';

export class NominateExecutorDto {
  // --- Identity Options ---
  @IsString()
  @IsOptional()
  userId?: string; // If existing user

  @ValidateIf((o) => !o.userId) // Required if userId is missing
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  // Enforce Kenyan phone number format strictly
  @IsPhoneNumber('KE')
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  // --- Role ---
  @IsBoolean()
  isPrimary: boolean;

  @IsNumber()
  @Min(1)
  priorityOrder: number; // 1 = Primary choice, 2 = Alternate 1
}
