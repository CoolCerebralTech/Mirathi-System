import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { AddFamilyMemberDto } from './add-family-member.dto';

export class UpdateFamilyMemberDto extends PartialType(AddFamilyMemberDto) {
  @IsString()
  @IsOptional()
  notes?: string;
}
