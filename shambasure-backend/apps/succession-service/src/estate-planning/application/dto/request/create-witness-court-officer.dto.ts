// create-witness-court-officer.dto.ts
import { WitnessType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWitnessCourtOfficerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  courtStation: string;

  @IsString()
  @IsOptional()
  badgeNumber?: string;

  @IsEnum(WitnessType)
  witnessType: WitnessType = WitnessType.COURT_OFFICER;
}
