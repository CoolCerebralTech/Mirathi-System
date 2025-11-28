import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty({ message: 'Family name is required (e.g. "The Kamau Family")' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
