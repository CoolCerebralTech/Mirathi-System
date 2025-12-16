import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

import { AddFamilyMemberDto } from './add-family-member.dto';

export class UpdateFamilyMemberDto extends PartialType(AddFamilyMemberDto) {
  @IsOptional()
  @IsString()
  disabilityType?: string; // Specific update for disability
}
