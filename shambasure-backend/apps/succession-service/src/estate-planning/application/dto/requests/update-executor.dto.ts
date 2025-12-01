import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { CreateExecutorExternalDto } from './create-executor-external.dto';

export class UpdateExecutorDto extends PartialType(CreateExecutorExternalDto) {
  @IsString()
  @IsOptional()
  updateReason?: string;

  @IsString()
  @IsOptional()
  relationshipDuration?: string;

  @IsString()
  @IsOptional()
  preferredContactMethod?: string;

  @IsString()
  @IsOptional()
  languagePreference?: string;
}
