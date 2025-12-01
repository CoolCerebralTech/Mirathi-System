import { IsOptional, IsString } from 'class-validator';

export class MarkWillWitnessedDto {
  @IsString()
  @IsOptional()
  witnessingNotes?: string;
}
