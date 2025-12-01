import { BequestConditionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddBeneficiaryConditionDto {
  @IsEnum(BequestConditionType)
  conditionType: BequestConditionType;

  @IsString()
  @IsNotEmpty()
  conditionDetails: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  conditionDeadline?: Date;
}
