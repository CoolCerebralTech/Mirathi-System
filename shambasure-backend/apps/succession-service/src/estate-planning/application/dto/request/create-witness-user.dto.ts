// create-witness-user.dto.ts
import { WitnessType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWitnessUserDto {
  @IsString()
  @IsNotEmpty()
  witnessId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsOptional()
  relationship?: string;

  @IsEnum(WitnessType)
  witnessType: WitnessType = WitnessType.REGISTERED_USER;
}
