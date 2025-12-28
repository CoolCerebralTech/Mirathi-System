import { IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export class VehicleAssetDetailsDto {
  @IsString()
  @IsNotEmpty()
  // Matches modern (KAA 123A), old (KAA 123), and diplomatic (123 CD 456) loosely
  @Matches(/^[A-Z0-9\s]+$/, { message: 'Invalid Number Plate format' })
  registrationNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  chassisNumber: string;

  @IsString()
  @IsOptional()
  logbookNumber?: string;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsString()
  @IsOptional()
  engineNumber?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
