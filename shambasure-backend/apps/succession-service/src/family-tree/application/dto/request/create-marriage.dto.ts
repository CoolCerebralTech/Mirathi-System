import { IsUUID, IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { MarriageStatus } from '@prisma/client';

export class CreateMarriageDto {
  @IsUUID()
  @IsNotEmpty()
  spouse1Id: string;

  @IsUUID()
  @IsNotEmpty()
  spouse2Id: string;

  @IsEnum(MarriageStatus)
  type: MarriageStatus;

  @IsDateString()
  @IsNotEmpty()
  marriageDate: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string; // Mandatory for Civil, optional for Customary initially
}
