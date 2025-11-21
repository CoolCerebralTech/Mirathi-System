import { PartialType } from '@nestjs/mapped-types';
import { AddFamilyMemberDto } from './add-family-member.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFamilyMemberDto extends PartialType(AddFamilyMemberDto) {
  @IsString()
  @IsOptional()
  notes?: string;
}
