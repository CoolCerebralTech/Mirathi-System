import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateMarriageDto {
  @IsDateString()
  @IsOptional()
  marriageDate?: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;
}
