// update-witness.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { CreateWitnessExternalDto } from './create-witness-external.dto';

export class UpdateWitnessDto extends PartialType(CreateWitnessExternalDto) {
  @IsString()
  @IsOptional()
  updateReason?: string;

  @IsString()
  @IsOptional()
  relationshipDuration?: string;

  @IsString()
  @IsOptional()
  residentialCounty?: string;
}
