import { MarriageStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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
