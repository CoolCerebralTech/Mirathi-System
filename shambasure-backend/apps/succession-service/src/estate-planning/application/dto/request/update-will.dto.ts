import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { CreateWillDto } from './create-will.dto';

export class UpdateWillDto extends PartialType(CreateWillDto) {
  @IsString()
  @IsOptional()
  updateReason?: string;
}
