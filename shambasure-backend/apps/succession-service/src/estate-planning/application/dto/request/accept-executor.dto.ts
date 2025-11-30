import { IsOptional, IsString } from 'class-validator';

export class AcceptExecutorDto {
  @IsString()
  @IsOptional()
  acceptanceNotes?: string;
}
