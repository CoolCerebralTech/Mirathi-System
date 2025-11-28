import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateMarriageDto {
  @IsDateString()
  @IsOptional()
  marriageDate?: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;
}
